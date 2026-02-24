import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { NodeType } from "@/generated/prisma/enums";
import { getExecutor } from "@/features/executions/lib/executor-registry";

export const executeWorkflow = inngest.createFunction(
  { id: "execute-workflow" },
  { event: "workflows/execute.workflow" },
  async ({ event, step }) => {
    const workflowId = event.data.workflowId;

    if (!workflowId) {
      throw new NonRetriableError("Workflow ID is missing!");
    }

    const sortedNodes = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: { nodes: true, connections: true },
      });

      const triggerTypes: string[] = [
        NodeType.INITIAL,
        NodeType.MANUAL_TRIGGER,
      ];
      const executionNodes = workflow.nodes.filter(
        (n) => !triggerTypes.includes(n.type)
      );

      if (executionNodes.length > 0 && workflow.connections.length === 0) {
        throw new NonRetriableError(
          "Workflow has execution nodes but no connections. Connect your nodes before running."
        );
      }

      const connectedTargetIds = new Set(
        workflow.connections.map((c) => c.toNodeId)
      );
      const disconnected = executionNodes.filter(
        (n) => !connectedTargetIds.has(n.id)
      );
      if (disconnected.length > 0) {
        throw new NonRetriableError(
          `Disconnected execution nodes: ${disconnected
            .map((n) => n.name)
            .join(", ")}. Connect all nodes before running.`
        );
      }

      return topologicalSort(workflow.nodes, workflow.connections);
    });

    // Initialize the context with any initial data from the trigger
    let context = event.data.initialData || {};

    // Execute each node
    for (const node of sortedNodes) {
      const executor = getExecutor(node.type);
      context = await executor({
        data: node.data as Record<string, unknown>,
        nodeId: node.id,
        context,
        step,
      });
    }

    return {
      workflowId,
      result: context,
    };
  }
);
