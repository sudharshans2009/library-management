import { z } from "zod";

export const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  passwordConfirmation: z.string().min(8, "Password confirmation must be at least 8 characters"),
  image: z.instanceof(File).optional().or(z.literal("")),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Passwords don't match",
  path: ["passwordConfirmation"],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;