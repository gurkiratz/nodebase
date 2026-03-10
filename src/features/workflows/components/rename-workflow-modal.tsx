"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateWorkflowName } from "../hooks/use-workflows";

interface RenameWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  currentName: string;
}

export const RenameWorkflowModal = ({
  open,
  onOpenChange,
  workflowId,
  currentName,
}: RenameWorkflowModalProps) => {
  const [name, setName] = useState(currentName);
  const updateWorkflow = useUpdateWorkflowName();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(currentName);
      // Focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open, currentName]);

  const handleSave = async () => {
    if (name.trim() === "" || name === currentName) {
      onOpenChange(false);
      return;
    }

    try {
      await updateWorkflow.mutateAsync({
        id: workflowId,
        name: name.trim(),
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook (toast notification)
      setName(currentName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setName(currentName);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Workflow</DialogTitle>
          <DialogDescription>
            Enter a new name for your workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Workflow name"
            disabled={updateWorkflow.isPending}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setName(currentName);
              onOpenChange(false);
            }}
            disabled={updateWorkflow.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateWorkflow.isPending || name.trim() === ""}
          >
            {updateWorkflow.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
