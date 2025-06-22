/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense } from "react";
import { Background } from "@/components/background";
import BooksList from "@/components/book-list";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Filter,
  Search,
  TrendingUp,
  Star,
  Users,
  Clock
} from "lucide-react";

interface BooksPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    genre?: string;
    sort?: string;
  }>;
}

function BooksListSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Books Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="aspect-[3/4] w-full rounded-lg mb-4" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function BooksPageContent({ searchParams }: { searchParams: any }) {
  // Mock stats - replace with actual data fetching
  const stats = [
    {
      title: "Total Books",
      value: "2,847",
      icon: BookOpen,
      trend: "+12% from last month",
      color: "text-blue-600"
    },
    {
      title: "Available Now",
      value: "1,923",
      icon: Users,
      trend: "73% availability",
      color: "text-green-600"
    },
    {
      title: "Popular Today",
      value: "156",
      icon: TrendingUp,
      trend: "+8% from yesterday",
      color: "text-purple-600"
    },
    {
      title: "Avg Rating",
      value: "4.2",
      icon: Star,
      trend: "Based on 12k reviews",
      color: "text-yellow-600"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium">
          <BookOpen className="w-4 h-4" />
          Digital Library Collection
        </div>
        <h1 className="text-4xl lg:text-6xl font-bold leading-tight tracking-tight">
          Discover Your Next
          <span className="block text-primary">
            Great Read
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Explore our vast collection of books spanning every genre, from timeless classics to contemporary bestsellers.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  <p className={`text-xs ${stat.color} mt-1`}>
                    {stat.trend}
                  </p>
                </div>
                <div className={`${stat.color} opacity-20 group-hover:opacity-30 transition-opacity`}>
                  <stat.icon className="w-8 h-8" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Books List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Browse Collection
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Advanced filters available</span>
          </div>
        </div>

        <BooksList
          searchParams={searchParams}
          showTitle={false}
          showDescription={false}
          className=""
        />
      </div>
    </div>
  );
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <main className="relative w-full min-h-screen">
      <Background />
      <div className="max-w-7xl mx-auto px-5 pt-24 pb-16">
        <Suspense fallback={<BooksListSkeleton />}>
          <BooksPageContent searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </main>
  );
}

export const metadata = {
  title: "Books | SS.Library",
  description: "Discover and borrow from our extensive collection of books across all genres.",
  openGraph: {
    title: "Books Collection | SS.Library",
    description: "Explore thousands of books available for borrowing at SS.Library",
  },
};
