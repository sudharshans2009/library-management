"use server";

import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/database/drizzle";
import { user, account, config } from "@/database/schema";
import { eq } from "drizzle-orm";
import { 
  ProfileUpdateSchema, 
  PasswordUpdateSchema,
  ProfileUpdateSchemaType,
  PasswordUpdateSchemaType 
} from "@/schemas/account";
import { saveProfileImage } from "@/lib/blob";
import { revalidatePath } from "next/cache";
import configLib from "@/lib/config";

export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function updateProfile(data: ProfileUpdateSchemaType) {
  const parsedData = ProfileUpdateSchema.safeParse(data);
  
  if (!parsedData.success) {
    return {
      success: false,
      message: "Invalid form data",
      errors: parsedData.error.flatten().fieldErrors,
    };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/sign-in");
    }

    const { name, fullName, email } = parsedData.data;

    // Check if email is already taken by another user
    if (email !== session.user.email) {
      const [existingUser] = await db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (existingUser && existingUser.id !== session.user.id) {
        return {
          success: false,
          message: "Email is already taken by another user",
        };
      }
    }

    // Start a transaction to update both user and config tables
    await db.transaction(async (tx) => {
      // Update user profile
      await tx
        .update(user)
        .set({
          name,
          email,
          updatedAt: new Date(),
          // If email changed, mark as unverified
          emailVerified: email !== session.user.email ? false : undefined,
        })
        .where(eq(user.id, session.user.id));

      // Update config table with fullName
      await tx
        .update(config)
        .set({
          fullName,
          updatedAt: new Date(),
        })
        .where(eq(config.userId, session.user.id));
    });

    // If email was changed, send verification email
    if (email !== session.user.email) {
      try {
        await auth.api.sendVerificationEmail({
          body: { email },
          headers: await headers(),
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
        // Don't fail the profile update if email sending fails
      }
    }

    revalidatePath("/dashboard/account");
    
    return {
      success: true,
      message: email !== session.user.email 
        ? "Profile updated successfully. Please check your email to verify your new email address."
        : "Profile updated successfully",
      emailChanged: email !== session.user.email,
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      message: "Failed to update profile",
    };
  }
}

export async function updatePassword(data: PasswordUpdateSchemaType) {
  const parsedData = PasswordUpdateSchema.safeParse(data);
  
  if (!parsedData.success) {
    return {
      success: false,
      message: "Invalid form data",
      errors: parsedData.error.flatten().fieldErrors,
    };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/sign-in");
    }

    const { currentPassword, newPassword } = parsedData.data;

    // Change password using Better Auth
    const result = await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
      },
      headers: await headers(),
    });

    if (!result) {
      return {
        success: false,
        message: "Current password is incorrect",
      };
    }

    revalidatePath("/dashboard/account");
    
    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error) {
    console.error("Error updating password:", error);
    
    // Handle specific Better Auth errors
    if (error instanceof Error) {
      if (error.message.includes("Invalid password")) {
        return {
          success: false,
          message: "Current password is incorrect",
        };
      }
    }
    
    return {
      success: false,
      message: "Failed to update password",
    };
  }
}

export async function updateProfileImage(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/sign-in");
    }

    const file = formData.get("image") as File;
    
    if (!file || file.size === 0) {
      return {
        success: false,
        message: "No image file provided",
      };
    }

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        message: "File size must be less than 5MB",
      };
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return {
        success: false,
        message: "Only JPEG, PNG, and WebP files are allowed",
      };
    }

    // Save image
    const imageUrl = await saveProfileImage(file);

    // Update user image
    const [updatedUser] = await db
      .update(user)
      .set({
        image: imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))
      .returning();

    revalidatePath("/dashboard/account");
    
    return {
      success: true,
      message: "Profile image updated successfully",
      imageUrl,
      user: updatedUser,
    };
  } catch (error) {
    console.error("Error updating profile image:", error);
    return {
      success: false,
      message: "Failed to update profile image",
    };
  }
}

export async function getUserAccounts() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/sign-in");
    }

    // Get linked social accounts
    const accounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, session.user.id));

    return {
      success: true,
      accounts,
    };
  } catch (error) {
    console.error("Error getting user accounts:", error);
    return {
      success: false,
      accounts: [],
    };
  }
}

export async function unlinkAccount(accountId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/sign-in");
    }

    // Delete the account
    await db
      .delete(account)
      .where(eq(account.id, accountId));

    revalidatePath("/dashboard/account");
    
    return {
      success: true,
      message: "Account unlinked successfully",
    };
  } catch (error) {
    console.error("Error unlinking account:", error);
    return {
      success: false,
      message: "Failed to unlink account",
    };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    await auth.api.forgetPassword({
      body: { email },
      headers: await headers(),
    });

    return {
      success: true,
      message: "Password reset email sent",
    };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return {
      success: false,
      message: "Failed to send password reset email",
    };
  }
}

export async function resendVerificationEmail() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/sign-in");
    }

    // Check if user is already verified
    if (session.user.emailVerified) {
      return {
        success: false,
        message: "Email is already verified",
      };
    }

    // Send verification email using Better Auth
    await auth.api.sendVerificationEmail({
      body: { 
        email: session.user.email,
        callbackURL: `${configLib.env.url}/verify-email`,
      },
      headers: await headers(),
    });

    return {
      success: true,
      message: "Verification email sent successfully. Please check your inbox.",
    };
  } catch (error) {
    console.error("Error sending verification email:", error);
    
    // Handle rate limiting errors
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return {
          success: false,
          message: "Too many requests. Please wait a moment before trying again.",
        };
      }
    }
    
    return {
      success: false,
      message: "Failed to send verification email. Please try again later.",
    };
  }
}

export async function verifyEmail(token: string) {
  try {
    await auth.api.verifyEmail({
      query: { token },
      headers: await headers(),
    });

    revalidatePath("/dashboard/account");
    
    return {
      success: true,
      message: "Email verified successfully",
    };
  } catch (error) {
    console.error("Error verifying email:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("invalid") || error.message.includes("expired")) {
        return {
          success: false,
          message: "Invalid or expired verification token",
        };
      }
    }
    
    return {
      success: false,
      message: "Failed to verify email",
    };
  }
}

// New function to get user with config data
export async function getUserWithConfig() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return null;
    }

    // Get user with config data
    const [userWithConfig] = await db
      .select({
        user: user,
        config: config,
      })
      .from(user)
      .leftJoin(config, eq(user.id, config.userId))
      .where(eq(user.id, session.user.id))
      .limit(1);

    return userWithConfig;
  } catch (error) {
    console.error("Error getting user with config:", error);
    return null;
  }
}