/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getBorrowRecordById } from "@/actions/records";
import { getBookById } from "@/actions/books";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import { db } from "@/database/drizzle";
import { config } from "@/database/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

interface ShareableRecord {
  id: string;
  key: string;
  recordId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

// In-memory store for shareable records (in production, use a database table)
const shareableRecords = new Map<string, ShareableRecord>();

export async function generateShareableLink(recordId: string): Promise<{
  success: boolean;
  data?: { key: string; url: string };
  message?: string;
}> {
  try {
    // Get current user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    // Get the record to verify ownership
    const recordResult = await getBorrowRecordById(recordId);
    if (!recordResult.success || !recordResult.data) {
      return {
        success: false,
        message: "Record not found",
      };
    }

    const record = recordResult.data;

    // Check if user owns this record or is admin
    const isOwner = record.userId === session.user.id;
    
    // Check if user is admin/moderator
    const [userConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, session.user.id))
      .limit(1);

    const isAdmin = userConfig && ["ADMIN", "MODERATOR"].includes(userConfig.role || "USER");

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        message: "You don't have permission to share this record",
      };
    }

    // Generate unique key
    const key = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store the shareable record
    shareableRecords.set(key, {
      id: uuidv4(),
      key,
      recordId,
      userId: session.user.id,
      createdAt: new Date(),
      expiresAt,
    });

    // Generate URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/records/${recordId}/info?key=${key}`;

    return {
      success: true,
      data: { key, url },
    };
  } catch (error) {
    console.error("Error generating shareable link:", error);
    return {
      success: false,
      message: "Failed to generate shareable link",
    };
  }
}

export async function validateShareableKey(recordId: string, key: string): Promise<{
  success: boolean;
  data?: ShareableRecord;
  message?: string;
}> {
  try {
    const shareableRecord = shareableRecords.get(key);

    if (!shareableRecord) {
      return {
        success: false,
        message: "Invalid or expired share key",
      };
    }

    if (shareableRecord.recordId !== recordId) {
      return {
        success: false,
        message: "Share key doesn't match this record",
      };
    }

    if (shareableRecord.expiresAt < new Date()) {
      shareableRecords.delete(key);
      return {
        success: false,
        message: "Share key has expired",
      };
    }

    return {
      success: true,
      data: shareableRecord,
    };
  } catch (error) {
    console.error("Error validating share key:", error);
    return {
      success: false,
      message: "Failed to validate share key",
    };
  }
}

export async function getRecordForPDF(recordId: string, shareKey?: string): Promise<{
  success: boolean;
  data?: {
    record: any;
    book: any;
    userConfig: any;
    isPublic: boolean;
  };
  message?: string;
}> {
  try {
    let isPublic = false;
    let hasAccess = false;

    // If share key is provided, validate it
    if (shareKey) {
      const keyValidation = await validateShareableKey(recordId, shareKey);
      if (keyValidation.success) {
        isPublic = true;
        hasAccess = true;
      }
    }

    // If no share key or invalid, check regular auth
    if (!hasAccess) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return {
          success: false,
          message: "Authentication required",
        };
      }

      // Get the record to verify ownership
      const recordResult = await getBorrowRecordById(recordId);
      if (!recordResult.success || !recordResult.data) {
        return {
          success: false,
          message: "Record not found",
        };
      }

      const record = recordResult.data;

      // Check if user owns this record or is admin
      const isOwner = record.userId === session.user.id;
      
      const [userConfig] = await db
        .select()
        .from(config)
        .where(eq(config.userId, session.user.id))
        .limit(1);

      const isAdmin = userConfig && ["ADMIN", "MODERATOR"].includes(userConfig.role || "USER");

      if (!isOwner && !isAdmin) {
        return {
          success: false,
          message: "You don't have permission to view this record",
        };
      }

      hasAccess = true;
    }

    if (!hasAccess) {
      return {
        success: false,
        message: "Access denied",
      };
    }

    // Get record data
    const recordResult = await getBorrowRecordById(recordId);
    if (!recordResult.success || !recordResult.data) {
      return {
        success: false,
        message: "Record not found",
      };
    }

    const record = recordResult.data;

    // Get book data
    const bookResult = await getBookById(record.bookId);
    if (!bookResult.success || !bookResult.data) {
      return {
        success: false,
        message: "Book not found",
      };
    }

    const book = bookResult.data;

    // Get user config
    const [userConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, record.userId))
      .limit(1);

    return {
      success: true,
      data: {
        record,
        book,
        userConfig,
        isPublic,
      },
    };
  } catch (error) {
    console.error("Error getting record for PDF:", error);
    return {
      success: false,
      message: "Failed to get record data",
    };
  }
}