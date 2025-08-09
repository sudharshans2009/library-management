/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Ban, CheckCircle } from "lucide-react";
import { unsuspendUserAction } from "@/actions/requests";

interface UserActionsProps {
  user: any;
  config: any;
}

export function UserActions({ user, config }: UserActionsProps) {
  const queryClient = useQueryClient();

  const unsuspendMutation = useMutation({
    mutationFn: () => unsuspendUserAction(user.id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      } else {
        toast.error(result.message);
      }
    },
  });

  if (config.status === "SUSPENDED") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive" className="gap-1">
          <Ban className="w-3 h-3" />
          SUSPENDED
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => unsuspendMutation.mutate()}
          disabled={unsuspendMutation.isPending}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Lift Suspension
        </Button>
      </div>
    );
  }

  return (
    <Badge
      variant={config.status === "APPROVED" ? "default" : "outline"}
      className="gap-1"
    >
      <Shield className="w-3 h-3" />
      {config.status}
    </Badge>
  );
}
