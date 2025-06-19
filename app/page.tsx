import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Book } from "lucide-react";
import { Background } from "@/components/background";
// import BooksList from "@/components/book-list";

interface HomePageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  return (
    <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
      <Background />
      <div className="flex flex-col items-center max-w-7xl mx-auto">
        <section
          id="home"
          className="relative w-full h-full pt-24 flex flex-col items-center justify-center"
        >
          <div className="w-full flex flex-col items-center lg:items-start gap-5">
            <span className="inline-flex items-center gap-4 px-4 py-2 bg-primary/20 rounded-md">
              <Book className="w-4 h-4" />
              Find your next read
            </span>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-center lg:text-left max-w-4xl">
              Welcome to <span className="text-primary">SS.library</span>
            </h1>
            <p className="text-lg lg:text-xl text-center lg:text-left leading-relaxed text-muted-foreground max-w-3xl">
              A place to manage books that you have borrowed, read, or want to
              read. Keep track of your reading progress, discover new titles,
              and organize your personal library collection.
            </p>
            <div className="flex flex-col items-center justify-center md:flex-row mt-10 gap-5">
              <Link href="/dashboard">
                <Button size="2xl">Go to Dashboard</Button>
              </Link>
              <Link href="/books">
                <Button variant="secondary" size="2xl">
                  View Books
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-10 lg:justify-start">
              <div className="flex -space-x-3">
                {[...Array(5)].map((_, index) => (
                  <div
                    className="w-12 h-12 border border-primary rounded-full bg-primary/20"
                    key={index}
                  ></div>
                ))}
              </div>
              <div className="text-muted-foreground">
                <span className="font-semibold">500+ books</span> available
                <span className="hidden lg:inline"> in the library</span>
              </div>
            </div>
          </div>
        </section>

        {/* <BooksList
          searchParams={await searchParams}
          showTitle={true}
          showDescription={true}
          className="pt-24"
        /> */}
      </div>
    </main>
  );
}
