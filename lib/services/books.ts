import { db } from "@/database/drizzle";
import { books, borrowRecords } from "@/database/schema";
import { eq, and, or, like, count, sql } from "drizzle-orm";
import type { Book } from "@/database/schema";

export interface BookWithStats extends Book {
  borrowCount: number;
  activeBorrows: number;
  popularity: "High" | "Medium" | "Low";
  availability: "Available" | "Limited" | "Out of Stock";
}

export interface BookSearchOptions {
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  availability?: "Available" | "Limited" | "Out of Stock";
  popularity?: "High" | "Medium" | "Low";
  sortBy?: "title" | "author" | "createdAt" | "borrowCount" | "availableCopies";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedBooksResponse {
  books: BookWithStats[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function getAdminBooks(
  options: BookSearchOptions = {},
): Promise<PaginatedBooksResponse> {
  const {
    page = 1,
    limit = 10,
    search,
    genre,
    availability,
    popularity,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [];

  if (search) {
    whereConditions.push(
      or(
        like(books.title, `%${search}%`),
        like(books.author, `%${search}%`),
        like(books.genre, `%${search}%`),
      ),
    );
  }

  if (genre) {
    whereConditions.push(eq(books.genre, genre));
  }

  // Get total count
  const totalCountResult = await db
    .select({ count: count() })
    .from(books)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const totalCount = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Get books with borrow statistics
  const booksWithStats = await db
    .select({
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
      videoUrl: books.videoUrl,
      summary: books.summary,
      createdAt: books.createdAt,
      updatedAt: books.updatedAt,
      borrowCount: sql<number>`COALESCE(COUNT(${borrowRecords.id}), 0)`,
      activeBorrows: sql<number>`COALESCE(SUM(CASE WHEN ${borrowRecords.status} = 'BORROWED' THEN 1 ELSE 0 END), 0)`,
    })
    .from(books)
    .leftJoin(borrowRecords, eq(books.id, borrowRecords.bookId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(books.id)
    .limit(limit)
    .offset(offset);

  // Process books with calculated fields
  const processedBooks: BookWithStats[] = booksWithStats.map((book) => {
    // Calculate availability status
    let availability: "Available" | "Limited" | "Out of Stock";
    if (book.availableCopies === 0) {
      availability = "Out of Stock";
    } else if (book.availableCopies <= book.totalCopies * 0.3) {
      availability = "Limited";
    } else {
      availability = "Available";
    }

    // Calculate popularity based on borrow count
    let popularity: "High" | "Medium" | "Low";
    if (book.borrowCount >= 10) {
      popularity = "High";
    } else if (book.borrowCount >= 5) {
      popularity = "Medium";
    } else {
      popularity = "Low";
    }

    return {
      ...book,
      borrowCount: Number(book.borrowCount),
      activeBorrows: Number(book.activeBorrows),
      popularity,
      availability,
    };
  });

  // Apply additional filters based on calculated fields
  let filteredBooks = processedBooks;

  if (availability) {
    filteredBooks = filteredBooks.filter(
      (book) => book.availability === availability,
    );
  }

  if (popularity) {
    filteredBooks = filteredBooks.filter(
      (book) => book.popularity === popularity,
    );
  }

  // Apply sorting
  if (sortBy === "borrowCount") {
    filteredBooks.sort((a, b) => {
      return sortOrder === "desc"
        ? b.borrowCount - a.borrowCount
        : a.borrowCount - b.borrowCount;
    });
  } else if (sortBy === "availableCopies") {
    filteredBooks.sort((a, b) => {
      return sortOrder === "desc"
        ? b.availableCopies - a.availableCopies
        : a.availableCopies - b.availableCopies;
    });
  } else if (sortBy === "title") {
    filteredBooks.sort((a, b) => {
      return sortOrder === "desc"
        ? b.title.localeCompare(a.title)
        : a.title.localeCompare(b.title);
    });
  } else if (sortBy === "author") {
    filteredBooks.sort((a, b) => {
      return sortOrder === "desc"
        ? b.author.localeCompare(a.author)
        : a.author.localeCompare(b.author);
    });
  }

  return {
    books: filteredBooks,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

export async function getBookGenres(): Promise<string[]> {
  const genres = await db.selectDistinct({ genre: books.genre }).from(books);

  return genres.map((g) => g.genre);
}
