/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Check,
  Clock,
  AlertCircle,
  BookOpen,
  Calendar,
  Users,
  Loader2,
} from "lucide-react";
import { borrowBook, getBookById } from "@/actions/books";
import { auth } from "@/lib/auth/main";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface AddBookButtonProps {
  bookId: string | number;
  className?: string;
}

export function AddBookButton({ bookId, className }: AddBookButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);

  // Enhanced mutation with better error handling
  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (confirm?: boolean) => {
      return await borrowBook({ bookId: String(bookId), confirm });
    },
    onSuccess: (result) => {
      // Dismiss loading toast
      toast.dismiss(`borrow-${bookId}`);

      if (result.redirect) {
        toast.success("Redirecting to setup...");
        router.push(result.redirect);
        return;
      }

      if (result.success) {
        const isPendingApproval =
          result.data?.borrowRecord.status === "PENDING";

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["books"] });
        queryClient.invalidateQueries({ queryKey: ["book", String(bookId)] });
        queryClient.invalidateQueries({ queryKey: ["user", "borrow-records"] });

        if (isPendingApproval) {
          toast.success("Borrow request submitted!", {
            description: "Your request is pending admin approval",
            icon: <Clock className="w-4 h-4" />,
            duration: 5000,
          });
        } else {
          toast.success("Book borrowed successfully!", {
            description: `Due: ${new Date(
              result.data?.borrowRecord.dueDate || ""
            ).toLocaleDateString()}`,
            icon: <Check className="w-4 h-4" />,
            duration: 5000,
            action: {
              label: "View Record",
              onClick: () =>
                router.push(`/records/${result.data?.borrowRecord.id}`),
            },
          });
        }
      } else {
        if (result.requiresConfirmation) {
          setConfirmationData(result);
          setShowConfirmDialog(true);
        } else {
          toast.error("Cannot borrow book", {
            description: result.message,
            icon: <AlertCircle className="w-4 h-4" />,
            duration: 6000,
          });
        }
      }
    },
    onError: (error) => {
      toast.dismiss(`borrow-${bookId}`);
      console.error("Borrow error:", error);

      toast.error("Borrowing failed", {
        description: "An unexpected error occurred. Please try again.",
        icon: <AlertCircle className="w-4 h-4" />,
        duration: 6000,
      });
    },
  });

  const handleBorrow = () => {
    toast.loading("Processing borrow request...", {
      id: `borrow-${bookId}`,
    });
    mutate(false);
  };

  const handleConfirmBorrow = () => {
    setShowConfirmDialog(false);
    toast.loading("Confirming borrow request...", {
      id: `borrow-${bookId}`,
    });
    mutate(true);
  };

  // Dynamic button states and styling
  const getButtonContent = () => {
    if (isPending) {
      return (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Processing...
        </>
      );
    }

    if (isSuccess) {
      return (
        <>
          <Check className="w-5 h-5 mr-2" />
          Borrowed!
        </>
      );
    }

    return (
      <>
        <BookOpen className="w-5 h-5 mr-2" />
        Borrow Book
      </>
    );
  };

  const buttonVariant = isSuccess ? "default" : "default";
  const buttonSize = "lg";

  return (
    <>
      <Button
        size={buttonSize}
        variant={buttonVariant}
        onClick={handleBorrow}
        disabled={isPending || isSuccess}
        className={cn("min-w-[200px] font-semibold text-lg", className)}
      >
        {getButtonContent()}
      </Button>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Confirm Borrow Request
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{confirmationData?.message}</p>

              {confirmationData?.details && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span className="font-medium">
                          {confirmationData.details.dueDate}
                        </span>
                      </div>
                      {confirmationData.details.waitingList && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Position in queue:
                          </span>
                          <Badge variant="outline">
                            #{confirmationData.details.position}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBorrow}>
              Confirm Borrow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Additional component for book availability status
export function BookAvailabilityStatus({
  availableCopies,
  totalCopies,
}: {
  availableCopies: number;
  totalCopies: number;
}) {
  const availabilityPercentage = (availableCopies / totalCopies) * 100;
  const isAvailable = availableCopies > 0;

  return (
    <Card
      className={`border-2 ${isAvailable ? "border-green-200" : "border-red-200"}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Availability
          </span>
          <Badge
            variant={isAvailable ? "default" : "destructive"}
            className="text-xs"
          >
            {isAvailable ? "Available" : "Unavailable"}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Available</span>
            <span className="font-medium">
              {availableCopies}/{totalCopies}
            </span>
          </div>
          <Progress value={availabilityPercentage} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {isAvailable
              ? `${availableCopies} copies available`
              : "Currently checked out"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
