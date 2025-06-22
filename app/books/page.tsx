import React from "react";
import { Background } from "@/components/background";
import BooksList from "@/components/book-list";

interface BooksPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  return (
    <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
      <Background />
      <div className="flex flex-col items-center max-w-7xl mx-auto">
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
