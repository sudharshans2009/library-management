/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/admin-request-list.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  CheckCircle,
  XCircle,
  Book,
  Calendar,
  User,
  MessageCircle,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { getRequests, respondToRequestWithAction } from "@/actions/requests";
import type { RequestSearchOptions } from "@/lib/services/requests";

interface AdminRequestListProps {
  searchOptions?: RequestSearchOptions;
}

export function AdminRequestList({
  searchOptions = {},
}: AdminRequestListProps) {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [responseAction, setResponseAction] = useState<"APPROVED" | "REJECTED">(
    "APPROVED",
  );
  const [customDueDate, setCustomDueDate] = useState("");
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ["admin", "requests", searchOptions],
    queryFn: () => getRequests(searchOptions),
  });

  const respondMutation = useMutation({
    mutationFn: respondToRequestWithAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message, {
          description: result.data
            ? `Action: ${result.data.actionType}`
            : undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["admin", "requests"] });
        setResponseDialogOpen(false);
        setSelectedRequest(null);
        setResponseText("");
        setCustomDueDate("");
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error("Failed to respond to request");
      console.error("Respond to request error:", error);
    },
  });

  const handleRespond = (action: "APPROVED" | "REJECTED") => {
    if (!selectedRequest || !responseText.trim()) return;

    const actionData: any = {};

    // Add custom data for specific request types
    if (
      action === "APPROVED" &&
      selectedRequest.type === "CHANGE_DUE_DATE" &&
      customDueDate
    ) {
      actionData.newDueDate = customDueDate;
    }

    respondMutation.mutate({
      requestId: selectedRequest.id,
      status: action,
      adminResponse: responseText.trim(),
      actionData: Object.keys(actionData).length > 0 ? actionData : undefined,
    });
  };

  const openResponseDialog = (
    request: any,
    action: "APPROVED" | "REJECTED",
  ) => {
    setSelectedRequest(request);
    setResponseAction(action);
    setResponseDialogOpen(true);

    // Set default response text based on action and request type
    if (action === "APPROVED") {
      setResponseText(getDefaultApprovalMessage(request.type));
    } else {
      setResponseText("Request has been reviewed and rejected.");
    }

    // Reset custom due date
    setCustomDueDate("");
  };

  const getDefaultApprovalMessage = (requestType: string): string => {
    const messages: Record<string, string> = {
      EXTEND_BORROW: "Your borrow period has been extended by 7 days.",
      REPORT_LOST:
        "Lost book report processed. Please be more careful with library materials.",
      REPORT_DAMAGE:
        "Damage report processed. Please be more careful with library materials.",
      EARLY_RETURN:
        "Thank you for returning the book early. Your request has been processed.",
      CHANGE_DUE_DATE: "Your due date has been updated as requested.",
      OTHER: "Your request has been reviewed and approved.",
    };
    return messages[requestType] || "Your request has been approved.";
  };

  const getActionWarning = (requestType: string): string | null => {
    const warnings: Record<string, string> = {
      REPORT_LOST:
        "⚠️ This will remove the book from inventory and suspend the user for 1 week.",
      REPORT_DAMAGE:
        "⚠️ This will remove the book from inventory and suspend the user for 1 week.",
      EXTEND_BORROW: "ℹ️ This will extend the due date by 7 days.",
      EARLY_RETURN:
        "ℹ️ This will mark the book as returned and make it available.",
      CHANGE_DUE_DATE:
        "ℹ️ This will change the due date to your specified date.",
    };
    return warnings[requestType] || null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "outline" as const;
      case "APPROVED":
        return "default" as const;
      case "REJECTED":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels = {
      EXTEND_BORROW: "Extend Borrow",
      REPORT_LOST: "Report Lost",
      REPORT_DAMAGE: "Report Damage",
      EARLY_RETURN: "Early Return",
      CHANGE_DUE_DATE: "Change Due Date",
      OTHER: "Other",
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (requestsQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center max-w-7xl mx-auto px-5">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 bg-primary/10 rounded-full animate-pulse mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-lg font-medium">Loading requests...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch the information
          </p>
        </div>
      </div>
    );
  }

  if (requestsQuery.error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Failed to load requests</p>
      </div>
    );
  }

  const requests = requestsQuery.data?.data?.requests || [];

  if (requests.length === 0) {
    return (
      <div className="text-center p-8">
        <Book className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
          No requests found
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No requests match your current filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge
                      variant={getStatusVariant(request.status)}
                      className="gap-1"
                    >
                      {getStatusIcon(request.status)}
                      {request.status}
                    </Badge>
                    <span className="text-lg">
                      {getRequestTypeLabel(request.type)}
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Request #{request.id.slice(0, 8)} •{" "}
                    {format(new Date(request.createdAt!), "PPP")}
                  </CardDescription>
                </div>
                {request.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => openResponseDialog(request, "APPROVED")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openResponseDialog(request, "REJECTED")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Information */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{request.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.config.class}-{request.config.section} • Roll:{" "}
                    {request.config.rollNo}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {request.user.email}
                  </p>
                </div>
              </div>

              {/* Book Information */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Book className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{request.book.title}</p>
                  <p className="text-sm text-muted-foreground">
                    by {request.book.author}
                  </p>
                </div>
              </div>

              {/* Request Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Reason:</span>
                  <span className="text-sm">{request.reason}</span>
                </div>

                {request.description && (
                  <div className="pl-6">
                    <p className="text-sm text-muted-foreground">
                      {request.description}
                    </p>
                  </div>
                )}

                {request.requestedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Requested Date:</span>
                    <span className="text-sm">
                      {format(new Date(request.requestedDate), "PPP")}
                    </span>
                  </div>
                )}
              </div>

              {/* Borrow Record Information */}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Borrowed:{" "}
                  {request.borrowRecord.borrowDate
                    ? format(new Date(request.borrowRecord.borrowDate), "PPP")
                    : "N/A"}
                </p>
                <p>
                  Due:{" "}
                  {request.borrowRecord.dueDate
                    ? format(new Date(request.borrowRecord.dueDate), "PPP")
                    : "N/A"}
                </p>
                <p>Status: {request.borrowRecord.status}</p>
              </div>

              {/* Admin Response */}
              {request.adminResponse && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">Admin Response:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {request.adminResponse}
                  </p>
                  {request.resolvedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Resolved: {format(new Date(request.resolvedAt), "PPP")}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {responseAction === "APPROVED" ? "Approve" : "Reject"} Request
            </DialogTitle>
            <DialogDescription>
              {responseAction === "APPROVED" ? "Approve and process" : "Reject"}{" "}
              this {getRequestTypeLabel(selectedRequest?.type || "")} request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Action Warning */}
            {responseAction === "APPROVED" &&
              selectedRequest &&
              getActionWarning(selectedRequest.type) && (
                <div className="p-3 border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {getActionWarning(selectedRequest.type)}
                    </p>
                  </div>
                </div>
              )}

            {/* Custom Due Date for CHANGE_DUE_DATE requests */}
            {responseAction === "APPROVED" &&
              selectedRequest?.type === "CHANGE_DUE_DATE" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-due-date">New Due Date</Label>
                  <Input
                    id="custom-due-date"
                    type="date"
                    value={customDueDate}
                    onChange={(e) => setCustomDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    Select the new due date for this book
                  </p>
                </div>
              )}

            {/* Response Text */}
            <div className="space-y-2">
              <Label htmlFor="response">Response Message</Label>
              <Textarea
                id="response"
                placeholder="Enter your response..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResponseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleRespond(responseAction)}
              disabled={
                respondMutation.isPending ||
                !responseText.trim() ||
                (responseAction === "APPROVED" &&
                  selectedRequest?.type === "CHANGE_DUE_DATE" &&
                  !customDueDate)
              }
              className={
                responseAction === "APPROVED"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
            >
              {respondMutation.isPending
                ? "Processing..."
                : responseAction === "APPROVED"
                  ? "Approve & Process"
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
