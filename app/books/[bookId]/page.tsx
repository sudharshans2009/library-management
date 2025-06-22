import Image from "next/image";
import React from "react";
import { 
  Book, 
  Star, 
  Calendar, 
  Users, 
  BookOpen, 
  Clock,
  Share2,
  Heart,
  Download,
  Play
} from "lucide-react";
import { Background } from "@/components/background";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import BooksList from "@/components/book-list";
import { AddBookButton } from "./_client";
import { getBookById } from "@/actions/books";
import { notFound } from "next/navigation";
import Link from "next/link";

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

  const result = await getBookById(bookId);

  if (!result.success || !result.data) {
    notFound();
  }

  const book = result.data;
  const availabilityPercentage = (book.availableCopies / book.totalCopies) * 100;
  const isAvailable = book.availableCopies > 0;

  return (
    <main className="relative w-full min-h-screen">
      <Background />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Book Cover */}
            <div className="relative">
              <div className="sticky top-24">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative aspect-[3/4] w-full max-w-md mx-auto">
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={`${book.title} cover`}
                        fill
                        className="object-cover rounded-xl shadow-2xl"
                        priority
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center rounded-xl shadow-2xl"
                        style={{ backgroundColor: book.coverColor || '#6366f1' }}
                      >
                        <Book className="w-20 h-20 text-white opacity-80" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3 mt-6 justify-center">
                  <Button variant="outline" size="icon" className="h-12 w-12">
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-12 w-12">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-12 w-12">
                    <Download className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Book Details */}
            <div className="space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>Literature</span>
                  <span>•</span>
                  <span>{book.genre}</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                  {book.title}
                </h1>

                <div className="flex items-center gap-2">
                  <span className="text-xl text-muted-foreground">by</span>
                  <Link href={`/authors/${book.author.replace(/\s+/g, '-').toLowerCase()}`}>
                    <Badge variant="secondary" className="text-lg px-4 py-2 hover:bg-secondary/80 transition-colors cursor-pointer">
                      {book.author}
                    </Badge>
                  </Link>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(book.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : i < book.rating
                            ? "fill-yellow-400/50 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold">{book.rating}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{book.totalCopies * 47} reviews</span>
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-lg max-w-none">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {book.description}
                </p>
              </div>

              {/* Availability Card */}
              <Card className={`border-2 ${isAvailable ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Availability
                    </h3>
                    <Badge variant={isAvailable ? "default" : "destructive"} className="text-sm">
                      {isAvailable ? "Available" : "Not Available"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Available Copies</span>
                      <span className="font-semibold">
                        {book.availableCopies} of {book.totalCopies}
                      </span>
                    </div>
                    <Progress value={availabilityPercentage} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {isAvailable 
                        ? `${book.availableCopies} copies ready to borrow`
                        : "All copies are currently checked out"
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Button */}
              <div className="flex gap-4">
                <AddBookButton bookId={book.id} />
                <Button variant="outline" size="lg" className="flex-1">
                  <Clock className="w-5 h-5 mr-2" />
                  Reserve for Later
                </Button>
              </div>

              {/* Book Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{book.totalCopies}</div>
                    <div className="text-sm text-muted-foreground">Total Copies</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{book.rating}</div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{book.totalCopies - book.availableCopies}</div>
                    <div className="text-sm text-muted-foreground">Borrowed</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Book Details Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">About This Book</h2>
                  <div className="prose prose-lg max-w-none">
                    <p className="leading-relaxed text-muted-foreground">
                      {book.summary || book.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Video Section */}
              {book.videoUrl && (
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <Play className="w-6 h-6" />
                      Book Trailer
                    </h2>
                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                      <video
                        controls
                        className="w-full h-full object-cover"
                        poster={book.coverUrl}
                        preload="metadata"
                      >
                        <source src={book.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Book Details</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Author</span>
                      <span className="font-medium">{book.author}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Genre</span>
                      <Badge variant="outline">{book.genre}</Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rating</span>
                      <span className="font-medium">{book.rating}/5</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-medium">{book.availableCopies}/{book.totalCopies}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Similar Books</h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-12 h-16 bg-muted rounded-md flex-shrink-0"></div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">Similar Book {i}</p>
                          <p className="text-xs text-muted-foreground">Author Name</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">4.{i}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Related Books */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto">
          <BooksList
            searchParams={await searchParams}
            showTitle={true}
            showDescription={true}
            className=""
          />
        </div>
      </section>
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
      title: "Book Not Found | SS.Library",
      description: "The requested book could not be found.",
    };
  }

  const book = result.data;

  return {
    title: `${book.title} by ${book.author} | SS.Library`,
    description: book.description || `Discover ${book.title} by ${book.author}. Available for borrowing at SS.Library.`,
    openGraph: {
      title: `${book.title} by ${book.author}`,
      description: book.description,
      images: book.coverUrl ? [{ url: book.coverUrl }] : [],
    },
  };
}
