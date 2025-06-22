"use client";

import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AddBookButton({ bookId }: { bookId: number | string }) {
  const router = useRouter();
  const { mutate, isPending } = useMutation({
    mutationFn: async (confirm?: boolean) => {
      const url = confirm
        ? `/books/${bookId}/get?confirm=true`
        : `/books/${bookId}/get`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw { status: response.status, data };
      }

      return data;
    },
    onMutate: () => {
      toast.loading("Borrowing book...", {
        id: `add-book-${bookId}`,
      });
    },
    onSuccess: (data) => {
      const isPending = data.borrowRecord.status === "PENDING";
      if (data.redirect) {
        router.push(data.redirect);
      }
      toast.success("Book borrowed successfully!", {
        id: `add-book-${bookId}`,
        description: isPending
          ? "Your request is pending approval"
          : `Due date: ${new Date(
              data.borrowRecord.dueDate
            ).toLocaleDateString()}`,
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const { status, data } = error;
      if (data.redirect) {
        router.push(data.redirect);
      }
      // Handle account status errors
      if (status === 403) {
        if (data.error === "Account pending approval") {
          toast.error("Account Pending Approval", {
            id: `add-book-${bookId}`,
            description:
              "Your account is awaiting admin approval. You cannot request books until approved.",
            duration: 8000,
          });
        } else if (data.error === "Account inactive") {
          toast.error("Account Inactive", {
            id: `add-book-${bookId}`,
            description:
              "Your account is inactive. Please contact an administrator to reactivate your account.",
            duration: 8000,
          });
        } else {
          toast.error("Account Access Restricted", {
            id: `add-book-${bookId}`,
            description:
              data.message ||
              "Your account does not have permission to request books.",
            duration: 8000,
          });
        }
      } else if (status === 409 && data.error === "Confirmation required") {
        toast.info("Confirmation required", {
          id: `add-book-${bookId}`,
          description: data.message,
          action: {
            label: "Confirm",
            onClick: () => mutate(true),
          },
          duration: 10000, // Keep toast longer for confirmation
        });
      } else {
        toast.error("Failed to borrow book", {
          id: `add-book-${bookId}`,
          description: data.message || "An unexpected error occurred",
        });
      }
    },
  });

  const handleAddBook = () => {
    mutate(false);
  };

  return (
    <Button size="2xl" onClick={handleAddBook} disabled={isPending}>
      {isPending ? "Borrowing..." : "Borrow Book"}
    </Button>
  );
}
