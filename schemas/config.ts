import { z } from "zod";

export const UserConfigSchema = z.object({
  class: z.enum(["6", "7", "8", "9", "10", "11", "12", "Teacher"]),
  section: z.enum(["A", "B", "C", "D", "N/A"]),
  rollNo: z.string().min(4).max(6),
});

export type UserConfigSchemaType = z.infer<typeof UserConfigSchema>;
