import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  EditIcon,
  BookIcon,
  UsersIcon,
  StarIcon,
  TrendingUpIcon,
  ClockIcon,
  PlayIcon,
} from "lucide-react";
import { getBookById, getAdminBooks } from "@/actions/books";
import { getBorrowRecords } from "@/actions/records";
import BorrowRecordsTable from "../_components/borrow-records-table";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AdminBookDetailsPageProps {
  params: Promise<{
    bookId: string;
  }>;
}

export default async function AdminBookDetailsPage({
  params,
}: AdminBookDetailsPageProps) {
  const { bookId } = await params;

  const bookResult = await getBookById(bookId);

  if (!bookResult.success || !bookResult.data) {
    notFound();
  }

  const book = bookResult.data;

  // Get borrow records for this specific book only
  const borrowRecordsResult = await getBorrowRecords({
    bookId: bookId, // Filter by specific book ID
    limit: 5,
    page: 1,
  });

  // Get book statistics
  const statsResult = await getAdminBooks({
    search: book.title,
    limit: 1,
  });

  const bookStats =
    statsResult.success && statsResult.data?.books[0]
      ? statsResult.data.books[0]
      : null;

  return (
    <main className="relative w-full px-5 z-10">
      <div className="flex flex-col max-w-7xl pt-24 mx-auto min-h-screen py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold">{book.title}</h1>
            <p className="text-muted-foreground mt-2">
              Book details and management
            </p>
          </div>
          <Link href={`/admin/books/${bookId}/edit`}>
            <Button size="lg">
              <EditIcon className="w-4 h-4 mr-2" />
              Edit Book
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover and Basic Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative w-48 h-64 rounded-lg overflow-hidden shadow-xl">
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: book.coverColor }}
                      >
                        <BookIcon className="w-24 h-24 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold">{book.title}</h2>
                    <p className="text-muted-foreground">by {book.author}</p>
                    <Badge variant="secondary">{book.genre}</Badge>
                  </div>

                  <div className="flex items-center space-x-1">
                    <StarIcon className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{book.rating}</span>
                    <span className="text-muted-foreground">/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Preview */}
            {book.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PlayIcon className="w-5 h-5 mr-2" />
                    Book Trailer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <video
                      src={book.videoUrl}
                      controls
                      className="w-full h-full object-cover"
                      poster={book.coverUrl}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <BookIcon className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {book.availableCopies}
                      </p>
                      <p className="text-sm text-muted-foreground">Available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {bookStats?.borrowCount || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Borrows
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {bookStats?.activeBorrows || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Active Borrows
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Availability Status */}
            <Card>
              <CardHeader>
                <CardTitle>Availability Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Copies in use</span>
                  <span className="font-medium">
                    {book.totalCopies - book.availableCopies} of{" "}
                    {book.totalCopies}
                  </span>
                </div>
                <Progress
                  value={
                    ((book.totalCopies - book.availableCopies) /
                      book.totalCopies) *
                    100
                  }
                  className="h-2"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Available: {book.availableCopies}</span>
                  <span>Total: {book.totalCopies}</span>
                </div>

                {bookStats && (
                  <div className="pt-2">
                    <Badge
                      variant={
                        bookStats.availability === "Available"
                          ? "default"
                          : bookStats.availability === "Limited"
                            ? "secondary"
                            : "destructive"
                      }
                      className={
                        bookStats.availability === "Available"
                          ? "bg-green-500 hover:bg-green-600"
                          : bookStats.availability === "Limited"
                            ? "border-yellow-500 text-yellow-700"
                            : ""
                      }
                    >
                      {bookStats.availability}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Book Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {book.description}
                </p>
                {book.summary && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h4 className="font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        {book.summary}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Borrow Records for this Book */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Borrow Records</CardTitle>
                  <Link href={`/admin/records?bookId=${bookId}`}>
                    <Button variant="outline" size="sm">
                      View All for This Book
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {borrowRecordsResult.success &&
                borrowRecordsResult.data &&
                borrowRecordsResult.data.records.length > 0 ? (
                  <>
                    <BorrowRecordsTable
                      records={borrowRecordsResult.data.records.slice(0, 5)}
                      compact={true}
                    />
                    {borrowRecordsResult.data.records.length > 5 && (
                      <div className="mt-4 text-center">
                        <Link href={`/admin/records?bookId=${bookId}`}>
                          <Button variant="outline" size="sm">
                            View {borrowRecordsResult.data.totalCount - 5} more
                            records
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <BookIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No borrow records found for this book
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This book hasn&apos;t been borrowed yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Book ID</span>
                  <span className="font-mono text-sm">{book.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Added</span>
                  <span>
                    {book.createdAt
                      ? new Date(book.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>
                    {book.updatedAt
                      ? new Date(book.updatedAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                {bookStats && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Popularity</span>
                    <Badge
                      variant={
                        bookStats.popularity === "High"
                          ? "default"
                          : bookStats.popularity === "Medium"
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        bookStats.popularity === "High"
                          ? "bg-purple-500 hover:bg-purple-600"
                          : bookStats.popularity === "Medium"
                            ? "bg-blue-500 hover:bg-blue-600"
                            : ""
                      }
                    >
                      <TrendingUpIcon className="w-3 h-3 mr-1" />
                      {bookStats.popularity}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const result = await getBookById(bookId);

  if (!result.success || !result.data) {
    return {
      title: "Book Not Found - Admin",
    };
  }

  const book = result.data;

  return {
    title: `${book.title} - Admin | SS.library`,
    description: `Admin view for ${book.title} by ${book.author}`,
  };
}
