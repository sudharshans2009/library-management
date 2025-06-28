import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookIcon,
  UsersIcon,
  ClockIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  BarChart3Icon,
  CalendarIcon,
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "@/actions/dashboard";
import DashboardChart from "./_components/dashboard-chart";
import RecentActivity from "./_components/recent-activity";
import QuickActions from "./_components/quick-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";

async function DashboardContent() {
  const stats = await getDashboardStats();

  if (!stats.success) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        Failed to load dashboard data
      </div>
    );
  }

  const data = stats.data!;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBooks}</div>
            <p className="text-xs text-muted-foreground">
              {data.availableBooks} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeUsers} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Borrows
            </CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeBorrows}</div>
            <p className="text-xs text-muted-foreground">
              {data.overdueBorrows} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              {data.pendingUsers} user approvals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rest of the dashboard content... */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts and Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Borrowing Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3Icon className="w-5 h-5 mr-2" />
                Borrowing Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardChart data={data.borrowingTrends} />
            </CardContent>
          </Card>

          {/* Popular Books */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <TrendingUpIcon className="w-5 h-5 mr-2" />
                  Popular Books
                </CardTitle>
                <Link href="/admin/books">
                  <Button variant="outline" size="sm">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.popularBooks.map((book, index) => (
                  <div key={book.id} className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {book.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {book.author}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {book.borrowCount} borrows
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Recent Activity */}
          <RecentActivity activities={data.recentActivity} />

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant="default" className="bg-green-500">
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">File Storage</span>
                <Badge variant="default" className="bg-green-500">
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <Badge variant="default" className="bg-green-500">
                  Healthy
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Today&apos;s Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">New Registrations</span>
                <span className="font-medium">{data.todayStats.newUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Books Borrowed</span>
                <span className="font-medium">
                  {data.todayStats.borrowsToday}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Books Returned</span>
                <span className="font-medium">
                  {data.todayStats.returnsToday}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending Approvals</span>
                <span className="font-medium text-orange-600">
                  {data.todayStats.pendingApprovals}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <div className="flex flex-col">
      {/* Desktop Sidebar Toggle */}
      <div className="hidden md:flex items-center gap-2 p-4 border-b">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your library management system
          </p>
        </div>
      </div>

      {/* Mobile Header is handled by AdminMobileNav */}
      <div className="md:hidden p-4 border-b">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your library system
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}
