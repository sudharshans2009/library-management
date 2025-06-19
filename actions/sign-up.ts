"use server";

import { SignUpFormData, signUpSchema } from "@/schemas/sign-up";
import { auth } from "@/lib/auth";
import { saveImageLocally, convertImageToBase64 } from "@/lib/blob";

export async function signUpAction(data: SignUpFormData) {
  try {
    // Validate with Zod
    const validatedData = signUpSchema.parse(data);

    let imageUrl = "";

    // Handle image upload if provided
    if (validatedData.image && validatedData.image instanceof File && validatedData.image.size > 0) {
      try {
        // Try to save locally first
        imageUrl = await saveImageLocally(validatedData.image);
      } catch (error) {
        console.error('Failed to save image locally:', error);
        // Fallback to base64
        try {
          imageUrl = await convertImageToBase64(validatedData.image);
          console.warn('Image saved as base64 fallback');
        } catch (base64Error) {
          console.error('Failed to convert to base64:', base64Error);
          // Continue without image
          console.warn('Continuing without profile image');
        }
      }
    }

    // Create user account
    const result = await auth.api.signUpEmail({
      body: {
        email: validatedData.email,
        password: validatedData.password,
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        image: imageUrl,
      },
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Sign up error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create account" 
    };
  }
}