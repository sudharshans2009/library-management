/* eslint-disable @typescript-eslint/no-explicit-any */
// filepath: c:\Users\bsoun\Documents\Codebase\library-management-v2\actions\admin-users.ts
"use server";

import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getUsersWithPagination,
  updateUserStatus,
  updateUserRole,
  getUserStats,
  UserSearchOptions,
} from "@/lib/services/user";
import { db } from "@/database/drizzle";
import { config } from "@/database/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Check if user is admin
async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Get user config to check role
  const [userConfig] = await db
    .select()
    .from(config)
    .where(eq(config.userId, session.user.id))
    .limit(1);

  if (!userConfig || userConfig.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return { session, userConfig };
}

export async function getUsers(options: UserSearchOptions = {}) {
  await requireAdmin();

  try {
    const result = await getUsersWithPagination(options);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      data: null,
      message: "Failed to fetch users",
    };
  }
}

export async function approveUser(userId: string) {
  await requireAdmin();

  try {
    const updatedConfig = await updateUserStatus(userId, "APPROVED");

    if (!updatedConfig) {
      return {
        success: false,
        message: "User not found",
      };
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User approved successfully",
      user: updatedConfig,
    };
  } catch (error) {
    console.error("Error approving user:", error);
    return {
      success: false,
      message: "Failed to approve user",
    };
  }
}

export async function rejectUser(userId: string) {
  await requireAdmin();

  try {
    const updatedConfig = await updateUserStatus(userId, "REJECTED");

    if (!updatedConfig) {
      return {
        success: false,
        message: "User not found",
      };
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User rejected successfully",
      user: updatedConfig,
    };
  } catch (error) {
    console.error("Error rejecting user:", error);
    return {
      success: false,
      message: "Failed to reject user",
    };
  }
}

export async function suspendUser(userId: string) {
  await requireAdmin();

  try {
    const updatedConfig = await updateUserStatus(userId, "SUSPENDED");

    if (!updatedConfig) {
      return {
        success: false,
        message: "User not found",
      };
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User suspended successfully",
      user: updatedConfig,
    };
  } catch (error) {
    console.error("Error suspending user:", error);
    return {
      success: false,
      message: "Failed to suspend user",
    };
  }
}

export async function changeUserRole(
  userId: string,
  role: "USER" | "ADMIN" | "MODERATOR" | "GUEST",
) {
  await requireAdmin();

  try {
    const updatedConfig = await updateUserRole(userId, role);

    if (!updatedConfig) {
      return {
        success: false,
        message: "User not found",
      };
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User role updated successfully",
      user: updatedConfig,
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      message: "Failed to update user role",
    };
  }
}

export async function getDashboardStats() {
  await requireAdmin();

  try {
    const stats = await getUserStats();

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: false,
      data: null,
      message: "Failed to fetch dashboard stats",
    };
  }
}

export async function exportUsersToCSV(filters: UserSearchOptions = {}) {
  await requireAdmin();

  try {
    // Get all users without pagination for export
    const result = await getUsersWithPagination({
      ...filters,
      limit: 10000, // Large limit to get all users
    });

    const csvData = result.users.map(
      ({ user, config }: { user: any; config: any }) => ({
        name: user.name,
        email: user.email,
        fullName: config.fullName,
        class: config.class,
        section: config.section,
        rollNo: config.rollNo,
        role: config.role,
        status: config.status,
        createdAt: user.createdAt.toISOString(),
        lastActiveAt: config.lastActiveAt,
      }),
    );

    return {
      success: true,
      data: csvData,
    };
  } catch (error) {
    console.error("Error exporting users:", error);
    return {
      success: false,
      data: null,
      message: "Failed to export users",
    };
  }
}
