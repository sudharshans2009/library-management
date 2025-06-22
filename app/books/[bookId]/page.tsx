import Image from "next/image";
import React from "react";
import { Book, Star } from "lucide-react";
import { Background } from "@/components/background";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import BooksList from "@/components/book-list";
import { AddBookButton } from "./_client";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

interface BookPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
  params: Promise<{
    bookId: string;
  }>;
}

async function getBookById(bookId: string) {
  const [book] = await db
    .select()
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);

  return book;
}

export default async function BookPage({
  params,
  searchParams,
}: BookPageProps) {
  const { bookId } = await params;
  const book = await getBookById(bookId);

  if (!book) {
    notFound();
  }

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
              Find your next read
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-center lg:text-left max-w-4xl">
              {book.title}
            </h1>
            <p className="text-base lg:text-lg text-center lg:text-left leading-relaxed text-muted-foreground max-w-3xl">
              {book.description}
            </p>
            <Badge
              variant="secondary"
              className="text-lg lg:text-xl text-center lg:text-left leading-relaxed max-w-3xl"
            >
              {book.author}
            </Badge>
            <div className="flex flex-col items-center justify-center md:flex-row mt-10 gap-5">
              <AddBookButton bookId={book.id} />
            </div>
          </div>
          <div>
            <Image
              src={book.coverUrl || "/placeholder.png"}
              className="object-cover rounded-lg aspect-[11/16]"
              alt="Book Cover"
              width={490}
              height={600}
            />
          </div>
        </section>

        <section
          id="about"
          className="relative w-full h-full pt-24 flex flex-col gap-8 items-center justify-center"
        >
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight text-center max-w-4xl">
            About This Book
          </h1>
          <div className="w-full max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Summary</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {book.summary}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Author</h3>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {book.author}
                </Badge>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Genre</h3>
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {book.genre}
                </Badge>
              </div>
              {book.videoUrl && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Book Trailer</h3>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <video
                      controls
                      className="w-full h-full object-cover"
                      poster={book.coverUrl || undefined}
                    >
                      <source src={book.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold mb-2">Rating</h3>
                <div className="flex items-center gap-2">
                  <div className="flex">
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
                  </div>
                  <span className="text-lg font-medium">{book.rating}/5</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Availability</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Available Copies</span>
                    <span className="font-medium">
                      {book.availableCopies}/{book.totalCopies}
                    </span>
                  </div>
                  <Progress
                    value={(book.availableCopies / book.totalCopies) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {book.availableCopies > 0
                      ? "Available for borrowing"
                      : "Currently unavailable"}
                  </p>
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

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const book = await getBookById(bookId);

  if (!book) {
    return {
      title: "Book Not Found",
      description: "The requested book could not be found.",
    };
  }

  return {
    title: `${book.title} by ${book.author}`,
    description: book.description,
    openGraph: {
      title: `${book.title} by ${book.author}`,
      description: book.description,
      images: [
        {
          url: book.coverUrl,
          width: 490,
          height: 600,
          alt: `Cover of ${book.title}`,
        },
      ],
    },
  };
}
