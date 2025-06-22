"use server";

import { UserConfigSchema, UserConfigSchemaType } from "@/schemas/config";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import { db } from "@/database/drizzle";
import { config } from "@/database/schema";
import { eq, ilike, and, or, count } from "drizzle-orm";

export async function updateUserSettings(form: UserConfigSchemaType) {
  const parsedBody = UserConfigSchema.safeParse(form);

  if (!parsedBody.success) {
    throw new Error("Invalid form data");
  }

  // Get current session using Better Auth
  let session;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (authError) {
    console.error("Authentication error:", authError);
    throw new Error("Authentication failed");
  }

  if (!session) {
    redirect("/sign-in");
  }

  const currentUser = session.user;
  const { class: userClass, section, rollNo } = parsedBody.data;

  try {
    // Find existing user configuration using Drizzle
    const [existingConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (!existingConfig) {
      redirect("/setup");
    }

    // Check if user is a teacher
    const isTeacher = existingConfig.class === "Teacher";

    // Update user configuration using Drizzle
    const [updatedUser] = await db
      .update(config)
      .set({
        class: userClass,
        section: section,
        rollNo: rollNo,
        // Teachers get APPROVED status immediately, students get PENDING
        status: isTeacher ? "APPROVED" : "PENDING",
        updatedAt: new Date(),
      })
      .where(eq(config.userId, currentUser.id))
      .returning();

    return {
      success: true,
      user: updatedUser,
      message: isTeacher
        ? "Settings updated successfully!"
        : "Settings updated successfully. Changes are pending review.",
      isTeacher,
    };
  } catch (err) {
    console.error("Error updating user settings:", err);
    return {
      success: false,
      user: null,
      message: "Failed to update settings",
      isTeacher: false,
    };
  }
}

export async function getUserSettings() {
  let session;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (authError) {
    console.error("Authentication error:", authError);
    redirect("/sign-in");
  }

  if (!session) {
    redirect("/sign-in");
  }

  const currentUser = session.user;

  try {
    // Get user configuration using Drizzle
    const [userConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (!userConfig) {
      redirect("/setup");
    }

    return {
      success: true,
      user: userConfig,
    };
  } catch (err) {
    console.error("Error fetching user settings:", err);
    return {
      success: false,
      user: null,
    };
  }
}

// Get users with pagination (replaces Payload's findMany)
export async function getUsersWithPagination(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  role?: "USER" | "ADMIN" | "MODERATOR" | "GUEST";
  class?: string;
  section?: string;
} = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    role,
    class: userClass,
    section,
  } = options;

  const offset = (page - 1) * limit;

  try {
    // Build where conditions
    const whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      whereConditions.push(eq(config.class, userClass as any));
    }

    if (section) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      whereConditions.push(eq(config.section, section as any));
    }

    // Get total count
    const [totalCountResult] = await db
      .select({ count: count() })
      .from(config)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const totalCount = totalCountResult.count;
    const totalPages = Math.ceil(totalCount / limit);

    // Get users with pagination
    const usersData = await db
      .select()
      .from(config)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(config.createdAt)
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        users: usersData,
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (err) {
    console.error("Error fetching users:", err);
    return {
      success: false,
      data: null,
    };
  }
}
