import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(255),
  email: z.string().email("Invalid email address"),
});

export const PasswordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ProfileImageSchema = z.object({
  image: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Only JPEG, PNG, and WebP files are allowed"
    ),
});

export type ProfileUpdateSchemaType = z.infer<typeof ProfileUpdateSchema>;
export type PasswordUpdateSchemaType = z.infer<typeof PasswordUpdateSchema>;
export type ProfileImageSchemaType = z.infer<typeof ProfileImageSchema>;
