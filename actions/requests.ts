/* eslint-disable @typescript-eslint/no-explicit-any */
// actions/requests.ts
"use server";

import {
  createRequest as createRequestService,
  rescindRequest as rescindRequestService,
  getRequests as getRequestsService,
  getRequestById as getRequestByIdService,
  respondToRequest as respondToRequestService,
  type RequestSearchOptions,
  type PaginatedRequestsResponse,
  type RequestWithDetails,
} from "@/lib/services/requests";
import { db } from "@/database/drizzle";
import { config, borrowRecords, books } from "@/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import {
  CreateRequestSchema,
  RescindRequestSchema,
  AdminResponseSchema,
  type CreateRequestSchemaType,
  type RescindRequestSchemaType,
  type AdminResponseSchemaType,
} from "@/schemas/request";
import { v4 as uuidv4 } from "uuid";

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

  return { session, config: userConfig };
}

// Helper function to check admin permissions
function checkAdminPermissions(userConfig: any) {
  if (!["ADMIN", "MODERATOR"].includes(userConfig.role || "USER")) {
    throw new Error(
      "Only administrators and moderators can perform this action",
    );
  }
}

export async function createRequest(data: CreateRequestSchemaType): Promise<{
  success: boolean;
  message: string;
  data?: { id: string };
}> {
  try {
    // Validate input
    const validatedData = CreateRequestSchema.parse(data);

    const { session, config: userConfig } = await checkAuthAndGetConfig();

    // Verify user owns the borrow record
    const [borrowRecord] = await db
      .select()
      .from(borrowRecords)
      .where(eq(borrowRecords.id, validatedData.borrowRecordId))
      .limit(1);

    if (!borrowRecord) {
      return {
        success: false,
        message: "Borrow record not found",
      };
    }

    if (borrowRecord.userId !== session.user.id) {
      return {
        success: false,
        message: "You can only create requests for your own borrow records",
      };
    }

    // Create the request
    const requestId = uuidv4();
    await createRequestService({
      userId: session.user.id,
      borrowRecordId: validatedData.borrowRecordId,
      type: validatedData.type,
      reason: validatedData.reason,
      description: validatedData.description,
      requestedDate: validatedData.requestedDate,
    });

    revalidatePath("/dashboard");
    revalidatePath("/requests");

    return {
      success: true,
      message: "Request created successfully",
      data: { id: requestId },
    };
  } catch (error) {
    console.error("Error creating request:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create request",
    };
  }
}

export async function rescindRequest(data: RescindRequestSchemaType): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const validatedData = RescindRequestSchema.parse(data);

    const { session } = await checkAuthAndGetConfig();

    // Get the request to verify ownership
    const request = await getRequestByIdService(validatedData.requestId);

    if (!request) {
      return {
        success: false,
        message: "Request not found",
      };
    }

    if (request.userId !== session.user.id) {
      return {
        success: false,
        message: "You can only rescind your own requests",
      };
    }

    if (request.status !== "PENDING") {
      return {
        success: false,
        message: "Only pending requests can be rescinded",
      };
    }

    await rescindRequestService(validatedData.requestId);

    revalidatePath("/dashboard");
    revalidatePath("/requests");
    revalidatePath("/admin/requests");

    return {
      success: true,
      message: "Request rescinded successfully",
    };
  } catch (error) {
    console.error("Error rescinding request:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to rescind request",
    };
  }
}

export async function getRequests(options: RequestSearchOptions): Promise<{
  success: boolean;
  data?: PaginatedRequestsResponse;
  message?: string;
}> {
  try {
    const data = await getRequestsService(options);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching requests:", error);
    return {
      success: false,
      message: "Failed to fetch requests",
    };
  }
}

export async function getRequestById(requestId: string): Promise<{
  success: boolean;
  data?: RequestWithDetails;
  message?: string;
}> {
  try {
    const data = await getRequestByIdService(requestId);

    if (!data) {
      return {
        success: false,
        message: "Request not found",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching request:", error);
    return {
      success: false,
      message: "Failed to fetch request",
    };
  }
}

export async function respondToRequest(data: AdminResponseSchemaType): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const validatedData = AdminResponseSchema.parse(data);

    const { session, config: userConfig } = await checkAuthAndGetConfig();

    // Check admin permissions
    checkAdminPermissions(userConfig);

    // Get the request to verify it exists and is pending
    const request = await getRequestByIdService(validatedData.requestId);

    if (!request) {
      return {
        success: false,
        message: "Request not found",
      };
    }

    if (request.status !== "PENDING") {
      return {
        success: false,
        message: "Only pending requests can be responded to",
      };
    }

    await respondToRequestService(
      validatedData.requestId,
      validatedData.status,
      validatedData.adminResponse,
      session.user.id,
    );

    revalidatePath("/admin/requests");
    revalidatePath("/dashboard");
    revalidatePath("/requests");

    return {
      success: true,
      message: `Request ${validatedData.status.toLowerCase()} successfully`,
    };
  } catch (error) {
    console.error("Error responding to request:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to respond to request",
    };
  }
}

export async function getUserBorrowRecords(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    bookTitle: string;
    bookAuthor: string;
    borrowDate: Date;
    dueDate: string;
    status: string;
  }>;
  message?: string;
}> {
  try {
    const { session } = await checkAuthAndGetConfig();

    const userBorrowRecords = await db
      .select({
        id: borrowRecords.id,
        bookId: borrowRecords.bookId,
        borrowDate: borrowRecords.borrowDate,
        dueDate: borrowRecords.dueDate,
        status: borrowRecords.status,
        // Book fields
        bookTitle: books.title,
        bookAuthor: books.author,
      })
      .from(borrowRecords)
      .leftJoin(books, eq(borrowRecords.bookId, books.id)) // Join with books table
      .where(
        and(
          eq(borrowRecords.userId, session.user.id),
          eq(borrowRecords.status, "BORROWED"), // Only active borrows
        ),
      )
      .orderBy(desc(borrowRecords.borrowDate));

    return {
      success: true,
      data: userBorrowRecords.map((record) => ({
        id: record.id,
        bookTitle: record.bookTitle || "Unknown Book",
        bookAuthor: record.bookAuthor || "Unknown Author",
        borrowDate: record.borrowDate,
        dueDate: record.dueDate,
        status: record.status,
      })),
    };
  } catch (error) {
    console.error("Error fetching user borrow records:", error);
    return {
      success: false,
      message: "Failed to fetch borrow records",
    };
  }
}
