import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Activity types enum
export const ACTIVITY_TYPES = {
  GAME: 'game',
  STUDY: 'study',
  WORK: 'work',
  EXERCISE: 'exercise',
  READING: 'reading',
  HOBBY: 'hobby',
  OTHER: 'other'
} as const;

export const ACTIVITY_STATUSES = {
  WISHLIST: 'wishlist',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  ON_HOLD: 'on_hold'
} as const;

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  isPublic: integer("is_public").default(1), // 1 for public, 0 for private profile
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  type: text("type").notNull(), // game, study, work, exercise, reading, hobby, other
  category: text("category"), // platform for games, subject for study, etc.
  subcategory: text("subcategory"), // genre for games, topic for study, etc.
  status: text("status").notNull(), // wishlist, in_progress, completed, dropped, on_hold
  rating: integer("rating"), // 1-5 stars
  progress: integer("progress").default(0), // percentage 0-100
  totalHours: real("total_hours").default(0),
  imageUrl: text("image_url"), // URL or path to activity image
  externalId: text("external_id"), // External API ID (e.g., game API, book API)
  description: text("description"),
  tags: text("tags").array(), // flexible tagging system
  metadata: jsonb("metadata"), // flexible data for different activity types
  isPublic: integer("is_public").default(1), // 1 for public visibility, 0 for private
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activitySessions = pgTable("activity_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityId: varchar("activity_id").notNull().references(() => activities.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  duration: real("duration").notNull(), // hours
  notes: text("notes"),
  quality: integer("quality"), // 1-5 rating for session quality/productivity
  location: text("location"), // where the session took place
  createdAt: timestamp("created_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum([
    ACTIVITY_TYPES.GAME,
    ACTIVITY_TYPES.STUDY,
    ACTIVITY_TYPES.WORK,
    ACTIVITY_TYPES.EXERCISE,
    ACTIVITY_TYPES.READING,
    ACTIVITY_TYPES.HOBBY,
    ACTIVITY_TYPES.OTHER
  ]),
  status: z.enum([
    ACTIVITY_STATUSES.WISHLIST,
    ACTIVITY_STATUSES.IN_PROGRESS,
    ACTIVITY_STATUSES.COMPLETED,
    ACTIVITY_STATUSES.DROPPED,
    ACTIVITY_STATUSES.ON_HOLD
  ]),
  rating: z.number().min(1).max(5).optional(),
  progress: z.number().min(0).max(100).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const insertSessionSchema = createInsertSchema(activitySessions).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  quality: z.number().min(1).max(5).optional(),
});

// Backward compatibility aliases for existing code
export const games = activities;
export const gamingSessions = activitySessions;
export const insertGameSchema = insertActivitySchema;

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type ActivitySession = typeof activitySessions.$inferSelect;

// Backward compatibility types
export type InsertGame = InsertActivity;
export type Game = Activity;
export type GamingSession = ActivitySession;
