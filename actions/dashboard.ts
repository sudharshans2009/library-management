/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/database/drizzle";
import { config, books, borrowRecords, user } from "@/database/schema";
import { eq, and, or, count, sql, desc, gte } from "drizzle-orm";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";

export interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  totalUsers: number;
  activeUsers: number;
  activeBorrows: number;
  overdueBorrows: number;
  pendingRequests: number;
  pendingUsers: number;
  borrowingTrends: Array<{
    date: string;
    borrows: number;
    returns: number;
  }>;
  popularBooks: Array<{
    id: string;
    title: string;
    author: string;
    borrowCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: "borrow" | "return" | "user_signup" | "user_approval";
    message: string;
    timestamp: Date;
    user?: string;
    book?: string;
  }>;
  todayStats: {
    newUsers: number;
    borrowsToday: number;
    returnsToday: number;
    pendingApprovals: number;
  };
}

export async function getDashboardStats(): Promise<{
  success: boolean;
  data?: DashboardStats;
  message?: string;
}> {
  try {
    // Check authentication and permissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    const currentUser = session.user;

    // Check if user is admin
    const [userConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (!userConfig || userConfig.role !== "ADMIN") {
      return {
        success: false,
        message: "Only administrators can access dashboard stats",
      };
    }

    // Get total books and available books
    const [bookStats] = await db
      .select({
        totalBooks: count(),
        availableBooks: sql<number>`SUM(${books.availableCopies})`,
      })
      .from(books);

    // Get user statistics
    const [userStats] = await db
      .select({
        totalUsers: count(),
      })
      .from(config);

    // Get active users (users who have borrowed books in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeUserStats] = await db
      .select({
        activeUsers: sql<number>`COUNT(DISTINCT ${borrowRecords.userId})`,
      })
      .from(borrowRecords)
      .where(gte(borrowRecords.createdAt, thirtyDaysAgo));

    // Get borrow statistics
    const [borrowStats] = await db
      .select({
        activeBorrows: count(),
      })
      .from(borrowRecords)
      .where(eq(borrowRecords.status, "BORROWED"));

    // Get overdue borrows
    const today = new Date().toISOString().split('T')[0];
    const [overdueStats] = await db
      .select({
        overdueBorrows: count(),
      })
      .from(borrowRecords)
      .where(
        and(
          eq(borrowRecords.status, "BORROWED"),
          sql`${borrowRecords.dueDate} < ${today}`
        )
      );

    // Get pending requests
    const [pendingStats] = await db
      .select({
        pendingRequests: count(),
      })
      .from(borrowRecords)
      .where(eq(borrowRecords.status, "PENDING"));

    // Get pending users
    const [pendingUserStats] = await db
      .select({
        pendingUsers: count(),
      })
      .from(config)
      .where(eq(config.status, "PENDING"));

    // Get borrowing trends (last 7 days)
    const borrowingTrends = await db
      .select({
        date: sql<string>`DATE(${borrowRecords.createdAt})`,
        borrows: sql<number>`COUNT(CASE WHEN ${borrowRecords.status} IN ('BORROWED', 'PENDING') THEN 1 END)`,
        returns: sql<number>`COUNT(CASE WHEN ${borrowRecords.status} = 'RETURNED' THEN 1 END)`,
      })
      .from(borrowRecords)
      .where(gte(borrowRecords.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
      .groupBy(sql`DATE(${borrowRecords.createdAt})`)
      .orderBy(sql`DATE(${borrowRecords.createdAt})`);

    // Get popular books
    const popularBooks = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        borrowCount: sql<number>`COUNT(${borrowRecords.id})`,
      })
      .from(books)
      .leftJoin(borrowRecords, eq(books.id, borrowRecords.bookId))
      .groupBy(books.id, books.title, books.author)
      .orderBy(desc(sql`COUNT(${borrowRecords.id})`))
      .limit(5);

    // Get recent activity
    const recentBorrows = await db
      .select({
        id: borrowRecords.id,
        type: sql<string>`'borrow'`,
        message: sql<string>`CONCAT('New borrow request for "', ${books.title}, '"')`,
        timestamp: borrowRecords.createdAt,
        user: user.name,
        book: books.title,
      })
      .from(borrowRecords)
      .innerJoin(user, eq(borrowRecords.userId, user.id))
      .innerJoin(books, eq(borrowRecords.bookId, books.id))
      .where(eq(borrowRecords.status, "PENDING"))
      .orderBy(desc(borrowRecords.createdAt))
      .limit(5);

    const recentUsers = await db
      .select({
        id: config.id,
        type: sql<string>`'user_signup'`,
        message: sql<string>`CONCAT('New user registration: ', ${user.name})`,
        timestamp: config.createdAt,
        user: user.name,
        book: sql<string>`NULL`,
      })
      .from(config)
      .innerJoin(user, eq(config.userId, user.id))
      .where(eq(config.status, "PENDING"))
      .orderBy(desc(config.createdAt))
      .limit(3);

    const recentActivity = [...recentBorrows, ...recentUsers]
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, 8);

    // Get today's statistics
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayStats] = await db
      .select({
        newUsers: sql<number>`COUNT(CASE WHEN ${config.createdAt} >= ${todayStart} THEN 1 END)`,
        borrowsToday: sql<number>`COUNT(CASE WHEN ${borrowRecords.createdAt} >= ${todayStart} AND ${borrowRecords.status} IN ('BORROWED', 'PENDING') THEN 1 END)`,
        returnsToday: sql<number>`COUNT(CASE WHEN ${borrowRecords.returnDate} = ${today} THEN 1 END)`,
        pendingApprovals: sql<number>`COUNT(CASE WHEN ${borrowRecords.status} = 'PENDING' THEN 1 END)`,
      })
      .from(config)
      .leftJoin(borrowRecords, sql`TRUE`);

    return {
      success: true,
      data: {
        totalBooks: bookStats.totalBooks || 0,
        availableBooks: Number(bookStats.availableBooks) || 0,
        totalUsers: userStats.totalUsers || 0,
        activeUsers: Number(activeUserStats.activeUsers) || 0,
        activeBorrows: borrowStats.activeBorrows || 0,
        overdueBorrows: overdueStats.overdueBorrows || 0,
        pendingRequests: pendingStats.pendingRequests || 0,
        pendingUsers: pendingUserStats.pendingUsers || 0,
        borrowingTrends: borrowingTrends.map(trend => ({
          date: trend.date,
          borrows: Number(trend.borrows),
          returns: Number(trend.returns),
        })),
        popularBooks: popularBooks.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          borrowCount: Number(book.borrowCount),
        })),
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          type: activity.type as any,
          message: activity.message,
          timestamp: activity.timestamp!,
          user: activity.user || undefined,
          book: activity.book || undefined,
        })),
        todayStats: {
          newUsers: Number(todayStats.newUsers) || 0,
          borrowsToday: Number(todayStats.borrowsToday) || 0,
          returnsToday: Number(todayStats.returnsToday) || 0,
          pendingApprovals: Number(todayStats.pendingApprovals) || 0,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: false,
      message: "Failed to fetch dashboard statistics",
    };
  }
}