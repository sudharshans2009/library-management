"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { adminRespondToRequest } from "@/actions/requests";
import { formatDistanceToNow } from "date-fns";

interface Request {
  id: string;
  type: string;
  title: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  adminResponse?: string;
  adminId?: string;
  admin?: {
    name: string;
  };
  respondedAt?: string;
}

interface AdminRequestsTableProps {
  data: {
    requests: Request[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export default function AdminRequestsTable({ data }: AdminRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [response, setResponse] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED" | null>(null);

  const queryClient = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: adminRespondToRequest,
    onSuccess: () => {
      toast.success("Request updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setResponse("");
      setActionType(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update request");
    },
  });

  const handleRespond = (request: Request, action: "APPROVED" | "REJECTED") => {
    setSelectedRequest(request);
    setActionType(action);
    setIsDialogOpen(true);
  };

  const handleSubmitResponse = () => {
    if (!selectedRequest || !actionType) return;

    respondMutation.mutate({
      requestId: selectedRequest.id,
      status: actionType,
      response: response.trim() || undefined,
    });
  };

  const getStatusBadge = (status: Request["status"]) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: Request["priority"]) => {
    switch (priority) {
      case "HIGH":
        return <Badge variant="destructive">High</Badge>;
      case "MEDIUM":
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Medium</Badge>;
      case "LOW":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (data.requests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground">
              There are no user requests to review at the moment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Requests</CardTitle>
          <CardDescription>
            Total {data.total} requests • Page {data.page} of {data.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {request.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.type}</Badge>
                    </TableCell>
                    <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType(null);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {request.status === "PENDING" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleRespond(request, "APPROVED")}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRespond(request, "REJECTED")}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      {selectedRequest && !actionType && (
        <Dialog
          open={!!selectedRequest}
          onOpenChange={() => setSelectedRequest(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedRequest.title}</DialogTitle>
              <DialogDescription>
                Request #{selectedRequest.id.slice(0, 8)} • {selectedRequest.type}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Request Details</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.description}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Submitted by</h4>
                  <p className="text-sm">{selectedRequest.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedRequest.user.email}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Priority</h4>
                  {getPriorityBadge(selectedRequest.priority)}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Current Status</h4>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {selectedRequest.adminResponse && (
                <div>
                  <h4 className="font-semibold mb-2">Admin Response</h4>
                  <p className="text-sm bg-muted p-3 rounded">
                    {selectedRequest.adminResponse}
                  </p>
                  {selectedRequest.admin && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Responded by {selectedRequest.admin.name} •{" "}
                      {selectedRequest.respondedAt &&
                        formatDistanceToNow(new Date(selectedRequest.respondedAt), {
                          addSuffix: true,
                        })}
                    </p>
                  )}
                </div>
              )}

              {selectedRequest.status === "PENDING" && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleRespond(selectedRequest, "APPROVED")}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRespond(selectedRequest, "REJECTED")}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Response Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "APPROVED" ? "Approve" : "Reject"} Request
            </DialogTitle>
            <DialogDescription>
              {actionType === "APPROVED"
                ? "Provide a response to approve this request."
                : "Provide a reason for rejecting this request."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Response {actionType === "REJECTED" ? "(Required)" : "(Optional)"}
              </label>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder={
                  actionType === "APPROVED"
                    ? "Add any additional information about the approval..."
                    : "Explain why this request is being rejected..."
                }
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitResponse}
                disabled={
                  respondMutation.isPending ||
                  (actionType === "REJECTED" && !response.trim())
                }
                className="flex-1"
              >
                {respondMutation.isPending ? "Processing..." : "Submit"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
