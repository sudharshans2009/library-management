import { Background } from "@/components/background";
import RecordCard from "@/components/record-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/database/drizzle";
import { config, borrowRecords, books } from "@/database/schema";
import { eq, desc } from "drizzle-orm";

type BadgeType =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | null
  | undefined;

export default async function DashboardPage() {
  // Get current session using Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const currentUser = session.user;

  // Get user configuration using Drizzle
  const [userConfig] = await db
    .select()
    .from(config)
    .where(eq(config.userId, currentUser.id))
    .limit(1);

  if (!userConfig) {
    redirect("/setup");
  }

  // Get user's borrow records with book details using Drizzle
  const userBorrowRecords = await db
    .select({
      record: borrowRecords,
      book: books,
    })
    .from(borrowRecords)
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .where(eq(borrowRecords.userId, currentUser.id))
    .orderBy(desc(borrowRecords.createdAt));

  const status = (status: typeof userConfig.status) => {
    if (status === "APPROVED") {
      return {
        text: "Active",
        theme: "default",
      };
    } else if (status === "SUSPENDED") {
      return {
        text: "Suspended",
        theme: "destructive",
      };
    } else if (status === "PENDING") {
      return {
        text: "Pending",
        theme: "secondary",
      };
    } else if (status === "REJECTED") {
      return {
        text: "Rejected",
        theme: "destructive",
      };
    } else {
      return {
        text: "Unknown",
        theme: "outline",
      };
    }
  };

  return (
    <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
      <Background />
      <div className="flex flex-col items-center max-w-7xl mx-auto">
        <section
          id="setup"
          className="relative w-full h-full pt-24 flex gap-8 flex-col lg:flex-row items-start justify-center"
        >
          <div className="w-full sticky top-28 flex-1 flex flex-col items-center gap-5">
            {userConfig.status === "SUSPENDED" && (
              <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">
                      Account Suspended
                    </h3>
                    <p className="text-red-700 mt-1">
                      Your account has been suspended. You cannot request new
                      books or update your profile during this time. Please
                      contact an administrator for assistance.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {userConfig.status === "PENDING" && (
              <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">
                      Account Pending Approval
                    </h3>
                    <p className="text-yellow-700 mt-1">
                      Your account is pending approval. You cannot request books
                      until an administrator approves your account.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Card className="w-full">
              <CardHeader className="text-center">
                <CardTitle>{userConfig.fullName}</CardTitle>
                <CardDescription>
                  <Badge variant="secondary">
                    {userConfig.role === "USER"
                      ? "Student"
                      : userConfig.role === "ADMIN"
                      ? "Administrator"
                      : userConfig.role === "MODERATOR"
                      ? "Moderator"
                      : "Guest"}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center gap-8">
                <Image
                  className="rounded-full"
                  src={currentUser.image || "/images/default-avatar.png"}
                  width={128}
                  height={128}
                  alt={currentUser.name || "User avatar"}
                />
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Status
                    </span>
                    <Badge
                      variant={status(userConfig.status).theme as BadgeType}
                    >
                      {status(userConfig.status).text}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-muted-foreground">
                      Class
                    </span>
                    <Badge variant="outline">
                      {userConfig.class}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-muted-foreground">
                      Section
                    </span>
                    <Badge variant="outline">
                      {userConfig.section}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-muted-foreground">
                      Roll No
                    </span>
                    <Badge variant="outline">
                      {userConfig.rollNo || "N/A"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="w-full flex gap-4">
              {userConfig.role === "USER" && userConfig.status === "APPROVED" && (
                <Link href="/books" className="w-full">
                  <Button size="xl" className="w-full">
                    Request a Book
                  </Button>
                </Link>
              )}
              {(userConfig.role === "ADMIN" || userConfig.role === "MODERATOR") && (
                <Link href="/manage" className="w-full">
                  <Button size="xl" className="w-full">
                    Manage Library
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/settings" className="w-full">
                <Button size="xl" variant="secondary" className="w-full">
                  Update Profile
                </Button>
              </Link>
            </div>
          </div>
          <div className="w-full flex-2 grid gap-10 lg:grid-cols-2">
            {userBorrowRecords.length > 0 ? (
              userBorrowRecords.map(({ record, book }) => (
                <RecordCard
                  key={record.id}
                  record={{
                    ...record,
                    book: book,
                  }}
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <p className="text-muted-foreground">No borrow records found.</p>
                {userConfig.status === "APPROVED" && userConfig.role === "USER" && (
                  <Link href="/books" className="mt-4 inline-block">
                    <Button>Browse Books</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
