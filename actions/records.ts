/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import {
  getBorrowRecords as getBorrowRecordsService,
  getBorrowRecordById as getBorrowRecordByIdService,
  updateBorrowRecordStatus,
  updateBookAvailability,
  deleteBorrowRecord,
  getBookAvailability,
  type RecordSearchOptions,
  type BorrowRecordWithDetails,
  type PaginatedRecordsResponse,
} from "@/lib/services/records";
import { db } from "@/database/drizzle";
import { config } from "@/database/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";

// Helper function to check authentication and get user config
async function checkAuthAndGetConfig() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Authentication required");
  }

  const [userConfig] = await db
    .select()
    .from(config)
    .where(eq(config.userId, session.user.id))
    .limit(1);

  if (!userConfig) {
    throw new Error("User configuration not found");
  }

  return { user: session.user, config: userConfig };
}

// Helper function to check admin/moderator permissions
function checkAdminPermissions(userConfig: any) {
  if (!["ADMIN", "MODERATOR"].includes(userConfig.role || "USER")) {
    throw new Error(
      "Only administrators and moderators can perform this action",
    );
  }
}

export async function getBorrowRecords(options: RecordSearchOptions): Promise<{
  success: boolean;
  data?: PaginatedRecordsResponse;
  message?: string;
}> {
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
    };
  }
}

export async function getBorrowRecordById(recordId: string): Promise<{
  success: boolean;
  data?: BorrowRecordWithDetails;
  message?: string;
}> {
  try {
    const record = await getBorrowRecordByIdService(recordId);

    if (!record) {
      return {
        success: false,
        message: "Record not found",
      };
    }

    return {
      success: true,
      data: record,
    };
  } catch (error) {
    console.error("Error fetching borrow record:", error);
    return {
      success: false,
      message: "Failed to fetch borrow record",
    };
  }
}

export async function getUserBorrowRecords(
  userId: string,
  options: RecordSearchOptions = {},
): Promise<{
  success: boolean;
  data?: PaginatedRecordsResponse;
  message?: string;
}> {
  try {
    const { user: currentUser, config: userConfig } =
      await checkAuthAndGetConfig();

    // Check if user is accessing their own records or is admin
    if (
      currentUser.id !== userId &&
      !["ADMIN", "MODERATOR"].includes(userConfig.role || "USER")
    ) {
      return {
        success: false,
        message: "Unauthorized to access these records",
      };
    }

    const result = await getBorrowRecordsService({ ...options, userId });
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching user borrow records:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch user borrow records",
    };
  }
}

export async function approveRecord(recordId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { config: userConfig } = await checkAuthAndGetConfig();
    checkAdminPermissions(userConfig);

    // Get the current borrow record
    const record = await getBorrowRecordByIdService(recordId);
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

    // Check book availability
    const availability = await getBookAvailability(record.bookId);
    if (!availability || availability.availableCopies <= 0) {
      return {
        success: false,
        message: `This book is no longer available. All ${availability?.totalCopies || 0} copies are currently borrowed.`,
      };
    }

    // Calculate due date: 2 weeks (14 days) from approval date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Execute approval operations sequentially
    try {
      // Update borrow record status and due date
      await updateBorrowRecordStatus(recordId, "BORROWED");

      // Decrease book availability
      await updateBookAvailability(record.bookId, -1);
    } catch (operationError) {
      // If any operation fails, we need to handle it gracefully
      console.error("Error during approval operations:", operationError);
      
      // Try to revert the record status if book availability update failed
      try {
        await updateBorrowRecordStatus(recordId, "PENDING");
      } catch (revertError) {
        console.error("Failed to revert record status:", revertError);
      }
      
      throw new Error("Failed to complete approval process");
    }

    revalidatePath("/admin/records");
    return {
      success: true,
      message: "Borrow request approved successfully",
    };
  } catch (error) {
    console.error("Error approving record:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to approve borrow request",
    };
  }
}

export async function rejectRecord(recordId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { config: userConfig } = await checkAuthAndGetConfig();
    checkAdminPermissions(userConfig);

    await deleteBorrowRecord(recordId);

    revalidatePath("/admin/records");
    return {
      success: true,
      message: "Borrow request rejected successfully",
    };
  } catch (error) {
    console.error("Error rejecting record:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to reject borrow request",
    };
  }
}

export async function returnRecord(recordId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { config: userConfig } = await checkAuthAndGetConfig();
    checkAdminPermissions(userConfig);

    // Get the record to get book ID
    const record = await getBorrowRecordByIdService(recordId);
    if (!record) {
      return {
        success: false,
        message: "Record not found",
      };
    }

    if (record.status !== "BORROWED") {
      return {
        success: false,
        message: "Only borrowed books can be returned",
      };
    }

    const returnDate = new Date().toISOString().split("T")[0];

    // Execute return operations sequentially
    try {
      // Update record with return date and status
      await updateBorrowRecordStatus(recordId, "RETURNED", returnDate);

      // Increase available copies
      await updateBookAvailability(record.bookId, 1);
    } catch (operationError) {
      // If any operation fails, we need to handle it gracefully
      console.error("Error during return operations:", operationError);
      
      // Try to revert the record status if book availability update failed
      try {
        await updateBorrowRecordStatus(recordId, "BORROWED");
      } catch (revertError) {
        console.error("Failed to revert record status:", revertError);
      }
      
      throw new Error("Failed to complete return process");
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
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark book as returned",
    };
  }
}

export async function exportRecordsToCSV(
  options: RecordSearchOptions,
): Promise<{
  success: boolean;
  data?: any[];
  message?: string;
}> {
  try {
    const { config: userConfig } = await checkAuthAndGetConfig();
    checkAdminPermissions(userConfig);

    // Get all records without pagination for export
    const allRecords = await getBorrowRecordsService({
      ...options,
      limit: 10000,
      page: 1,
    });

    const csvData = allRecords.records.map((record) => {
      const daysOverdue =
        record.status === "BORROWED" && !record.returnDate
          ? Math.max(
              0,
              Math.floor(
                (new Date().getTime() - new Date(record.dueDate).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
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
        returnDate: record.returnDate
          ? new Date(record.returnDate).toLocaleDateString()
          : null,
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
      message:
        error instanceof Error ? error.message : "Failed to export records",
    };
  }
}
