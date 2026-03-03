import { Button } from "@/components/ui/button";
import {
  useExecuteWorkflow,
  useUpdateWorkflow,
} from "@/features/workflows/hooks/use-workflows";
import { FlaskConicalIcon } from "lucide-react";
import { useAtomValue } from "jotai";
import { editorAtom } from "../store/atoms";
import { toast } from "sonner";
import { NodeType } from "@/generated/prisma/enums";
import type { Node } from "@xyflow/react";

const TRIGGER_NODE_TYPES: string[] = [
  NodeType.INITIAL,
  NodeType.MANUAL_TRIGGER,
];

type NodeConfigValidator = (node: Node) => string | null;

const nodeConfigValidators: Partial<Record<string, NodeConfigValidator>> = {
  [NodeType.HTTP_REQUEST]: (node) => {
    const data = node.data as Record<string, unknown>;
    if (!data.endpoint) return "HTTP Request node is missing an endpoint URL";
    if (!data.variableName)
      return "HTTP Request node is missing a variable name";
    return null;
  },
};

const validateNodeConfigurations = (nodes: Node[]): string[] => {
  const errors: string[] = [];
  for (const node of nodes) {
    const validator = nodeConfigValidators[node.type ?? ""];
    if (validator) {
      const error = validator(node);
      if (error) errors.push(error);
    }
  }
  return errors;
};

export const ExecuteWorkflowButton = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const editor = useAtomValue(editorAtom);
  const saveWorkflow = useUpdateWorkflow();
  const executeWorkflow = useExecuteWorkflow();

  const handleExecute = async () => {
    if (!editor) {
      return;
    }

    const nodes = editor.getNodes();
    const edges = editor.getEdges();

    const executionNodes = nodes.filter(
      (node) => !TRIGGER_NODE_TYPES.includes(node.type ?? "")
    );

    if (executionNodes.length > 0) {
      const connectedNodeIds = new Set(edges.map((e) => e.target));
      const disconnectedNodes = executionNodes.filter(
        (node) => !connectedNodeIds.has(node.id)
      );

      if (disconnectedNodes.length > 0) {
        toast.error(
          "All execution nodes must be connected. Link your nodes before running the workflow."
        );
        return;
      }
    }

    const configErrors = validateNodeConfigurations(executionNodes);
    if (configErrors.length > 0) {
      for (const error of configErrors) {
        toast.error(error);
      }
      return;
    }

    try {
      // Save workflow first
      await saveWorkflow.mutateAsync({
        id: workflowId,
        nodes,
        edges,
      });

      // Execute only if save succeeded
      executeWorkflow.mutate({ id: workflowId });
    } catch {
      // Error toast is already handled in useUpdateWorkflow hook
    }
  };

  const isPending = saveWorkflow.isPending || executeWorkflow.isPending;
  const buttonText = saveWorkflow.isPending
    ? "Saving..."
    : executeWorkflow.isPending
    ? "Executing..."
    : "Execute workflow";

  return (
    <Button size="lg" onClick={handleExecute} disabled={isPending}>
      <FlaskConicalIcon
        className={`size-4${isPending ? " animate-spin" : ""}`}
      />
      {buttonText}
    </Button>
  );
};
