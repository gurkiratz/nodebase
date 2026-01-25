import { Button } from "@/components/ui/button";
import {
  useExecuteWorkflow,
  useUpdateWorkflow,
} from "@/features/workflows/hooks/use-workflows";
import { FlaskConicalIcon } from "lucide-react";
import { useAtomValue } from "jotai";
import { editorAtom } from "../store/atoms";

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
      // Don't execute if save failed
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
