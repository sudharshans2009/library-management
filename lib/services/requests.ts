import { db } from "@/database/drizzle";
import {
  requests,
  borrowRecords,
  books,
  user,
  config,
} from "@/database/schema";
import { eq, and, or, desc, asc, count, sql } from "drizzle-orm";
import type { RequestStatusEnum, RequestTypeEnum } from "@/database/schema";

export interface RequestWithDetails {
  id: string;
  userId: string;
  borrowRecordId: string;
  type: RequestTypeEnum;
  reason: string;
  description: string | null;
  requestedDate: string | null;
  status: RequestStatusEnum;
  adminResponse: string | null;
  adminId: string | null;
  rescindedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  config: {
    fullName: string;
    class: string;
    section: string;
    rollNo: string;
  };
  borrowRecord: {
    id: string;
    borrowDate: Date | null;
    dueDate: string | null;
    returnDate: string | null;
    status: string;
  };
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RequestSearchOptions {
  page?: number;
  limit?: number;
  userId?: string;
  type?: RequestTypeEnum;
  status?: RequestStatusEnum;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "type" | "status";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedRequestsResponse {
  requests: RequestWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function getRequests(
  options: RequestSearchOptions = {},
): Promise<PaginatedRequestsResponse> {
  const {
    page = 1,
    limit = 10,
    userId,
    type,
    status,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [];

  if (userId) {
    whereConditions.push(eq(requests.userId, userId));
  }

  if (type) {
    whereConditions.push(eq(requests.type, type));
  }

  if (status) {
    whereConditions.push(eq(requests.status, status));
  }

  if (search) {
    whereConditions.push(
      or(
        sql`${requests.reason} ILIKE ${`%${search}%`}`,
        sql`${books.title} ILIKE ${`%${search}%`}`,
        sql`${user.name} ILIKE ${`%${search}%`}`,
      ),
    );
  }

  // Get total count
  const totalCountResult = await db
    .select({ count: count() })
    .from(requests)
    .leftJoin(borrowRecords, eq(requests.borrowRecordId, borrowRecords.id))
    .leftJoin(books, eq(borrowRecords.bookId, books.id))
    .leftJoin(user, eq(requests.userId, user.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const totalCount = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Get requests with all related data
  const requestsWithDetails = await db
    .select({
      // Request fields
      id: requests.id,
      userId: requests.userId,
      borrowRecordId: requests.borrowRecordId,
      type: requests.type,
      reason: requests.reason,
      description: requests.description,
      requestedDate: requests.requestedDate,
      status: requests.status,
      adminResponse: requests.adminResponse,
      adminId: requests.adminId,
      rescindedAt: requests.rescindedAt,
      resolvedAt: requests.resolvedAt,
      createdAt: requests.createdAt,
      updatedAt: requests.updatedAt,
      // User fields
      userName: user.name,
      userEmail: user.email,
      // Config fields
      userFullName: config.fullName,
      userClass: config.class,
      userSection: config.section,
      userRollNo: config.rollNo,
      // Borrow record fields
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      returnDate: borrowRecords.returnDate,
      borrowStatus: borrowRecords.status,
      // Book fields
      bookId: books.id,
      bookTitle: books.title,
      bookAuthor: books.author,
      bookCoverUrl: books.coverUrl,
    })
    .from(requests)
    .leftJoin(borrowRecords, eq(requests.borrowRecordId, borrowRecords.id))
    .leftJoin(books, eq(borrowRecords.bookId, books.id))
    .leftJoin(user, eq(requests.userId, user.id))
    .leftJoin(config, eq(requests.userId, config.userId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(
      (() => {
        let column;
        switch (sortBy) {
          case "createdAt":
            column = requests.createdAt;
            break;
          case "updatedAt":
            column = requests.updatedAt;
            break;
          case "type":
            column = requests.type;
            break;
          case "status":
            column = requests.status;
            break;
          default:
            column = requests.createdAt;
        }
        return sortOrder === "desc" ? desc(column) : asc(column);
      })(),
    )
    .limit(limit)
    .offset(offset);

  // Transform the data
  const transformedRequests: RequestWithDetails[] = requestsWithDetails.map(
    (row) => ({
      id: row.id,
      userId: row.userId,
      borrowRecordId: row.borrowRecordId,
      type: row.type,
      reason: row.reason,
      description: row.description,
      requestedDate: row.requestedDate,
      status: row.status,
      adminResponse: row.adminResponse,
      adminId: row.adminId,
      rescindedAt: row.rescindedAt,
      resolvedAt: row.resolvedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        name: row.userName || "",
        email: row.userEmail || "",
      },
      config: {
        fullName: row.userFullName || "",
        class: row.userClass || "",
        section: row.userSection || "",
        rollNo: row.userRollNo || "",
      },
      borrowRecord: {
        id: row.borrowRecordId,
        borrowDate: row.borrowDate,
        dueDate: row.dueDate,
        returnDate: row.returnDate,
        status: row.borrowStatus || "",
      },
      book: {
        id: row.bookId || "",
        title: row.bookTitle || "",
        author: row.bookAuthor || "",
        coverUrl: row.bookCoverUrl || "",
      },
    }),
  );

  return {
    requests: transformedRequests,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

export async function getRequestById(
  requestId: string,
): Promise<RequestWithDetails | null> {
  const result = await db
    .select({
      // Request fields
      id: requests.id,
      userId: requests.userId,
      borrowRecordId: requests.borrowRecordId,
      type: requests.type,
      reason: requests.reason,
      description: requests.description,
      requestedDate: requests.requestedDate,
      status: requests.status,
      adminResponse: requests.adminResponse,
      adminId: requests.adminId,
      rescindedAt: requests.rescindedAt,
      resolvedAt: requests.resolvedAt,
      createdAt: requests.createdAt,
      updatedAt: requests.updatedAt,
      // User fields
      userName: user.name,
      userEmail: user.email,
      // Config fields
      userFullName: config.fullName,
      userClass: config.class,
      userSection: config.section,
      userRollNo: config.rollNo,
      // Borrow record fields
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      returnDate: borrowRecords.returnDate,
      borrowStatus: borrowRecords.status,
      // Book fields
      bookId: books.id,
      bookTitle: books.title,
      bookAuthor: books.author,
      bookCoverUrl: books.coverUrl,
    })
    .from(requests)
    .leftJoin(borrowRecords, eq(requests.borrowRecordId, borrowRecords.id))
    .leftJoin(books, eq(borrowRecords.bookId, books.id))
    .leftJoin(user, eq(requests.userId, user.id))
    .leftJoin(config, eq(requests.userId, config.userId))
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!result.length) return null;

  const row = result[0];
  return {
    id: row.id,
    userId: row.userId,
    borrowRecordId: row.borrowRecordId,
    type: row.type,
    reason: row.reason,
    description: row.description,
    requestedDate: row.requestedDate,
    status: row.status,
    adminResponse: row.adminResponse,
    adminId: row.adminId,
    rescindedAt: row.rescindedAt,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    user: {
      id: row.userId,
      name: row.userName || "",
      email: row.userEmail || "",
    },
    config: {
      fullName: row.userFullName || "",
      class: row.userClass || "",
      section: row.userSection || "",
      rollNo: row.userRollNo || "",
    },
    borrowRecord: {
      id: row.borrowRecordId,
      borrowDate: row.borrowDate,
      dueDate: row.dueDate,
      returnDate: row.returnDate,
      status: row.borrowStatus || "",
    },
    book: {
      id: row.bookId || "",
      title: row.bookTitle || "",
      author: row.bookAuthor || "",
      coverUrl: row.bookCoverUrl || "",
    },
  };
}

export async function createRequest(requestData: {
  userId: string;
  borrowRecordId: string;
  type: RequestTypeEnum;
  reason: string;
  description?: string;
  requestedDate?: string;
}): Promise<void> {
  await db.insert(requests).values({
    ...requestData,
    status: "PENDING",
  });
}

export async function rescindRequest(requestId: string): Promise<void> {
  await db
    .update(requests)
    .set({
      status: "RESCINDED",
      rescindedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));
}

export async function respondToRequest(
  requestId: string,
  status: "APPROVED" | "REJECTED",
  adminResponse: string,
  adminId: string,
): Promise<void> {
  await db
    .update(requests)
    .set({
      status,
      adminResponse,
      adminId,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));
}
