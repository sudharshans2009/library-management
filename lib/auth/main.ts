/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@/database/drizzle";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/database/schema";
import config from "../config";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/services/email";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Enable email verification
    async sendResetPassword(data, _request) {
      try {
        const result = await sendPasswordResetEmail(
          data.user.email,
          data.user.name || data.user.email,
          data.url,
        );

        if (!result.success) {
          console.error("Failed to send password reset email:", result.error);
          throw new Error("Failed to send password reset email");
        }

        console.log(
          "Password reset email sent successfully to:",
          data.user.email,
        );
      } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true, // Send verification email on sign up
    autoSignInAfterVerification: true, // Auto sign in after verification
    async sendVerificationEmail(data, _request) {
      try {
        const result = await sendVerificationEmail(
          data.user.email,
          data.user.name || data.user.email,
          data.url,
        );

        if (!result.success) {
          console.error("Failed to send verification email:", result.error);
          throw new Error("Failed to send verification email");
        }

        console.log(
          "Verification email sent successfully to:",
          data.user.email,
        );
      } catch (error) {
        console.error("Error sending verification email:", error);
        throw error;
      }
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  socialProviders: config.env.oauth,
  user: {
    additionalFields: {
      fullName: {
        type: "string",
        required: false,
      },
    },
  },
  rateLimit: {
    window: 60, // 1 minute
    max: 10, // 10 requests per minute
    storage: "database",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
