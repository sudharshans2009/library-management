"use server";

import { getBorrowRecords as getBorrowRecordsService, RecordSearchOptions } from "@/lib/services/records";
import { db } from "@/database/drizzle";
import { borrowRecords, books, config } from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";

export async function getBorrowRecords(options: RecordSearchOptions & { bookId?: string }) {
  try {
    const result = await getBorrowRecordsService(options);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching borrow records:", error);
    return {
      success: false,
      message: "Failed to fetch borrow records",
      data: null,
    };
  }
}

export async function approveRecord(recordId: string) {
  try {
    // Check authentication and permissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    const currentUser = session.user;

    // Check if user is admin/moderator
    const [userConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (!userConfig) {
      return {
        success: false,
        message: "User configuration not found",
      };
    }

    // Only ADMIN or MODERATOR can approve borrow requests
    if (!["ADMIN", "MODERATOR"].includes(userConfig.role || "USER")) {
      return {
        success: false,
        message: "Only administrators and moderators can approve borrow requests",
      };
    }

    // Get the current borrow record
    const [record] = await db
      .select()
      .from(borrowRecords)
      .where(eq(borrowRecords.id, recordId))
      .limit(1);

    if (!record) {
      return {
        success: false,
        message: "Borrow record not found",
      };
    }

    // Check if status is currently PENDING
    if (record.status !== "PENDING") {
      return {
        success: false,
        message: `Cannot change status from ${record.status} to BORROWED. Only PENDING records can be approved.`,
      };
    }

    // Get the book to check availability
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, record.bookId))
      .limit(1);

    if (!book) {
      return {
        success: false,
        message: "Book not found",
      };
    }

    // Check if book is still available
    if (book.availableCopies <= 0) {
      return {
        success: false,
        message: `This book is no longer available. All ${book.totalCopies} copies are currently borrowed.`,
      };
    }

    // Calculate due date: 2 weeks (14 days) from approval date
    const approvalDate = new Date();
    const dueDate = new Date(approvalDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Execute approval in transaction
    await db.transaction(async (tx) => {
      // Update borrow record status and due date
      await tx
        .update(borrowRecords)
        .set({
          status: "BORROWED",
          dueDate: dueDate.toISOString().split('T')[0],
          updatedAt: new Date(),
        })
        .where(eq(borrowRecords.id, recordId));

      // Decrease book availability
      await tx
        .update(books)
        .set({
          availableCopies: sql`${books.availableCopies} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(books.id, record.bookId));
    });

    revalidatePath("/admin/records");

    return {
      success: true,
      message: "Borrow request approved successfully",
    };
  } catch (error) {
    console.error("Error approving record:", error);
    return {
      success: false,
      message: "Failed to approve borrow request",
    };
  }
}

export async function rejectRecord(recordId: string) {
  try {
    // Check authentication and permissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    const currentUser = session.user;

    // Check if user is admin/moderator
    const [userConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (!userConfig) {
      return {
        success: false,
        message: "User configuration not found",
      };
    }

    // Only ADMIN or MODERATOR can reject borrow requests
    if (!["ADMIN", "MODERATOR"].includes(userConfig.role || "USER")) {
      return {
        success: false,
        message: "Only administrators and moderators can reject borrow requests",
      };
    }

    // Delete the record (rejected requests are removed)
    await db
      .delete(borrowRecords)
      .where(eq(borrowRecords.id, recordId));

    revalidatePath("/admin/records");

    return {
      success: true,
      message: "Borrow request rejected successfully",
    };
  } catch (error) {
    console.error("Error rejecting record:", error);
    return {
      success: false,
      message: "Failed to reject borrow request",
    };
  }
}

export async function returnRecord(recordId: string) {
  try {
    // Check authentication and permissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    const currentUser = session.user;

    // Check if user is admin/moderator
    const [userConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (!userConfig) {
      return {
        success: false,
        message: "User configuration not found",
      };
    }

    // Only ADMIN or MODERATOR can mark books as returned
    if (!["ADMIN", "MODERATOR"].includes(userConfig.role || "USER")) {
      return {
        success: false,
        message: "Only administrators and moderators can mark books as returned",
      };
    }

    // Update record with return date and status
    await db
      .update(borrowRecords)
      .set({
        returnDate: new Date().toISOString().split('T')[0],
        status: "RETURNED",
        updatedAt: new Date()
      })
      .where(eq(borrowRecords.id, recordId));

    // Increase available copies
    const record = await db
      .select({ bookId: borrowRecords.bookId })
      .from(borrowRecords)
      .where(eq(borrowRecords.id, recordId))
      .limit(1);

    if (record[0]) {
      await db
        .update(books)
        .set({
          availableCopies: sql`${books.availableCopies} + 1`,
          updatedAt: new Date()
        })
        .where(eq(books.id, record[0].bookId));
    }

    revalidatePath("/admin/records");

    return {
      success: true,
      message: "Book marked as returned successfully",
    };
  } catch (error) {
    console.error("Error returning record:", error);
    return {
      success: false,
      message: "Failed to mark book as returned",
    };
  }
}

export async function exportRecordsToCSV(options: RecordSearchOptions) {
  try {
    // Get all records without pagination for export
    const allRecords = await getBorrowRecordsService({ ...options, limit: 10000, page: 1 });

    const csvData = allRecords.records.map(record => {
      const daysOverdue = record.status === "BORROWED" && !record.returnDate
        ? Math.max(0, Math.floor((new Date().getTime() - new Date(record.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        userName: record.user.name,
        userFullName: record.config.fullName,
        userClass: record.config.class,
        userSection: record.config.section,
        userRollNo: record.config.rollNo,
        bookTitle: record.book.title,
        bookAuthor: record.book.author,
        borrowDate: new Date(record.borrowDate).toLocaleDateString(),
        dueDate: new Date(record.dueDate).toLocaleDateString(),
        returnDate: record.returnDate ? new Date(record.returnDate).toLocaleDateString() : null,
        status: record.status,
        daysOverdue,
      };
    });

    return {
      success: true,
      data: csvData,
    };
  } catch (error) {
    console.error("Error exporting records:", error);
    return {
      success: false,
      message: "Failed to export records",
      data: null,
    };
  }
}