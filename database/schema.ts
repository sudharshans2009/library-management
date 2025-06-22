import {
  varchar,
  uuid,
  integer,
  text,
  pgTable,
  date,
  pgEnum,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;

export type Session = InferSelectModel<typeof session>;
export type NewSession = InferInsertModel<typeof session>;

export type Account = InferSelectModel<typeof account>;
export type NewAccount = InferInsertModel<typeof account>;

export type Verification = InferSelectModel<typeof verification>;
export type NewVerification = InferInsertModel<typeof verification>;

export type Config = InferSelectModel<typeof config>;
export type NewConfig = InferInsertModel<typeof config>;

export type Book = InferSelectModel<typeof books>;
export type NewBook = InferInsertModel<typeof books>;

export type BorrowRecord = InferSelectModel<typeof borrowRecords>;
export type NewBorrowRecord = InferInsertModel<typeof borrowRecords>;

export type Request = InferSelectModel<typeof requests>;
export type NewRequest = InferInsertModel<typeof requests>;

export type StatusEnum = (typeof STATUS_ENUM.enumValues)[number];
export type RoleEnum = (typeof ROLE_ENUM.enumValues)[number];
export type BorrowStatusEnum = (typeof BORROW_STATUS_ENUM.enumValues)[number];
export type ClassEnum = (typeof CLASS_ENUM.enumValues)[number];
export type SectionEnum = (typeof SECTION_ENUM.enumValues)[number];
export type RequestStatusEnum = (typeof REQUEST_STATUS_ENUM.enumValues)[number];
export type RequestTypeEnum = (typeof REQUEST_TYPE_ENUM.enumValues)[number];

export const STATUS_ENUM = pgEnum("status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
]);

export const ROLE_ENUM = pgEnum("role", [
  "USER",
  "ADMIN",
  "MODERATOR",
  "GUEST",
]);

export const BORROW_STATUS_ENUM = pgEnum("borrow_status", [
  "PENDING",
  "BORROWED",
  "RETURNED",
]);

export const CLASS_ENUM = pgEnum("class", [
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "Teacher",
]);

export const SECTION_ENUM = pgEnum("section", ["A", "B", "C", "D", "N/A"]);

export const REQUEST_STATUS_ENUM = pgEnum("request_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RESCINDED",
]);

export const REQUEST_TYPE_ENUM = pgEnum("request_type", [
  "EXTEND_BORROW",
  "REPORT_LOST",
  "REPORT_DAMAGE",
  "EARLY_RETURN",
  "CHANGE_DUE_DATE",
  "OTHER",
]);

// Better Auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// Extended user configuration table for your application
export const config = pgTable("config", {
  id: text("id").notNull().primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  status: STATUS_ENUM("status").default("PENDING"),
  role: ROLE_ENUM("role").default("USER"),
  class: CLASS_ENUM("class").notNull(),
  section: SECTION_ENUM("section").notNull(),
  rollNo: varchar("roll_no", { length: 10 }).notNull(),
  lastActiveAt: date("last_active_at").defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const books = pgTable("books", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  genre: text("genre").notNull(),
  rating: integer("rating").notNull(),
  coverUrl: text("cover_url").notNull(),
  coverColor: varchar("cover_color", { length: 7 }).notNull(),
  description: text("description").notNull(),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(0),
  videoUrl: text("video_url").notNull(),
  summary: varchar("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const borrowRecords = pgTable("borrow_records", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  bookId: uuid("book_id")
    .references(() => books.id)
    .notNull(),
  borrowDate: timestamp("borrow_date", { withTimezone: true })
    .defaultNow()
    .notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: date("return_date"),
  status: BORROW_STATUS_ENUM("status").default("BORROWED").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const requests = pgTable("requests", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  borrowRecordId: uuid("borrow_record_id")
    .references(() => borrowRecords.id)
    .notNull(),
  type: REQUEST_TYPE_ENUM("type").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  requestedDate: date("requested_date"),
  status: REQUEST_STATUS_ENUM("status").default("PENDING").notNull(),
  adminResponse: text("admin_response"),
  adminId: text("admin_id").references(() => user.id),
  rescindedAt: timestamp("rescinded_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});
