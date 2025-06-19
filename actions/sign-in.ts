"use server";

import { SignInFormData, signInSchema } from "@/schemas/sign-in";
import { auth } from "@/lib/auth";

export async function signInAction(data: SignInFormData) {
  try {
    // Validate with Zod
    const validatedData = signInSchema.parse(data);

    // Sign in user
    const result = await auth.api.signInEmail({
      body: {
        email: validatedData.email,
        password: validatedData.password,
      },
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Sign in error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to sign in" 
    };
  }
}

export async function socialSignInAction(provider: "google" | "github") {
  try {
    const result = await auth.api.signInSocial({
      body: {
        provider,
        callbackURL: "/dashboard",
      },
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Social sign in error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : `Failed to sign in with ${provider}` 
    };
  }
}