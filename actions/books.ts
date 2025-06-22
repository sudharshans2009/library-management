"use server";

import { v4 as uuidv4 } from "uuid";
import { db } from "@/database/drizzle";
import { config, books, borrowRecords } from "@/database/schema";
import { eq, and, or, like, count, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Types
interface BorrowBookOptions {
  bookId: string;
  confirm?: boolean;
}

export interface BookWithStats {
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
  videoUrl: string;
  summary: string;
  createdAt: Date | null;
  updatedAt: Date | null;
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

// Regular book actions
export async function getBookById(bookId: string) {
  try {
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book) {
      return {
        success: false,
        message: "Book not found",
        data: null,
      };
    }

    return {
      success: true,
      data: book,
    };
  } catch (error) {
    console.error("Error fetching book:", error);
    return {
      success: false,
      message: "Failed to fetch book",
      data: null,
    };
  }
}

export async function borrowBook(options: BorrowBookOptions) {
  try {
    const { bookId, confirm = false } = options;

    if (!bookId) {
      return {
        success: false,
        message: "Book ID is required",
        redirect: null,
      };
    }

    // User Authentication & Authorization using Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        message: "Authentication required",
        redirect: "/sign-in",
      };
    }

    const currentUser = session.user;

    // User Verification and Status Check using Drizzle
    const [dbUserConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (!dbUserConfig) {
      return {
        success: false,
        message: "User configuration not found",
        redirect: "/setup",
      };
    }

    // CHECK USER STATUS: Block PENDING or REJECTED users
    if (dbUserConfig.status === "PENDING") {
      return {
        success: false,
        message:
          "Your account is currently pending approval. You cannot request books until your account is approved by an administrator.",
        redirect: null,
      };
    }

    if (dbUserConfig.status === "SUSPENDED") {
      return {
        success: false,
        message:
          "Your account is currently suspended. You cannot request books until your account is reactivated.",
        redirect: null,
      };
    }

    // Only APPROVED users can proceed beyond this point
    if (dbUserConfig.status !== "APPROVED") {
      return {
        success: false,
        message: `Your account status is ${dbUserConfig.status}. Only users with APPROVED status can request books.`,
        redirect: null,
      };
    }

    // Check Book Existence and Availability using Drizzle
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book) {
      return {
        success: false,
        message: "Book not found",
        redirect: null,
      };
    }

    // CRITICAL CHECK: Stop here if no available copies
    if (book.availableCopies <= 0) {
      return {
        success: false,
        message: `This book is currently out of stock. ${book.totalCopies} total copies, all currently borrowed.`,
        redirect: null,
      };
    }

    // User Borrowing History Analysis using Drizzle
    const userBorrowHistory = await db
      .select()
      .from(borrowRecords)
      .where(
        and(
          eq(borrowRecords.userId, currentUser.id),
          eq(borrowRecords.bookId, bookId),
        ),
      );

    // Check for active borrows (user already has this book)
    const activeBorrow = userBorrowHistory.find((borrow) =>
      ["PENDING", "BORROWED"].includes(borrow.status),
    );

    if (activeBorrow) {
      return {
        success: false,
        message: `You already have an active borrow record for this book with status: ${activeBorrow.status}`,
        redirect: null,
      };
    }

    // Check for re-borrowing confirmation
    const returnedBorrow = userBorrowHistory.find(
      (borrow) => borrow.status === "RETURNED",
    );

    if (returnedBorrow && !confirm) {
      return {
        success: false,
        message:
          "You have previously returned this book. Confirm to borrow again.",
        requiresConfirmation: true,
        redirect: null,
      };
    }

    // Creating the Borrow Record using Drizzle
    const borrowDate = new Date();
    // PENDING status gets 28 days from request date as due date
    const dueDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);

    // Create borrow record with PENDING status - availability stays the same
    const [borrowRecord] = await db
      .insert(borrowRecords)
      .values({
        id: uuidv4(),
        userId: currentUser.id,
        bookId: bookId,
        borrowDate,
        dueDate: dueDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
        status: "PENDING",
      })
      .returning();

    revalidatePath(`/books/${bookId}`);
    revalidatePath("/");

    return {
      success: true,
      message: "Book borrow request submitted successfully - awaiting approval",
      data: {
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
      },
      redirect: null,
    };
  } catch (error) {
    console.error("Borrow error:", error);
    return {
      success: false,
      message: "Failed to process borrow request",
      redirect: null,
    };
  }
}

// Admin book actions
export async function getAdminBooks(options: BookSearchOptions = {}): Promise<{
  success: boolean;
  data?: PaginatedBooksResponse;
  message?: string;
}> {
  try {
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
      let bookAvailability: "Available" | "Limited" | "Out of Stock";
      if (book.availableCopies === 0) {
        bookAvailability = "Out of Stock";
      } else if (book.availableCopies <= book.totalCopies * 0.3) {
        bookAvailability = "Limited";
      } else {
        bookAvailability = "Available";
      }

      // Calculate popularity based on borrow count
      let bookPopularity: "High" | "Medium" | "Low";
      if (book.borrowCount >= 10) {
        bookPopularity = "High";
      } else if (book.borrowCount >= 5) {
        bookPopularity = "Medium";
      } else {
        bookPopularity = "Low";
      }

      return {
        ...book,
        borrowCount: Number(book.borrowCount),
        activeBorrows: Number(book.activeBorrows),
        popularity: bookPopularity,
        availability: bookAvailability,
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
      success: true,
      data: {
        books: filteredBooks,
        totalCount,
        totalPages,
        currentPage: page,
      },
    };
  } catch (error) {
    console.error("Error fetching books:", error);
    return {
      success: false,
      message: "Failed to fetch books",
    };
  }
}

