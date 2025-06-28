// schemas/request.ts
import { z } from "zod";

export const CreateRequestSchema = z.object({
  borrowRecordId: z.string().uuid("Invalid borrow record ID"),
  type: z.enum([
    "EXTEND_BORROW",
    "REPORT_LOST",
    "REPORT_DAMAGE",
    "EARLY_RETURN",
    "CHANGE_DUE_DATE",
    "OTHER",
  ]),
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
  description: z.string().max(1000, "Description too long").optional(),
  requestedDate: z.string().optional(), // For date change requests
});

export const RescindRequestSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
});

export const AdminResponseSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  status: z.enum(["APPROVED", "REJECTED"]),
  adminResponse: z
    .string()
    .min(1, "Admin response is required")
    .max(500, "Response too long"),
});

export const AdminResponseWithActionSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  status: z.enum(["APPROVED", "REJECTED"]),
  adminResponse: z
    .string()
    .min(1, "Admin response is required")
    .max(500, "Response too long"),
  // Optional data for specific actions
  actionData: z.object({
    newDueDate: z.string().optional(), // For CHANGE_DUE_DATE requests
  }).optional(),
});

export type CreateRequestSchemaType = z.infer<typeof CreateRequestSchema>;
export type RescindRequestSchemaType = z.infer<typeof RescindRequestSchema>;
export type AdminResponseSchemaType = z.infer<typeof AdminResponseSchema>;
export type AdminResponseWithActionSchemaType = z.infer<typeof AdminResponseWithActionSchema>;

// Predefined reasons for each request type
export const REQUEST_REASONS = {
  EXTEND_BORROW: [
    "Need more time to read",
    "Academic research purposes",
    "Unable to return due to illness",
    "Still referencing for assignments",
    "Book is helping with exam preparation",
  ],
  REPORT_LOST: [
    "Book misplaced at home",
    "Left book in public transport",
    "Book stolen from bag/locker",
    "Cannot locate after moving",
    "Other circumstances",
  ],
  REPORT_DAMAGE: [
    "Pages torn accidentally",
    "Water damage occurred",
    "Cover damaged",
    "Binding issues developed",
    "Other damage occurred",
  ],
  EARLY_RETURN: [
    "Finished reading early",
    "No longer needed",
    "Found alternative resource",
    "Course requirements changed",
    "Other reason",
  ],
  CHANGE_DUE_DATE: [
    "Going on vacation",
    "Medical appointment conflicts",
    "Exam period adjustment needed",
    "Personal emergency",
    "Other scheduling conflict",
  ],
  OTHER: [
    "Administrative error correction",
    "Special circumstances",
    "Academic accommodation needed",
    "Technical issue with record",
    "Other request",
  ],
} as const;
