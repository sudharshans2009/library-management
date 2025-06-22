"use client";

import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { borrowBook } from "@/actions/books";

export function AddBookButton({ bookId }: { bookId: number | string }) {
  const router = useRouter();
  const { mutate, isPending } = useMutation({
    mutationFn: async (confirm?: boolean) => {
      return await borrowBook({ bookId: String(bookId), confirm });
    },
    onSuccess: (result) => {
      if (result.redirect) {
        router.push(result.redirect);
        return;
      }

      if (result.success) {
        const isPending = result.data?.borrowRecord.status === "PENDING";
        toast.success("Book borrowed successfully!", {
          id: `add-book-${bookId}`,
          description: isPending
            ? "Your request is pending approval"
            : `Due date: ${new Date(
                result.data?.borrowRecord.dueDate || ""
              ).toLocaleDateString()}`,
        });
      } else {
        if (result.requiresConfirmation) {
          toast.info("Confirmation required", {
            id: `add-book-${bookId}`,
            description: result.message,
            action: {
              label: "Confirm",
              onClick: () => mutate(true),
            },
            duration: 10000,
          });
        } else {
          toast.error("Failed to borrow book", {
            id: `add-book-${bookId}`,
            description: result.message,
          });
        }
      }
    },
    onError: (error) => {
      console.error("Borrow error:", error);
      toast.error("Failed to borrow book", {
        id: `add-book-${bookId}`,
        description: "An unexpected error occurred",
      });
    },
  });

  const handleAddBook = () => {
    toast.loading("Borrowing book...", {
      id: `add-book-${bookId}`,
    });
    mutate(false);
  };

  return (
    <Button size="2xl" onClick={handleAddBook} disabled={isPending}>
      {isPending ? "Borrowing..." : "Borrow Book"}
    </Button>
  );
}
