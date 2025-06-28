import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookIcon,
  UsersIcon,
  ClockIcon,
  ArrowRightIcon,
  FileText,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Background } from "@/components/background";
import BooksList from "@/components/book-list";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import { db } from "@/database/drizzle";
import { config, books, borrowRecords, requests } from "@/database/schema";
import { eq, count, desc } from "drizzle-orm";

interface HomePageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let userConfig = null;
  let userRequests = null;

  if (session) {
    // Get user config
    const [dbUserConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, session.user.id))
      .limit(1);

    userConfig = dbUserConfig;

    // Get user's recent requests if logged in
    if (userConfig) {
      userRequests = await db
        .select({
          id: requests.id,
          type: requests.type,
          status: requests.status,
          createdAt: requests.createdAt,
        })
        .from(requests)
        .where(eq(requests.userId, session.user.id))
        .orderBy(desc(requests.createdAt))
        .limit(3);
    }
  }

  // Get library statistics
  const [totalBooksResult] = await db.select({ count: count() }).from(books);
  const [totalBorrowsResult] = await db
    .select({ count: count() })
    .from(borrowRecords);
  const [totalRequestsResult] = await db
    .select({ count: count() })
    .from(requests);

  const totalBooks = totalBooksResult?.count || 0;
  const totalBorrows = totalBorrowsResult?.count || 0;
  const totalRequests = totalRequestsResult?.count || 0;

  const features = [
    {
      icon: BookIcon,
      title: "Digital Catalog",
      description:
        "Browse our extensive collection of books with advanced search and filtering options.",
    },
    {
      icon: ClockIcon,
      title: "Easy Borrowing",
      description:
        "Quick and simple book borrowing process with automated due date tracking.",
    },
    {
      icon: FileText,
      title: "Request Management",
      description:
        "Submit requests for loan extensions, report issues, and manage your library needs.",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description:
        "Your data is protected with modern security measures and reliable infrastructure.",
    },
  ];

  return (
    <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
      <Background />
      <div className="flex flex-col items-center max-w-7xl mx-auto">
        {/* Hero Section */}
        <section
          id="home"
          className="relative w-full h-full pt-24 gap-10 flex flex-col lg:flex-row items-center lg:items-start justify-center"
        >
          <div className="w-full flex flex-col items-center lg:items-start gap-5">
            <span className="inline-flex items-center gap-4 px-4 py-2 bg-primary/20 rounded-md">
              <BookIcon className="w-4 h-4" />
              Modern Library Management
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-center lg:text-left max-w-4xl">
              Welcome to <span className="text-primary">SS.Library</span>
            </h1>
            <p className="text-base lg:text-lg text-center lg:text-left leading-relaxed text-muted-foreground max-w-3xl">
              Your comprehensive digital library system. Browse books, manage
              borrowings, submit requests, and explore our vast collection with
              ease.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              {session ? (
                <>
                  <Link href="/dashboard">
                    <Button size="xl" className="w-full sm:w-auto">
                      <UsersIcon className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link href="/books">
                    <Button
                      size="xl"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <BookIcon className="w-4 h-4 mr-2" />
                      Browse Books
                    </Button>
                  </Link>
                  {userConfig?.status === "APPROVED" && (
                    <Link href="/requests">
                      <Button
                        size="xl"
                        variant="secondary"
                        className="w-full sm:w-auto"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        My Requests
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href="/sign-up">
                    <Button size="xl" className="w-full sm:w-auto">
                      Get Started
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/books">
                    <Button
                      size="xl"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <BookIcon className="w-4 h-4 mr-2" />
                      Browse Books
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* User Status & Recent Requests */}
            {session && userConfig && (
              <div className="w-full max-w-2xl mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Account Status */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Account Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            userConfig.status === "APPROVED"
                              ? "bg-green-500"
                              : userConfig.status === "PENDING"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                        <span className="text-sm font-medium">
                          {userConfig.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {userConfig.status === "APPROVED"
                          ? "Ready to borrow books"
                          : userConfig.status === "PENDING"
                            ? "Awaiting approval"
                            : "Contact administrator"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Recent Requests */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Recent Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userRequests && userRequests.length > 0 ? (
                        <div className="space-y-2">
                          {userRequests.slice(0, 2).map((request) => (
                            <div
                              key={request.id}
                              className="flex items-center justify-between"
                            >
                              <span className="text-xs text-muted-foreground">
                                {request.type.replace("_", " ").toLowerCase()}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  request.status === "APPROVED"
                                    ? "bg-green-100 text-green-800"
                                    : request.status === "PENDING"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {request.status}
                              </span>
                            </div>
                          ))}
                          <Link
                            href="/requests"
                            className="text-xs text-primary hover:underline"
                          >
                            View all requests →
                          </Link>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No requests yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Statistics Section */}
        <section id="stats" className="relative w-full pt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Books Available
                </CardTitle>
                <BookIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBooks}</div>
                <p className="text-xs text-muted-foreground">Digital catalog</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Borrows
                </CardTitle>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBorrows}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Requests Processed
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRequests}</div>
                <p className="text-xs text-muted-foreground">User requests</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative w-full pt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for efficient library management in one
              comprehensive platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <feature.icon className="w-8 h-8 mx-auto text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Books Section */}
        <BooksList
          searchParams={await searchParams}
          showTitle={true}
          showDescription={true}
          className="pt-24"
        />

        {/* CTA Section */}
        {!session && (
          <section id="cta" className="relative w-full pt-24 pb-12">
            <Card className="text-center p-8">
              <CardContent className="space-y-4">
                <h3 className="text-2xl font-bold">Ready to Get Started?</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Join our library system today and start exploring our vast
                  collection of books.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/sign-up">
                    <Button size="lg">
                      Create Account
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button size="lg" variant="outline">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}
