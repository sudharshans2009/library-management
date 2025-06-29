/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/request-actions.ts
"use server";

import { db } from "@/database/drizzle";
import { borrowRecords, books, config, requests } from "@/database/schema";
import { eq, sql } from "drizzle-orm";

export interface RequestActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function executeRequestAction(
  requestId: string,
  requestType: string,
  adminId: string,
  customData?: any,
): Promise<RequestActionResult> {
  try {
    // Get the request details
    const [request] = await db
      .select({
        id: requests.id,
        userId: requests.userId,
        borrowRecordId: requests.borrowRecordId,
        type: requests.type,
        requestedDate: requests.requestedDate,
      })
      .from(requests)
      .where(eq(requests.id, requestId))
      .limit(1);

    if (!request) {
      return { success: false, message: "Request not found" };
    }

    // Get borrow record details
    const [borrowRecord] = await db
      .select({
        id: borrowRecords.id,
        userId: borrowRecords.userId,
        bookId: borrowRecords.bookId,
        dueDate: borrowRecords.dueDate,
        status: borrowRecords.status,
      })
      .from(borrowRecords)
      .where(eq(borrowRecords.id, request.borrowRecordId))
      .limit(1);

    if (!borrowRecord) {
      return { success: false, message: "Borrow record not found" };
    }

    // Execute specific action based on request type
    switch (requestType) {
      case "EXTEND_BORROW":
        return await handleExtendBorrow(borrowRecord);

      case "REPORT_LOST":
        return await handleReportLost(borrowRecord, request.userId);

      case "REPORT_DAMAGE":
        return await handleReportDamage(borrowRecord, request.userId);

      case "EARLY_RETURN":
        return await handleEarlyReturn(borrowRecord);

      case "CHANGE_DUE_DATE":
        return await handleChangeDueDate(borrowRecord, customData?.newDueDate);

      case "OTHER":
        return {
          success: true,
          message: "Request acknowledged. No automatic action taken.",
          data: { actionType: "message_only" },
        };

      default:
        return { success: false, message: "Unknown request type" };
    }
  } catch (error) {
    console.error("Error executing request action:", error);
    return { success: false, message: "Failed to execute request action" };
  }
}

async function handleExtendBorrow(
  borrowRecord: any,
): Promise<RequestActionResult> {
  try {
    // Extend due date by 7 days
    const currentDueDate = new Date(borrowRecord.dueDate);
    const newDueDate = new Date(currentDueDate);
    newDueDate.setDate(newDueDate.getDate() + 7);

    await db
      .update(borrowRecords)
      .set({
        dueDate: newDueDate.toISOString().split("T")[0],
        updatedAt: new Date(),
      })
      .where(eq(borrowRecords.id, borrowRecord.id));

    return {
      success: true,
      message: `Borrow period extended by 7 days. New due date: ${newDueDate.toLocaleDateString()}`,
      data: {
        actionType: "extend_borrow",
        oldDueDate: borrowRecord.dueDate,
        newDueDate: newDueDate.toISOString().split("T")[0],
        extensionDays: 7,
      },
    };
  } catch (error) {
    return { success: false, message: "Failed to extend borrow period" };
  }
}

