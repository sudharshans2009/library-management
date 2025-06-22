import React from "react";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { count, desc } from "drizzle-orm";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import BookCard from "@/components/book-card";
import { cn } from "@/lib/utils";

interface BooksListProps {
  searchParams: {
    page?: string;
    genre?: string;
    exclude?: string;
  };
  showTitle?: boolean;
  showDescription?: boolean;
  className?: string;
}

interface PaginationResult {
  books: typeof books.$inferSelect[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

async function getBooksWithPagination(
  page: number,
  limit: number
): Promise<PaginationResult> {
  const offset = (page - 1) * limit;

  // Get total count
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(books);

  const totalCount = totalCountResult.count;
  const totalPages = Math.ceil(totalCount / limit);

  // Get books with pagination
  const booksData = await db
    .select()
    .from(books)
    .orderBy(desc(books.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    books: booksData,
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export default async function BooksList({
  searchParams,
  showTitle = true,
  showDescription = true,
  className = "",
}: BooksListProps) {
  const currentPage = parseInt(searchParams.page || "1");
  const booksPerPage = 8;

  const {
    books: booksData,
    totalCount,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = await getBooksWithPagination(currentPage, booksPerPage);

  const generatePaginationItems = () => {
    const items = [];
    const showEllipsis = totalPages > 7;

    if (showEllipsis) {
      items.push(1);

      if (currentPage > 4) {
        items.push("ellipsis-start");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!items.includes(i)) {
          items.push(i);
        }
      }

      if (currentPage < totalPages - 3) {
        items.push("ellipsis-end");
      }

      if (totalPages > 1) {
        items.push(totalPages);
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    }

    return items;
  };

  const paginationItems = generatePaginationItems();

  return (
    <section
      id="books"
      className={cn(
        `relative w-full h-full flex flex-col gap-8 items-center justify-center`,
        className
      )}
    >
      {(showTitle || showDescription) && (
        <div className="w-full flex flex-col items-center gap-5">
          {showTitle && (
            <h1 className="text-3xl lg:text-5xl font-bold leading-tight text-center max-w-4xl">
              Explore Our <span className="text-primary">Book Collection</span>
            </h1>
          )}
          {showDescription && (
            <p className="text-lg lg:text-xl text-center leading-relaxed text-muted-foreground max-w-4xl">
              Discover a curated selection of books across various genres.
              Whether you&apos;re looking for fiction, non-fiction, or something
              in between, we have something for every reader.
            </p>
          )}
          <Badge className="text-base">
            Showing {booksData.length} of {totalCount} books
          </Badge>
        </div>
      )}

      {/* Top Pagination */}
      {totalPages > 1 && (
        <Pagination className="mb-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={hasPrevPage ? `?page=${currentPage - 1}` : "#"}
                className={!hasPrevPage ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {paginationItems.map((item, index) => (
              <PaginationItem key={index}>
                {item === "ellipsis-start" || item === "ellipsis-end" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href={`?page=${item}`}
                    isActive={currentPage === item}
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={hasNextPage ? `?page=${currentPage + 1}` : "#"}
                className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Books Grid */}
      <div className="w-full grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {booksData.map((book) => (
          <BookCard book={book} key={book.id} />
        ))}
      </div>

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={hasPrevPage ? `?page=${currentPage - 1}` : "#"}
                className={!hasPrevPage ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {paginationItems.map((item, index) => (
              <PaginationItem key={index}>
                {item === "ellipsis-start" || item === "ellipsis-end" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href={`?page=${item}`}
                    isActive={currentPage === item}
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={hasNextPage ? `?page=${currentPage + 1}` : "#"}
                className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* No books message */}
      {booksData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No books found.</p>
        </div>
      )}
    </section>
  );
}
