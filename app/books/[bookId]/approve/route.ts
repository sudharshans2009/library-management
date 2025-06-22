// filepath: c:\Users\bsoun\Documents\Codebase\library-management-v2\app\books\[bookId]\approve\route.ts
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/database/drizzle";
import { config, books, borrowRecords } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const bookId = (await params).bookId;
    const { recordId } = await request.json();

    if (!bookId || !recordId) {
      return new Response("Book ID and Record ID are required", {
        status: 400,
      });
    }

    // User Authentication using Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/sign-in");
    }

    const currentUser = session.user;

    // Check if user is admin/moderator using Drizzle
    const [userConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (!userConfig) {
      return new Response("User configuration not found", { status: 404 });
    }

    // Only ADMIN or MODERATOR can approve borrow requests
    if (!["ADMIN", "MODERATOR"].includes(userConfig.role || "USER")) {
      return new Response(
        JSON.stringify({
          error: "Insufficient permissions",
          message: "Only administrators and moderators can approve borrow requests",
          userRole: userConfig.role,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the current borrow record using Drizzle
    const [record] = await db
      .select()
      .from(borrowRecords)
      .where(eq(borrowRecords.id, recordId))
      .limit(1);

    if (!record) {
      return new Response("Borrow record not found", { status: 404 });
    }

    // Check if status is currently PENDING
    if (record.status !== "PENDING") {
      return new Response(
        JSON.stringify({
          error: "Invalid status change",
          message: `Cannot change status from ${record.status} to BORROWED. Only PENDING records can be approved.`,
          currentStatus: record.status,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the book to check availability before approving using Drizzle
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book) {
      return new Response("Book not found", { status: 404 });
    }

    // Check if book is still available
    if (book.availableCopies <= 0) {
      return new Response(
        JSON.stringify({
          error: "No available copies",
          message: `This book is no longer available. All ${book.totalCopies} copies are currently borrowed.`,
          availableCopies: book.availableCopies,
          totalCopies: book.totalCopies,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Calculate new due date (2 weeks from now)
    const newDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Execute approval in transaction using Drizzle
    const transactionResult = await db.transaction(async (tx) => {
      // Update borrow record status and due date
      const [updatedRecord] = await tx
        .update(borrowRecords)
        .set({
          status: "BORROWED",
          dueDate: newDueDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format for date field
          updatedAt: new Date(),
        })
        .where(eq(borrowRecords.id, recordId))
        .returning();

      // Decrease book availability
      const [updatedBook] = await tx
        .update(books)
        .set({
          availableCopies: book.availableCopies - 1,
          updatedAt: new Date(),
        })
        .where(eq(books.id, bookId))
        .returning();

      return {
        record: updatedRecord,
        book: updatedBook,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Book borrow request approved successfully",
        record: {
          id: transactionResult.record.id,
          status: transactionResult.record.status,
          dueDate: transactionResult.record.dueDate,
          borrowDate: transactionResult.record.borrowDate,
        },
        bookInfo: {
          title: book.title,
          author: book.author,
          remainingCopies: transactionResult.book.availableCopies,
          totalCopies: book.totalCopies,
        },
        approvedBy: {
          id: currentUser.id,
          name: currentUser.name,
          role: userConfig.role,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Approve error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to approve borrow request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Use POST to approve a borrow request",
      endpoint: "/api/books/[bookId]/approve",
      method: "POST",
      body: {
        recordId: "string (required) - The ID of the borrow record to approve",
      },
      permissions: "Requires ADMIN or MODERATOR role",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
