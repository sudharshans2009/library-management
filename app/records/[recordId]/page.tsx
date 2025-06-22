import Image from "next/image";
import React from "react";
import {
  Book,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Star,
  Plus,
  FileText,
} from "lucide-react";
import { Background } from "@/components/background";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import BooksList from "@/components/book-list";
import { getBorrowRecordById } from "@/actions/records";
import { getBookById } from "@/actions/books";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import Link from "next/link";
import { CreateRequestButton } from "@/components/requests/create-request-button";
import { Button } from "@/components/ui/button";

interface RecordPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
  params: Promise<{
    recordId: string;
  }>;
}

export default async function RecordPage({
  params,
  searchParams,
}: RecordPageProps) {
  const { recordId } = await params;

  // Get current user using Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
        <Background />
        <div className="flex flex-col items-center justify-center max-w-7xl mx-auto min-h-screen">
          <p className="text-muted-foreground">
            Please sign in to view this record.
          </p>
        </div>
      </main>
    );
  }

  // Get borrow record
  const recordResult = await getBorrowRecordById(recordId);

  if (!recordResult.success || !recordResult.data) {
    return (
      <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
        <Background />
        <div className="flex flex-col items-center justify-center max-w-7xl mx-auto min-h-screen">
          <p className="text-muted-foreground">Record not found.</p>
        </div>
      </main>
    );
  }

  const record = recordResult.data;

  // Check if user owns this record or is admin
  const isOwner = record.userId === session.user.id;
  // You might want to check if user is admin here too

  if (!isOwner) {
    return (
      <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
        <Background />
        <div className="flex flex-col items-center justify-center max-w-7xl mx-auto min-h-screen">
          <p className="text-muted-foreground">
            You don&apos;t have permission to view this record.
          </p>
        </div>
      </main>
    );
  }

  // Get book details
  const bookResult = await getBookById(record.bookId);

  if (!bookResult.success || !bookResult.data) {
    return (
      <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
        <Background />
        <div className="flex flex-col items-center justify-center max-w-7xl mx-auto min-h-screen">
          <p className="text-muted-foreground">Book not found.</p>
        </div>
      </main>
    );
  }

  const book = bookResult.data;

  // Calculate days and status
  const borrowDate = new Date(record.borrowDate);
  const dueDate = new Date(record.dueDate);
  const returnDate = record.returnDate ? new Date(record.returnDate) : null;
  const today = new Date();

  const daysBorrowed = Math.floor(
    (today.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysUntilDue = Math.floor(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = !returnDate && daysUntilDue < 0;
  const isReturned = !!returnDate;

  return (
    <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
      <Background />
      <div className="flex flex-col items-center max-w-7xl mx-auto">
        <section
          id="home"
          className="relative w-full h-full pt-24 gap-10 flex flex-col lg:flex-row items-center lg:items-start justify-center"
        >
          <div className="w-full flex flex-col items-center lg:items-start gap-5">
            <span className="inline-flex items-center gap-4 px-4 py-2 bg-primary/20 rounded-md">
              <Book className="w-4 h-4" />
              Borrow Record #{record.id.slice(0, 8)}
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-center lg:text-left max-w-4xl">
              {book.title}
            </h1>
            <p className="text-base lg:text-lg text-center lg:text-left leading-relaxed text-muted-foreground max-w-3xl">
              {book.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge
                variant={
                  isReturned
                    ? "default"
                    : isOverdue
                      ? "destructive"
                      : "secondary"
                }
                className="text-base px-3 py-1"
              >
                {isReturned ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : isOverdue ? (
                  <AlertCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Clock className="w-4 h-4 mr-2" />
                )}
                {isReturned ? "Returned" : isOverdue ? "Overdue" : "Active"}
              </Badge>
              <Badge variant="outline" className="text-base px-3 py-1">
                <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
                {book.rating}/5
              </Badge>
              <Badge variant="outline" className="text-base px-3 py-1">
                {book.genre}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Link href={`/books/${book.id}`}>
                <Button variant="outline" size="lg">
                  <Book className="w-4 h-4 mr-2" />
                  View Book Details
                </Button>
              </Link>

              {/* Show request button only for active borrows */}
              {!isReturned && (
                <CreateRequestButton
                  borrowRecordId={record.id}
                  variant="default"
                  size="lg"
                />
              )}

              <Link href="/requests">
                <Button variant="outline" size="lg">
                  <FileText className="w-4 h-4 mr-2" />
                  My Requests
                </Button>
              </Link>
            </div>
          </div>

          {/* Book Cover and Details */}
          <div className="w-full lg:w-auto flex flex-col items-center gap-8">
            <div className="relative w-80 h-[500px] rounded-xl overflow-hidden shadow-2xl">
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: book.coverColor }}
                >
                  <Book className="w-20 h-20 text-white" />
                </div>
              )}
            </div>

            {/* Record Information Card */}
            <div className="w-80 bg-card/50 backdrop-blur-sm border rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">Borrow Details</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Borrowed Date
                    </p>
                    <p className="font-medium">
                      {borrowDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p
                      className={`font-medium ${
                        isOverdue ? "text-destructive" : ""
                      }`}
                    >
                      {dueDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {returnDate && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Return Date
                      </p>
                      <p className="font-medium text-green-600">
                        {returnDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Days Borrowed
                    </p>
                    <p className="font-medium">{daysBorrowed} days</p>
                  </div>
                </div>

                {!isReturned && (
                  <div className="flex items-center gap-3">
                    <AlertCircle
                      className={`w-4 h-4 ${
                        isOverdue ? "text-destructive" : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Days Until Due
                      </p>
                      <p
                        className={`font-medium ${
                          isOverdue
                            ? "text-destructive"
                            : daysUntilDue <= 3
                              ? "text-orange-600"
                              : ""
                        }`}
                      >
                        {isOverdue
                          ? `${Math.abs(daysUntilDue)} days overdue`
                          : `${daysUntilDue} days remaining`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Alerts */}
              {!isOverdue && !isReturned && daysUntilDue <= 3 && (
                <div className="mt-4 p-3 border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Due soon! Consider extending if needed.
                    </span>
                  </div>
                </div>
              )}

              {isOverdue && (
                <div className="mt-4 p-3 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      This book is overdue! Please return it as soon as
                      possible.
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Quick Actions
                </h4>
                <div className="space-y-2">
                  {!isReturned && (
                    <CreateRequestButton
                      borrowRecordId={record.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    />
                  )}
                  <Link href="/requests" className="block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View All Requests
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <BooksList
          searchParams={await searchParams}
          showTitle={true}
          showDescription={true}
          className="pt-24"
        />
      </div>
    </main>
  );
}
