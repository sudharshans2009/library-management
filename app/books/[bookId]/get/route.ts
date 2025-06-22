import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/database/drizzle";
import { user, config, books, borrowRecords } from "@/database/schema";
import { eq, and, inArray, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    // 1. Initial Validation & Setup
    const bookId = (await params).bookId;
    if (!bookId) {
      return new Response("Book ID is required", { status: 400 });
    }

    // 2. User Authentication & Authorization using Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new Response(
        JSON.stringify({
          redirect: "/sign-in"
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const currentUser = session.user;

    // 3. User Verification and Status Check using Drizzle
    const [dbUserConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (!dbUserConfig) {
      return new Response(
        JSON.stringify({
          redirect: "/setup"
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 🔒 CHECK USER STATUS: Block PENDING or REJECTED users
    if (dbUserConfig.status === "PENDING") {
      return new Response(
        JSON.stringify({
          error: "Account pending approval",
          message:
            "Your account is currently pending approval. You cannot request books until your account is approved by an administrator.",
          currentStatus: dbUserConfig.status,
          action: "Please wait for admin approval or contact support.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (dbUserConfig.status === "SUSPENDED") {
      return new Response(
        JSON.stringify({
          error: "Account suspended",
          message:
            "Your account is currently suspended. You cannot request books until your account is reactivated.",
          currentStatus: dbUserConfig.status,
          action: "Please contact an administrator to reactivate your account.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Only APPROVED users can proceed beyond this point
    if (dbUserConfig.status !== "APPROVED") {
      return new Response(
        JSON.stringify({
          error: "Account not approved",
          message: `Your account status is ${dbUserConfig.status}. Only users with APPROVED status can request books.`,
          currentStatus: dbUserConfig.status,
          action:
            "Please contact an administrator if you believe this is an error.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Check Book Existence and Availability using Drizzle
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book) {
      return new Response("Book not found", { status: 404 });
    }

    // 🔍 CRITICAL CHECK: Stop here if no available copies
    if (book.availableCopies <= 0) {
      return new Response(
        JSON.stringify({
          error: "No available copies",
          message: `This book is currently out of stock. ${book.totalCopies} total copies, all currently borrowed.`,
          availableCopies: book.availableCopies,
          totalCopies: book.totalCopies,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 5. User Borrowing History Analysis using Drizzle
    const userBorrowHistory = await db
      .select()
      .from(borrowRecords)
      .where(
        and(
          eq(borrowRecords.userId, currentUser.id),
          eq(borrowRecords.bookId, bookId)
        )
      );

    // Check for active borrows (user already has this book)
    const activeBorrow = userBorrowHistory.find((borrow) =>
      ["PENDING", "BORROWED"].includes(borrow.status)
    );

    if (activeBorrow) {
      return new Response(
        JSON.stringify({
          error: "Book already borrowed",
          message: `You already have an active borrow record for this book with status: ${activeBorrow.status}`,
          currentStatus: activeBorrow.status,
          borrowDate: activeBorrow.borrowDate,
          dueDate: activeBorrow.dueDate,
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check for re-borrowing confirmation
    const returnedBorrow = userBorrowHistory.find(
      (borrow) => borrow.status === "RETURNED"
    );

    if (returnedBorrow) {
      const url = new URL(request.url);
      const confirmReborrow = url.searchParams.get("confirm");
      if (!confirmReborrow) {
        return new Response(
          JSON.stringify({
            error: "Confirmation required",
            message:
              "You have previously returned this book. Add ?confirm=true to borrow again.",
            previousReturn: {
              returnDate: returnedBorrow.returnDate,
              borrowDate: returnedBorrow.borrowDate,
            },
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // 6. Creating the Borrow Record using Drizzle
    const borrowDate = new Date();
    // PENDING status gets 3 years from now as due date
    const dueDate = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000);

    // Create borrow record with PENDING status - availability stays the same
    const [borrowRecord] = await db
      .insert(borrowRecords)
      .values({
        id: uuidv4(),
        userId: currentUser.id,
        bookId: bookId,
        borrowDate,
        dueDate: dueDate.toISOString(),
        status: "PENDING",
      })
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Book borrow request submitted successfully - awaiting approval",
        borrowRecord: {
          id: borrowRecord.id,
          borrowDate: borrowRecord.borrowDate,
          dueDate: borrowRecord.dueDate,
          status: borrowRecord.status,
        },
        bookInfo: {
          title: book.title,
          author: book.author,
          availableCopies: book.availableCopies, // Availability unchanged until approval
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Borrow error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to process borrow request",
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
      message: "Use POST to borrow a book",
      endpoint: "/api/books/[bookId]/borrow",
      method: "POST",
      parameters: {
        bookId: "string (required)",
        confirm: "boolean (optional, for re-borrowing)",
      },
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
