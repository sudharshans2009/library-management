/* eslint-disable @typescript-eslint/no-explicit-any */
// components/requests/request-history.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  AlertTriangle,
  BookOpen,
  Ban,
  RefreshCw
} from "lucide-react";

interface RequestHistoryProps {
  request: any;
}

export function RequestHistory({ request }: RequestHistoryProps) {
  const getActionBadge = (actionType: string) => {
    const badges: Record<string, { icon: any; variant: any; label: string }> = {
      extend_borrow: {
        icon: Calendar,
        variant: "default",
        label: "Extended +7 days"
      },
      report_lost: {
        icon: AlertTriangle,
        variant: "destructive", 
        label: "Book Removed & User Suspended"
      },
      report_damage: {
        icon: AlertTriangle,
        variant: "destructive",
        label: "Book Removed & User Suspended"
      },
      early_return: {
        icon: BookOpen,
        variant: "default",
        label: "Marked as Returned"
      },
      change_due_date: {
        icon: Calendar,
        variant: "outline",
        label: "Due Date Changed"
      },
      message_only: {
        icon: CheckCircle,
        variant: "secondary",
        label: "Acknowledged"
      },
    };

    const config = badges[actionType];
    if (!config) return null;

    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Request History</span>
          <Badge
            variant={
              request.status === "APPROVED" ? "default" :
              request.status === "REJECTED" ? "destructive" : "outline"
            }
          >
            {request.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>Created: {new Date(request.createdAt).toLocaleString()}</span>
          </div>
          
          {request.resolvedAt && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Resolved: {new Date(request.resolvedAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        {request.actionData && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium text-sm mb-2">Action Taken:</p>
            {getActionBadge(request.actionData.actionType)}
            
            {request.actionData.oldDueDate && request.actionData.newDueDate && (
              <div className="mt-2 text-xs text-muted-foreground">
                Due date: {new Date(request.actionData.oldDueDate).toLocaleDateString()} → {new Date(request.actionData.newDueDate).toLocaleDateString()}
              </div>
            )}
            
            {request.actionData.suspensionDays && (
              <div className="mt-2 text-xs text-red-600">
                User suspended for {request.actionData.suspensionDays} days
              </div>
            )}
          </div>
        )}

        {request.adminResponse && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium text-sm">Admin Response:</p>
            <p className="text-sm text-muted-foreground mt-1">
              {request.adminResponse}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}