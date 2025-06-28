import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookIcon,
  ClockIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  EyeIcon,
  CalendarIcon,
  MessageSquareIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserBorrowRecords } from "@/actions/records";
import { getRequests } from "@/actions/requests";
import { Background } from "@/components/background";

async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Get user's borrow records
  const recordsResult = await getUserBorrowRecords(session.user.id, {
    limit: 5,
    sortOrder: "desc",
  });

  // Get user's requests
  const requestsResult = await getRequests({
    userId: session.user.id,
    limit: 5,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const records = recordsResult.success
    ? recordsResult.data?.records || []
    : [];
  const requests = requestsResult.success
    ? requestsResult.data?.requests || []
    : [];

  // Calculate stats
  const activeRecords = records.filter((r) => r.status === "BORROWED");
  const pendingRecords = records.filter((r) => r.status === "PENDING");
  const overdueRecords = activeRecords.filter((r) => {
    const dueDate = new Date(r.dueDate);
    return dueDate < new Date();
  });

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const recentRequests = requests.slice(0, 3);

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Borrows
            </CardTitle>
            <BookIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRecords.length}</div>
            <p className="text-xs text-muted-foreground">
              {overdueRecords.length} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRecords.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Requests</CardTitle>
            <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {requests.length} total requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Borrowed
            </CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
            <p className="text-xs text-muted-foreground">All time borrows</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Borrow Records */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <BookIcon className="w-5 h-5 mr-2" />
                  Recent Borrows
                </CardTitle>
                <Link href="/dashboard/borrows">
                  <Button variant="outline" size="sm">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {records.length > 0 ? (
                <div className="space-y-4">
                  {records.slice(0, 5).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center space-x-4 p-3 rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {record.book.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {record.book.author}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(record.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          record.status === "BORROWED"
                            ? "default"
                            : record.status === "PENDING"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {record.status}
                      </Badge>
                      <Link href={`/records/${record.id}`}>
                        <Button variant="ghost" size="sm">
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <BookIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No borrow records yet</p>
                  <Link href="/books">
                    <Button className="mt-2">
                      <BookIcon className="w-4 h-4 mr-2" />
                      Browse Books
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <MessageSquareIcon className="w-5 h-5 mr-2" />
                  Recent Requests
                </CardTitle>
                <Link href="/requests">
                  <Button variant="outline" size="sm">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentRequests.length > 0 ? (
                <div className="space-y-4">
                  {recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center space-x-4 p-3 rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {request.type
                            .replace("_", " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.book.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          request.status === "PENDING"
                            ? "outline"
                            : request.status === "APPROVED"
                              ? "default"
                              : request.status === "REJECTED"
                                ? "destructive"
                                : "secondary"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <MessageSquareIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No requests yet</p>
                  <Link href="/requests">
                    <Button className="mt-2">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create Request
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUpIcon className="w-5 h-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/books" className="block">
                <Button className="w-full justify-start">
                  <BookIcon className="w-4 h-4 mr-2" />
                  Browse Books
                </Button>
              </Link>
              <Link href="/requests" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquareIcon className="w-4 h-4 mr-2" />
                  Manage Requests
                </Button>
              </Link>
              <Link href="/dashboard/account" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Alerts */}
          {overdueRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <AlertCircleIcon className="w-5 h-5 mr-2" />
                  Overdue Books
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueRecords.slice(0, 3).map((record) => (
                    <div
                      key={record.id}
                      className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg"
                    >
                      <p className="text-sm font-medium">{record.book.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(record.dueDate).toLocaleDateString()}
                      </p>
                      <Link href={`/records/${record.id}`}>
                        <Button variant="outline" size="sm" className="mt-2">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Due Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Upcoming Due Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeRecords.length > 0 ? (
                <div className="space-y-3">
                  {activeRecords
                    .filter((record) => {
                      const dueDate = new Date(record.dueDate);
                      const today = new Date();
                      const daysUntilDue = Math.floor(
                        (dueDate.getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24),
                      );
                      return daysUntilDue >= 0 && daysUntilDue <= 7;
                    })
                    .slice(0, 3)
                    .map((record) => {
                      const dueDate = new Date(record.dueDate);
                      const today = new Date();
                      const daysUntilDue = Math.floor(
                        (dueDate.getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24),
                      );

                      return (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium truncate">
                              {record.book.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {daysUntilDue === 0
                                ? "Due today"
                                : `${daysUntilDue} days left`}
                            </p>
                          </div>
                          <Badge
                            variant={
                              daysUntilDue <= 3 ? "destructive" : "outline"
                            }
                          >
                            {daysUntilDue <= 3 ? "Soon" : "OK"}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming due dates
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
      <Background />
      <div className="relative flex flex-col max-w-7xl pt-24 mx-auto min-h-screen py-8 z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here&apos;s an overview of your library activity.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center max-w-7xl mx-auto px-5">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-primary/10 rounded-full animate-pulse mx-auto"></div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                </div>
                <p className="text-lg font-medium">Loading your dashboard...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we fetch your information
                </p>
              </div>
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </div>
    </main>
  );
}

export const metadata = {
  title: "Dashboard | SS.Library",
  description: "Your personal library dashboard",
};
