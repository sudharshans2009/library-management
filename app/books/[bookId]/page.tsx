import Image from "next/image";
import React from "react";
import { Book, Star } from "lucide-react";
import { Background } from "@/components/background";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import BooksList from "@/components/book-list";
import { AddBookButton } from "./_client";
import { getBookById } from "@/actions/books";
import { notFound } from "next/navigation";

interface BookPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
  params: Promise<{
    bookId: string;
  }>;
}

export default async function BookPage({
  params,
  searchParams,
}: BookPageProps) {
  const { bookId } = await params;
  const { page } = await searchParams;

  const result = await getBookById(bookId);

  if (!result.success || !result.data) {
    notFound();
  }

  const book = result.data;

  return (
    <>
      <Background />
      <main className="relative w-full h-full px-5 z-10">
        <div className="flex flex-col max-w-7xl pt-24 mx-auto min-h-screen py-8">
          {/* Book Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Book Cover */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative w-64 h-96 rounded-lg overflow-hidden shadow-xl">
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                    <Book className="w-24 h-24 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Information */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
                <p className="text-xl text-muted-foreground mb-4">
                  by {book.author}
                </p>
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="secondary">{book.genre}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">4.5</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {book.description ||
                      "A captivating story that will take you on an unforgettable journey."}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Availability</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Available copies</span>
                      <span className="font-medium">
                        {book.availableCopies} of {book.totalCopies}
                      </span>
                    </div>
                    <Progress
                      value={(book.availableCopies / book.totalCopies) * 100}
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <AddBookButton bookId={bookId} />
                </div>
              </div>
            </div>
          </div>

          {/* Related Books Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">More Books</h2>
            <BooksList
              searchParams={{
                page: page || "1",
                genre: book.genre,
                exclude: bookId,
              }}
            />
          </div>
        </div>
      </main>
    </>
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
      title: "Book Not Found",
    };
  }

  const book = result.data;

  return {
    title: `${book.title} by ${book.author}`,
    description: book.description || `Read ${book.title} by ${book.author}`,
  };
}