async function handleReportLost(
  borrowRecord: any,
  userId: string,
): Promise<RequestActionResult> {
  try {
    await db.transaction(async (tx) => {
      // Mark book as returned (lost)
      await tx
        .update(borrowRecords)
        .set({
          status: "RETURNED",
          returnDate: new Date().toISOString().split("T")[0],
          updatedAt: new Date(),
        })
        .where(eq(borrowRecords.id, borrowRecord.id));

      // Reduce total copies by 1 (book is lost)
      await tx
        .update(books)
        .set({
          totalCopies: sql`${books.totalCopies} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(books.id, borrowRecord.bookId));

      // Suspend user for 1 week
      const suspensionEndDate = new Date();
      suspensionEndDate.setDate(suspensionEndDate.getDate() + 7);

      await tx
        .update(config)
        .set({
          status: "SUSPENDED",
          updatedAt: new Date(),
        })
        .where(eq(config.userId, userId));
    });

    return {
      success: true,
      message:
        "Lost book reported. Book removed from inventory and user suspended for 1 week.",
      data: {
        actionType: "report_lost",
        suspensionDays: 7,
        bookRemoved: true,
      },
    };
  } catch (error) {
    return { success: false, message: "Failed to process lost book report" };
  }
}

async function handleReportDamage(
  borrowRecord: any,
  userId: string,
): Promise<RequestActionResult> {
  try {
    await db.transaction(async (tx) => {
      // Mark book as returned (damaged)
      await tx
        .update(borrowRecords)
        .set({
          status: "RETURNED",
          returnDate: new Date().toISOString().split("T")[0],
          updatedAt: new Date(),
        })
        .where(eq(borrowRecords.id, borrowRecord.id));

      // Reduce total copies by 1 (book is damaged beyond repair)
      await tx
        .update(books)
        .set({
          totalCopies: sql`${books.totalCopies} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(books.id, borrowRecord.bookId));

      // Suspend user for 1 week
      await tx
        .update(config)
        .set({
          status: "SUSPENDED",
          updatedAt: new Date(),
        })
        .where(eq(config.userId, userId));
    });

    return {
      success: true,
      message:
        "Damaged book reported. Book removed from inventory and user suspended for 1 week.",
      data: {
        actionType: "report_damage",
        suspensionDays: 7,
        bookRemoved: true,
      },
    };
  } catch (error) {
    return { success: false, message: "Failed to process damage report" };
  }
}

async function handleEarlyReturn(
  borrowRecord: any,
): Promise<RequestActionResult> {
  try {
    await db.transaction(async (tx) => {
      // Mark book as returned
      await tx
        .update(borrowRecords)
        .set({
          status: "RETURNED",
          returnDate: new Date().toISOString().split("T")[0],
          updatedAt: new Date(),
        })
        .where(eq(borrowRecords.id, borrowRecord.id));

      // Increase available copies
      await tx
        .update(books)
        .set({
          availableCopies: sql`${books.availableCopies} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(books.id, borrowRecord.bookId));
    });

    return {
      success: true,
      message: "Book marked as returned. Thank you for the early return!",
      data: {
        actionType: "early_return",
        returnDate: new Date().toISOString().split("T")[0],
      },
    };
  } catch (error) {
    return { success: false, message: "Failed to process early return" };
  }
}

async function handleChangeDueDate(
  borrowRecord: any,
  newDueDate: string,
): Promise<RequestActionResult> {
  try {
    if (!newDueDate) {
      return { success: false, message: "New due date is required" };
    }

    const oldDueDate = borrowRecord.dueDate;

    await db
      .update(borrowRecords)
      .set({
        dueDate: newDueDate,
        updatedAt: new Date(),
      })
      .where(eq(borrowRecords.id, borrowRecord.id));

    return {
      success: true,
      message: `Due date changed from ${new Date(oldDueDate).toLocaleDateString()} to ${new Date(newDueDate).toLocaleDateString()}`,
      data: {
        actionType: "change_due_date",
        oldDueDate,
        newDueDate,
      },
    };
  } catch (error) {
    return { success: false, message: "Failed to change due date" };
  }
}

export async function unsuspendUser(
  userId: string,
  adminId: string,
): Promise<RequestActionResult> {
  try {
    await db
      .update(config)
      .set({
        status: "APPROVED",
        updatedAt: new Date(),
      })
      .where(eq(config.userId, userId));

    return {
      success: true,
      message: "User suspension lifted successfully",
      data: {
        actionType: "unsuspend_user",
        adminId,
      },
    };
  } catch (error) {
    return { success: false, message: "Failed to unsuspend user" };
  }
}
