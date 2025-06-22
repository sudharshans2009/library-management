import { createAuthClient } from "better-auth/react";
import config from "../config";

export const authClient = createAuthClient({
  baseURL: config.env.url,
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  changePassword,
  forgetPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
} = authClient;
