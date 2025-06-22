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
} from "lucide-react";
import { toast } from "sonner";

import { getRequests, respondToRequest } from "@/actions/requests";
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
    "APPROVED"
  );
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ["admin", "requests", searchOptions],
    queryFn: () => getRequests(searchOptions),
  });

  const respondMutation = useMutation({
    mutationFn: respondToRequest,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["admin", "requests"] });
        setResponseDialogOpen(false);
        setSelectedRequest(null);
        setResponseText("");
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

    respondMutation.mutate({
      requestId: selectedRequest.id,
      status: action,
      adminResponse: responseText.trim(),
    });
  };

  const openResponseDialog = (
    request: any,
    action: "APPROVED" | "REJECTED"
  ) => {
    setSelectedRequest(request);
    setResponseAction(action);
    setResponseDialogOpen(true);
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
          <p className="text-lg font-medium">Loading your requests...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch your information
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
                      variant="outline"
                      size="sm"
                      onClick={() => openResponseDialog(request, "APPROVED")}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openResponseDialog(request, "REJECTED")}
                      className="text-red-600 border-red-600 hover:bg-red-50"
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

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === "APPROVED" ? "Approve" : "Reject"} Request
            </DialogTitle>
            <DialogDescription>
              Provide a response for this{" "}
              {getRequestTypeLabel(selectedRequest?.type || "")} request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={`Enter your ${responseAction === "APPROVED" ? "approval" : "rejection"} message...`}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="min-h-[100px]"
            />
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
              disabled={!responseText.trim() || respondMutation.isPending}
              variant={
                responseAction === "APPROVED" ? "default" : "destructive"
              }
            >
              {respondMutation.isPending
                ? "Processing..."
                : responseAction === "APPROVED"
                  ? "Approve"
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
