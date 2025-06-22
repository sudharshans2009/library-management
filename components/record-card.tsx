import { Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { db } from "@/database/drizzle";
import { books, BorrowRecord, Book } from "@/database/schema";
import { eq } from "drizzle-orm";

interface RecordCardProps {
  record: {
    record: BorrowRecord;
    book: Book;
  } | BorrowRecord;
}

export default async function RecordCard({ record }: RecordCardProps) {
  let borrowRecord: BorrowRecord;
  let book: Book;

  // Handle both formats: joined data or separate record
  if ('record' in record && 'book' in record) {
    // Joined data from dashboard
    borrowRecord = record.record;
    book = record.book;
  } else {
    // Just a borrow record, need to fetch book
    borrowRecord = record as BorrowRecord;
    
    // Fetch book details using Drizzle
    const [bookData] = await db
      .select()
      .from(books)
      .where(eq(books.id, borrowRecord.bookId))
      .limit(1);
    
    if (!bookData) {
      return <div>Book not found</div>;
    }
    
    book = bookData;
  }

  if (!book) {
    return <div>Loading book details...</div>;
  }

  const badgeVariant: "default" | "destructive" | "outline" | "secondary" =
    borrowRecord.status === "RETURNED"
      ? "default"
      : borrowRecord.status === "BORROWED"
      ? "secondary"
      : borrowRecord.status === "PENDING"
      ? "outline"
      : "secondary";

  // Check record status for conditional rendering
  const isPending = borrowRecord.status === "PENDING";
  const isReturned = borrowRecord.status === "RETURNED";
  const isBorrowed = borrowRecord.status === "BORROWED";

  // Check if book is overdue (for borrowed books)
  const isOverdue = isBorrowed && borrowRecord.dueDate && 
    new Date(borrowRecord.dueDate) < new Date();

  const displayBadgeVariant = isOverdue ? "destructive" : badgeVariant;
  const displayStatus = isOverdue ? "OVERDUE" : borrowRecord.status;

  return (
    <div>
      <Card className="relative py-0 overflow-hidden">
        <CardHeader className="absolute text-xl font-bold flex items-center gap-2 bg-background/80 z-20 bottom-0 left-0 right-0 p-4">
          <CardTitle className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < book.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </CardTitle>
          <CardDescription className="flex gap-2 text-lg items-center text-foreground">
            {book.rating}/5
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 relative mt-auto w-full">
          <Image
            src={book.coverUrl || "/placeholder.png"}
            className="object-cover aspect-[11/16]"
            alt="Book Cover"
            width={700}
            height={1000}
          />
        </CardContent>
      </Card>
      <div className="mt-4 text-center bg-card p-4 rounded-lg shadow-md">
        <h3 className="text-lg max-w-xs sm:max-w-full mx-auto font-semibold truncate">{book.title}</h3>
        <p className="text-sm max-w-xs sm:max-w-full mx-auto text-muted-foreground truncate">
          {book.author || "Unknown Author"}
        </p>
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={displayBadgeVariant}>
                {displayStatus}
              </Badge>
            </div>
            {borrowRecord.borrowDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Borrow Date</span>
                <Badge variant="outline">
                  {new Date(borrowRecord.borrowDate).toLocaleDateString()}
                </Badge>
              </div>
            )}
            {!isReturned && borrowRecord.dueDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <Badge variant={isOverdue ? "destructive" : "outline"}>
                  {!isPending
                    ? new Date(borrowRecord.dueDate).toLocaleDateString()
                    : "PENDING"}
                </Badge>
              </div>
            )}
            {isReturned && borrowRecord.returnDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Return Date</span>
                <Badge variant="outline">
                  {new Date(borrowRecord.returnDate).toLocaleDateString()}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <Link
          className="w-full"
          href={`/records/${borrowRecord.id}`}
        >
          <Button variant="secondary" className="w-full mt-4">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
