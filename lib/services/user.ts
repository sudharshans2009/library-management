/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/database/drizzle";
import { user, config, User, Config } from "@/database/schema";
import { eq, count, and, or, ilike, desc, asc } from "drizzle-orm";

export interface UserWithConfig {
  user: User;
  config: Config;
}

export interface UserSearchOptions {
  search?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  role?: "USER" | "ADMIN" | "MODERATOR" | "GUEST";
  class?: string;
  section?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "email" | "createdAt" | "class" | "status" | "role";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedUsers {
  users: UserWithConfig[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Get users with pagination and filtering (replaces Payload's findMany)
export async function getUsersWithPagination(
  options: UserSearchOptions = {}
): Promise<PaginatedUsers> {
  const {
    search,
    status,
    role,
    class: userClass,
    section,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [];

  if (search) {
    whereConditions.push(
      or(
        ilike(user.name, `%${search}%`),
        ilike(user.email, `%${search}%`),
        ilike(config.fullName, `%${search}%`),
        ilike(config.rollNo, `%${search}%`)
      )
    );
  }

  if (status) {
    whereConditions.push(eq(config.status, status));
  }

  if (role) {
    whereConditions.push(eq(config.role, role));
  }

  if (userClass) {
    whereConditions.push(eq(config.class, userClass as any));
  }

  if (section) {
    whereConditions.push(eq(config.section, section as any));
  }

  // Get total count
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(user)
    .innerJoin(config, eq(user.id, config.userId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const totalCount = totalCountResult.count;
  const totalPages = Math.ceil(totalCount / limit);

  // Determine sort column and order
  let sortColumn;
  if (sortBy === "name" || sortBy === "email" || sortBy === "createdAt") {
    sortColumn = user[sortBy];
  } else {
    sortColumn = config[sortBy];
  }
  
  const orderFn = sortOrder === "desc" ? desc : asc;

  // Get users with pagination
  const usersData = await db
    .select({
      user: user,
      config: config,
    })
    .from(user)
    .innerJoin(config, eq(user.id, config.userId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset);

  return {
    users: usersData,
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// Get user by ID with config
export async function getUserById(userId: string): Promise<UserWithConfig | null> {
  const [result] = await db
    .select({
      user: user,
      config: config,
    })
    .from(user)
    .innerJoin(config, eq(user.id, config.userId))
    .where(eq(user.id, userId))
    .limit(1);

  return result || null;
}

// Get user by email with config
export async function getUserByEmail(email: string): Promise<UserWithConfig | null> {
  const [result] = await db
    .select({
      user: user,
      config: config,
    })
    .from(user)
    .innerJoin(config, eq(user.id, config.userId))
    .where(eq(user.email, email))
    .limit(1);

  return result || null;
}

// Update user status
export async function updateUserStatus(
  userId: string,
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
): Promise<Config | null> {
  const [updatedConfig] = await db
    .update(config)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(config.userId, userId))
    .returning();

  return updatedConfig || null;
}

// Update user role
export async function updateUserRole(
  userId: string,
  role: "USER" | "ADMIN" | "MODERATOR" | "GUEST"
): Promise<Config | null> {
  const [updatedConfig] = await db
    .update(config)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(config.userId, userId))
    .returning();

  return updatedConfig || null;
}

// Get users statistics
export async function getUserStats() {
  const [totalUsers] = await db
    .select({ count: count() })
    .from(config);

  const [pendingUsers] = await db
    .select({ count: count() })
    .from(config)
    .where(eq(config.status, "PENDING"));

  const [approvedUsers] = await db
    .select({ count: count() })
    .from(config)
    .where(eq(config.status, "APPROVED"));

  const [adminUsers] = await db
    .select({ count: count() })
    .from(config)
    .where(eq(config.role, "ADMIN"));

  return {
    total: totalUsers.count,
    pending: pendingUsers.count,
    approved: approvedUsers.count,
    admins: adminUsers.count,
  };
}

// Search users (for quick search functionality)
export async function searchUsers(
  query: string,
  limit: number = 10
): Promise<UserWithConfig[]> {
  const usersData = await db
    .select({
      user: user,
      config: config,
    })
    .from(user)
    .innerJoin(config, eq(user.id, config.userId))
    .where(
      or(
        ilike(user.name, `%${query}%`),
        ilike(user.email, `%${query}%`),
        ilike(config.fullName, `%${query}%`),
        ilike(config.rollNo, `%${query}%`)
      )
    )
    .orderBy(desc(user.createdAt))
    .limit(limit);

  return usersData;
}

// Get users by class
export async function getUsersByClass(
  className: string,
  options: Omit<UserSearchOptions, 'class'> = {}
): Promise<PaginatedUsers> {
  return getUsersWithPagination({
    ...options,
    class: className,
  });
}

// Get users by status
export async function getUsersByStatus(
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED",
  options: Omit<UserSearchOptions, 'status'> = {}
): Promise<PaginatedUsers> {
  return getUsersWithPagination({
    ...options,
    status,
  });
}

// Get pending users (for admin approval)
export async function getPendingUsers(
  options: Omit<UserSearchOptions, 'status'> = {}
): Promise<PaginatedUsers> {
  return getUsersWithPagination({
    ...options,
    status: "PENDING",
  });
}