export async function deleteBook(bookId: string) {
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

    // Check if user is admin
    const [userConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (!userConfig || userConfig.role !== "ADMIN") {
      return {
        success: false,
        message: "Only administrators can delete books",
      };
    }

    // Check if book has active borrows
    const [activeBorrows] = await db
      .select({ count: sql<number>`count(*)` })
      .from(borrowRecords)
      .where(eq(borrowRecords.bookId, bookId));

    if (activeBorrows && Number(activeBorrows.count) > 0) {
      return {
        success: false,
        message: "Cannot delete book with active borrow records",
      };
    }

    // Delete the book
    await db.delete(books).where(eq(books.id, bookId));

    revalidatePath("/admin/books");

    return {
      success: true,
      message: "Book deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting book:", error);
    return {
      success: false,
      message: "Failed to delete book",
    };
  }
}

export async function updateBookCopies(
  bookId: string,
  totalCopies: number,
  availableCopies: number,
) {
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

    if (
      !userConfig ||
      !["ADMIN", "MODERATOR"].includes(userConfig.role || "USER")
    ) {
      return {
        success: false,
        message: "Only administrators and moderators can update book copies",
      };
    }

    // Validate input
    if (totalCopies < 0 || availableCopies < 0) {
      return {
        success: false,
        message: "Copies cannot be negative",
      };
    }

    if (availableCopies > totalCopies) {
      return {
        success: false,
        message: "Available copies cannot exceed total copies",
      };
    }

    // Update book copies
    await db
      .update(books)
      .set({
        totalCopies,
        availableCopies,
        updatedAt: new Date(),
      })
      .where(eq(books.id, bookId));

    revalidatePath("/admin/books");

    return {
      success: true,
      message: "Book copies updated successfully",
    };
  } catch (error) {
    console.error("Error updating book copies:", error);
    return {
      success: false,
      message: "Failed to update book copies",
    };
  }
}

export async function exportBooksToCSV(options: BookSearchOptions) {
  try {
    // Get all books without pagination for export
    const allBooksResult = await getAdminBooks({
      ...options,
      limit: 10000,
      page: 1,
    });

    if (!allBooksResult.success || !allBooksResult.data) {
      throw new Error("Failed to fetch books for export");
    }

    const csvData = allBooksResult.data.books.map((book) => ({
      title: book.title,
      author: book.author,
      genre: book.genre,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      borrowCount: book.borrowCount,
      activeBorrows: book.activeBorrows,
      popularity: book.popularity,
      availability: book.availability,
      rating: book.rating,
      createdAt: book.createdAt
        ? new Date(book.createdAt).toLocaleDateString()
        : "N/A",
    }));

    return {
      success: true,
      data: csvData,
    };
  } catch (error) {
    console.error("Error exporting books:", error);
    return {
      success: false,
      message: "Failed to export books",
      data: null,
    };
  }
}

export async function getBooksGenres() {
  try {
    const genres = await db.selectDistinct({ genre: books.genre }).from(books);

    return {
      success: true,
      data: genres.map((g) => g.genre),
    };
  } catch (error) {
    console.error("Error fetching genres:", error);
    return {
      success: false,
      message: "Failed to fetch genres",
      data: [],
    };
  }
}

export async function createBook(bookData: {
  title: string;
  author: string;
  genre: string;
  rating: number;
  description: string;
  summary: string;
  totalCopies: number;
  availableCopies: number;
  coverUrl: string;
  videoUrl: string;
  coverColor: string;
}) {
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

    // Check if user is admin
    const [userConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (!userConfig || userConfig.role !== "ADMIN") {
      return {
        success: false,
        message: "Only administrators can create books",
      };
    }

    // Create the book
    const [newBook] = await db
      .insert(books)
      .values({
        id: uuidv4(),
        ...bookData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath("/admin/books");

    return {
      success: true,
      message: "Book created successfully",
      data: newBook,
    };
  } catch (error) {
    console.error("Error creating book:", error);
    return {
      success: false,
      message: "Failed to create book",
    };
  }
}

export async function updateBook(
  bookId: string,
  bookData: {
    title: string;
    author: string;
    genre: string;
    rating: number;
    description: string;
    summary: string;
    totalCopies: number;
    availableCopies: number;
    coverUrl: string;
    videoUrl: string;
    coverColor: string;
  },
) {
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

    // Check if user is admin
    const [userConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (!userConfig || userConfig.role !== "ADMIN") {
      return {
        success: false,
        message: "Only administrators can update books",
      };
    }

    // Update the book
    const [updatedBook] = await db
      .update(books)
      .set({
        ...bookData,
        updatedAt: new Date(),
      })
      .where(eq(books.id, bookId))
      .returning();

    if (!updatedBook) {
      return {
        success: false,
        message: "Book not found",
      };
    }

    revalidatePath("/admin/books");
    revalidatePath(`/admin/books/${bookId}`);

    return {
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    };
  } catch (error) {
    console.error("Error updating book:", error);
    return {
      success: false,
      message: "Failed to update book",
    };
  }
}
