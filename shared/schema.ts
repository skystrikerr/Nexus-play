import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  platform: text("platform").notNull(),
  genre: text("genre"),
  status: text("status").notNull(), // wishlist, playing, completed, dropped
  rating: integer("rating"), // 1-5 stars
  progress: integer("progress").default(0), // percentage 0-100
  hoursPlayed: real("hours_played").default(0),
  coverImage: text("cover_image"),
  gameId: text("game_id"), // External API game ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gamingSessions = pgTable("gaming_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  duration: real("duration").notNull(), // hours
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSchema = createInsertSchema(gamingSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type GamingSession = typeof gamingSessions.$inferSelect;
