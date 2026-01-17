"use client";

import { PlusIcon } from "lucide-react";
import { memo, } from "react";
import { Button } from "@/components/ui/button";

export const AddNodeButton = () => {
  return (
    <Button variant="outline" size="icon" className="bg-background">
      <PlusIcon className="size-4" />
    </Button>
  );
};

AddNodeButton.displayName = "AddNodeButton";