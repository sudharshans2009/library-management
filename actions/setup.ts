"use server";

import { UserConfigSchema, UserConfigSchemaType } from "@/schemas/config";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/database/drizzle";
import { config } from "@/database/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function setupUser(form: UserConfigSchemaType) {
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
    // Check if user configuration already exists using Drizzle
    const [existingConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, currentUser.id))
      .limit(1);

    if (existingConfig) {
      redirect("/");
    }

    // Create user configuration using Drizzle
    const [newUserConfig] = await db
      .insert(config)
      .values({
        id: uuidv4(),
        userId: currentUser.id,
        fullName: currentUser.name || `${userClass}${section} Student`,
        status: "PENDING",
        role: "USER",
        class: userClass,
        section: section,
        rollNo: rollNo,
        lastActiveAt: (new Date()).toISOString(),
      })
      .returning();

    return {
      success: true,
      user: newUserConfig,
      message: "Successfully created the user configuration",
    };
  } catch (err) {
    console.error("Error creating user configuration:", err);
    return {
      success: false,
      user: null,
      message: "Failed to create user configuration",
    };
  }
}

// Additional helper function to get user configuration
export async function getUserConfig() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return null;
    }

    const [userConfig] = await db
      .select()
      .from(config)
      .where(eq(config.userId, session.user.id))
      .limit(1);

    return userConfig || null;
  } catch (error) {
    console.error("Error fetching user config:", error);
    return null;
  }
}

// Helper function to update user configuration
export async function updateUserConfig(updates: Partial<typeof config.$inferInsert>) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Not authenticated");
    }

    const [updatedConfig] = await db
      .update(config)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(config.userId, session.user.id))
      .returning();

    return {
      success: true,
      user: updatedConfig,
      message: "Successfully updated user configuration",
    };
  } catch (err) {
    console.error("Error updating user configuration:", err);
    return {
      success: false,
      user: null,
      message: "Failed to update user configuration",
    };
  }
}