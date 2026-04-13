import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  pinHash: text("pin_hash").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  fileUrl: text("file_url").notNull(),
  uploaderHash: text("uploader_hash")
    .notNull()
    .references(() => users.pinHash, { onDelete: "cascade" }),
  pages: integer("pages").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userBooks = pgTable("user_books", {
  id: text("id").primaryKey(),
  userHash: text("user_hash")
    .notNull()
    .references(() => users.pinHash, { onDelete: "cascade" }),
  bookId: text("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  progressPage: integer("progress_page").notNull().default(1),
  weeklyGoal: integer("weekly_goal").notNull().default(50),
  highlights: jsonb("highlights").notNull().default([]),
  annotations: jsonb("annotations").notNull().default([]),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
