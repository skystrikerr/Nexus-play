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
  username: varchar("username").unique(), // unique username for social features
  password: varchar("password"), // for local auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  displayName: varchar("display_name"), // optional display name (can have spaces, emojis)
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  location: varchar("location"), // user's location
  website: varchar("website"), // personal website or social link
  provider: varchar("provider").default("local"), // 'local', 'google', 'replit'
  providerId: varchar("provider_id"), // external provider ID
  xboxLiveId: varchar("xbox_live_id"), // Xbox Live gamertag/ID
  steamId: varchar("steam_id"), // Steam user ID
  xboxAccessToken: varchar("xbox_access_token"), // Xbox access token
  steamApiKey: varchar("steam_api_key"), // Steam API key
  isPublic: integer("is_public").default(0), // 1 for public, 0 for private profile (private by default)
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
  tier: text("tier"), // S, A, B, C, D, F, or null for unranked
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
  startTime: timestamp("start_time"), // when the session started
  endTime: timestamp("end_time"), // when the session ended
  notes: text("notes"),
  quality: integer("quality"), // 1-5 rating for session quality/productivity
  location: text("location"), // where the session took place
  createdAt: timestamp("created_at").defaultNow(),
});

// Active timers table - tracks currently running timers
export const activeTimers = pgTable("active_timers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityId: varchar("activity_id").notNull().references(() => activities.id),
  startTime: timestamp("start_time").notNull().defaultNow(),
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

export const insertActiveTimerSchema = createInsertSchema(activeTimers).omit({
  id: true,
  userId: true,
  startTime: true,
  createdAt: true,
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

// Communities table (Discord-like servers)
export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  bannerUrl: text("banner_url"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  memberCount: integer("member_count").default(1),
  isPublic: integer("is_public").default(1), // 1 for public, 0 for private/invite-only
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Channels table (Discord-like channels within communities)
export const channels = pgTable("channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: varchar("type").default("text"), // text, voice, announcement
  position: integer("position").default(0), // for ordering channels
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks table (making tasks separate from activities for better public/private control)
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  priority: varchar("priority").default("medium"), // low, medium, high, urgent
  dueDate: timestamp("due_date"),
  estimatedHours: real("estimated_hours"),
  actualHours: real("actual_hours"),
  status: varchar("status").default("pending"), // pending, in_progress, completed, cancelled
  isPublic: integer("is_public").default(0), // 1 for public, 0 for private
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Posts table for social media functionality
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"), // Optional image attachment
  activityId: varchar("activity_id").references(() => activities.id), // Link to activity if relevant
  communityId: varchar("community_id").references(() => communities.id), // Link to community if posted there
  channelId: varchar("channel_id").references(() => channels.id), // Link to channel if posted there
  likes: integer("likes").default(0),
  commentsCount: integer("comments_count").default(0),
  isPublic: integer("is_public").default(1), // 1 for public, 0 for private
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community members table
export const communityMembers = pgTable("community_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").default("member"), // owner, admin, moderator, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Ranking lists table (support multiple named ranking lists)
export const rankingLists = pgTable("ranking_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: text("type").notNull(), // game, study, work, exercise, reading, hobby, other
  isPublic: integer("is_public").default(0), // 1 for public, 0 for private
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ranking items table (items within each ranking list with position)
export const rankingItems = pgTable("ranking_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rankingListId: varchar("ranking_list_id").notNull().references(() => rankingLists.id, { onDelete: "cascade" }),
  activityId: varchar("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  position: integer("position").notNull(), // 1-based position in the ranking
  notes: text("notes"), // Optional notes about why this item is ranked here
  createdAt: timestamp("created_at").defaultNow(),
});

// Validation schemas
export const insertRankingListSchema = createInsertSchema(rankingLists).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum([
    ACTIVITY_TYPES.GAME,
    ACTIVITY_TYPES.STUDY,
    ACTIVITY_TYPES.WORK,
    ACTIVITY_TYPES.EXERCISE,
    ACTIVITY_TYPES.READING,
    ACTIVITY_TYPES.HOBBY,
    ACTIVITY_TYPES.OTHER
  ]),
});

export const insertRankingItemSchema = createInsertSchema(rankingItems).omit({
  id: true,
  createdAt: true,
}).extend({
  rankingListId: z.string().uuid(),
  activityId: z.string().uuid(),
  position: z.number().int().min(1),
  notes: z.string().max(500).optional(),
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  userId: true,
  likes: true,
  commentsCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  content: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional(),
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  ownerId: true,
  memberCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  iconUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
});

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  type: z.enum(["text", "voice", "announcement"]).default("text"),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
}).extend({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type ActivitySession = typeof activitySessions.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// New types for posts and communities
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Community = typeof communities.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type InsertCommunityMember = typeof communityMembers.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type ActiveTimer = typeof activeTimers.$inferSelect;
export type InsertActiveTimer = z.infer<typeof insertActiveTimerSchema>;
export type RankingList = typeof rankingLists.$inferSelect;
export type InsertRankingList = z.infer<typeof insertRankingListSchema>;
export type RankingItem = typeof rankingItems.$inferSelect;
export type InsertRankingItem = z.infer<typeof insertRankingItemSchema>;

// Backward compatibility types
export type InsertGame = InsertActivity;
export type Game = Activity;
export type GamingSession = ActivitySession;
