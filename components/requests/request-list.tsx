// components/requests/request-list.tsx
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  CheckCircle,
  XCircle,
  Undo2,
  Book,
  Calendar,
  User,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

import { getRequests, rescindRequest } from "@/actions/requests";
import type { RequestSearchOptions } from "@/lib/services/requests";

interface RequestListProps {
  searchOptions?: RequestSearchOptions;
  showUserInfo?: boolean;
}

export function RequestList({
  searchOptions = {},
  showUserInfo = false,
}: RequestListProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ["requests", searchOptions],
    queryFn: () => getRequests(searchOptions),
  });

  const rescindMutation = useMutation({
    mutationFn: rescindRequest,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["requests"] });
        setSelectedRequestId(null);
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error("Failed to rescind request");
      console.error("Rescind request error:", error);
    },
  });

  const handleRescind = (requestId: string) => {
    rescindMutation.mutate({ requestId });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      case "RESCINDED":
        return <Undo2 className="h-4 w-4" />;
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
      case "RESCINDED":
        return "secondary" as const;
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequestId(request.id)}
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      Rescind
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rescind Request</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to rescind this request? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setSelectedRequestId(null)}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRescind(request.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Rescind Request
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {/* User Information (if admin view) */}
            {showUserInfo && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{request.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.config.class}-{request.config.section} • Roll:{" "}
                    {request.config.rollNo}
                  </p>
                </div>
              </div>
            )}

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
  );
}
