/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/database/drizzle";
import { borrowRecords, user, config, books } from "@/database/schema";
import { eq, and, or, like, desc, asc, count, sql } from "drizzle-orm";
import type { BorrowStatusEnum } from "@/database/schema";

export interface BorrowRecordWithDetails {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: Date;
  dueDate: string;
  returnDate: string | null;
  status: BorrowStatusEnum;
  createdAt: Date | null;
  updatedAt: Date | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  config: {
    id: string;
    fullName: string;
    status: string | null;
    role: string | null;
    class: string;
    section: string;
    rollNo: string;
  };
  book: {
    id: string;
    title: string;
    author: string;
    genre: string;
    rating: number;
    coverUrl: string;
    coverColor: string;
    description: string;
    totalCopies: number;
    availableCopies: number;
  };
}

export interface RecordSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: BorrowStatusEnum;
  sortBy?: "borrowDate" | "dueDate" | "returnDate" | "user" | "book";
  sortOrder?: "asc" | "desc";
  bookId?: string;
  userId?: string;
}

export interface PaginatedRecordsResponse {
  records: BorrowRecordWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function getBorrowRecords(
  options: RecordSearchOptions = {},
): Promise<PaginatedRecordsResponse> {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    sortBy = "borrowDate",
    sortOrder = "desc",
    bookId,
    userId,
  } = options;

  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [];

  if (status) {
    whereConditions.push(eq(borrowRecords.status, status));
  }

  if (search) {
    whereConditions.push(
      or(
        like(user.name, `%${search}%`),
        like(config.fullName, `%${search}%`),
        like(books.title, `%${search}%`),
        like(books.author, `%${search}%`),
        like(config.rollNo, `%${search}%`),
      ),
    );
  }

  if (bookId) {
    whereConditions.push(eq(borrowRecords.bookId, bookId));
  }

  if (userId) {
    whereConditions.push(eq(borrowRecords.userId, userId));
  }

  // Build order by
  const orderBy = [];
  if (sortBy === "borrowDate") {
    orderBy.push(
      sortOrder === "desc"
        ? desc(borrowRecords.borrowDate)
        : asc(borrowRecords.borrowDate),
    );
  } else if (sortBy === "dueDate") {
    orderBy.push(
      sortOrder === "desc"
        ? desc(borrowRecords.dueDate)
        : asc(borrowRecords.dueDate),
    );
  } else if (sortBy === "returnDate") {
    orderBy.push(
      sortOrder === "desc"
        ? desc(borrowRecords.returnDate)
        : asc(borrowRecords.returnDate),
    );
  } else if (sortBy === "user") {
    orderBy.push(sortOrder === "desc" ? desc(user.name) : asc(user.name));
  } else if (sortBy === "book") {
    orderBy.push(sortOrder === "desc" ? desc(books.title) : asc(books.title));
  }

  // Get total count
  const totalCountResult = await db
    .select({ count: count() })
    .from(borrowRecords)
    .innerJoin(user, eq(borrowRecords.userId, user.id))
    .innerJoin(config, eq(user.id, config.userId))
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const totalCount = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Get paginated records
  const records = await db
    .select({
      id: borrowRecords.id,
      userId: borrowRecords.userId,
      bookId: borrowRecords.bookId,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      returnDate: borrowRecords.returnDate,
      status: borrowRecords.status,
      createdAt: borrowRecords.createdAt,
      updatedAt: borrowRecords.updatedAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      config: {
        id: config.id,
        fullName: config.fullName,
        status: config.status,
        role: config.role,
        class: config.class,
        section: config.section,
        rollNo: config.rollNo,
      },
      book: {
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
        rating: books.rating,
        coverUrl: books.coverUrl,
        coverColor: books.coverColor,
        description: books.description,
        totalCopies: books.totalCopies,
        availableCopies: books.availableCopies,
      },
    })
    .from(borrowRecords)
    .innerJoin(user, eq(borrowRecords.userId, user.id))
    .innerJoin(config, eq(user.id, config.userId))
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  return {
    records: records as BorrowRecordWithDetails[],
    totalCount,
    totalPages,
    currentPage: page,
  };
}

export async function getBorrowRecordById(
  recordId: string,
): Promise<BorrowRecordWithDetails | null> {
  const [record] = await db
    .select({
      id: borrowRecords.id,
      userId: borrowRecords.userId,
      bookId: borrowRecords.bookId,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      returnDate: borrowRecords.returnDate,
      status: borrowRecords.status,
      createdAt: borrowRecords.createdAt,
      updatedAt: borrowRecords.updatedAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      config: {
        id: config.id,
        fullName: config.fullName,
        status: config.status,
        role: config.role,
        class: config.class,
        section: config.section,
        rollNo: config.rollNo,
      },
      book: {
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
        rating: books.rating,
        coverUrl: books.coverUrl,
        coverColor: books.coverColor,
        description: books.description,
        totalCopies: books.totalCopies,
        availableCopies: books.availableCopies,
      },
    })
    .from(borrowRecords)
    .innerJoin(user, eq(borrowRecords.userId, user.id))
    .innerJoin(config, eq(user.id, config.userId))
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .where(eq(borrowRecords.id, recordId))
    .limit(1);

  return (record as BorrowRecordWithDetails) || null;
}

export async function updateBorrowRecordStatus(
  recordId: string,
  status: BorrowStatusEnum,
  returnDate?: string,
): Promise<void> {
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (returnDate) {
    updateData.returnDate = returnDate;
  }

  await db
    .update(borrowRecords)
    .set(updateData)
    .where(eq(borrowRecords.id, recordId));
}

export async function updateBookAvailability(
  bookId: string,
  change: number, // +1 for return, -1 for borrow
): Promise<void> {
  await db
    .update(books)
    .set({
      availableCopies: sql`${books.availableCopies} + ${change}`,
      updatedAt: new Date(),
    })
    .where(eq(books.id, bookId));
}

export async function deleteBorrowRecord(recordId: string): Promise<void> {
  await db.delete(borrowRecords).where(eq(borrowRecords.id, recordId));
}

export async function getBookAvailability(
  bookId: string,
): Promise<{ availableCopies: number; totalCopies: number } | null> {
  const [book] = await db
    .select({
      availableCopies: books.availableCopies,
      totalCopies: books.totalCopies,
    })
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);

  return book || null;
}
