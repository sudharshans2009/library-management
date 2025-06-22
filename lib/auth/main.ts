import { db } from "@/database/drizzle";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/database/schema";
import config from "../config";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Enable email verification
    async sendResetPassword(data, request) {
      // TODO: Implement email sending for password reset
      console.log("Reset password email would be sent to:", data.user);
      console.log("Reset URL:", data.url);
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
  emailVerification: {
    sendOnSignUp: true, // Send verification email on sign up
    autoSignInAfterVerification: true, // Auto sign in after verification
    async sendVerificationEmail(data, request) {
      // TODO: Implement email sending for verification
      console.log("Verification email would be sent to:", data.user);
      console.log("Verification URL:", data.url);
      console.log("Token:", data.token);
    },
  },
});
