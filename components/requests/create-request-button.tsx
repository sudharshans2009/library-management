"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateRequestForm } from "@/components/forms/create-request";
import { MessageSquare } from "lucide-react";

interface CreateRequestButtonProps {
  borrowRecordId: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function CreateRequestButton({
  borrowRecordId,
  variant = "outline",
  size = "sm",
  className,
}: CreateRequestButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Request</DialogTitle>
          <DialogDescription>
            Submit a request related to this borrowed book (extend period,
            report issues, etc.)
          </DialogDescription>
        </DialogHeader>
        <CreateRequestForm
          borrowRecordId={borrowRecordId}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
