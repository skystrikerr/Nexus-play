import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core";
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
  password: varchar("password"), // for local auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  provider: varchar("provider").default("local"), // 'local', 'google', 'replit'
  providerId: varchar("provider_id"), // external provider ID
  xboxLiveId: varchar("xbox_live_id"), // Xbox Live gamertag/ID
  steamId: varchar("steam_id"), // Steam user ID
  xboxAccessToken: varchar("xbox_access_token"), // Xbox access token
  steamApiKey: varchar("steam_api_key"), // Steam API key
  stripeCustomerId: varchar("stripe_customer_id"), // Stripe customer ID
  stripeSubscriptionId: varchar("stripe_subscription_id"), // Stripe subscription ID
  isPremium: boolean("is_premium").default(false), // Premium subscription status
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

// Reviews table for activities and tasks
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityId: varchar("activity_id").notNull().references(() => activities.id),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title").notNull(), // Review title/summary
  content: text("content").notNull(), // Review text content
  completedAt: timestamp("completed_at"), // When the activity was completed
  hoursSpent: real("hours_spent"), // Total hours spent on this activity
  difficulty: integer("difficulty"), // 1-5 difficulty rating
  recommendation: integer("recommendation").notNull(), // Would you recommend? 1-5
  pros: text("pros").array(), // List of positive aspects
  cons: text("cons").array(), // List of negative aspects
  tags: text("tags").array(), // Review tags
  isPublic: integer("is_public").default(1), // 1 for public, 0 for private
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(2000),
  difficulty: z.number().min(1).max(5).optional(),
  recommendation: z.number().min(1).max(5),
  hoursSpent: z.number().min(0).optional(),
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
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Backward compatibility types
export type InsertGame = InsertActivity;
export type Game = Activity;
export type GamingSession = ActivitySession;
