import {
  users,
  activities,
  activitySessions,
  type User,
  type UpsertUser,
  type InsertActivity,
  type Activity,
  type InsertSession,
  type ActivitySession,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Public user operations
  getPublicUsers(): Promise<User[]>;
  getUserByIdPublic(id: string): Promise<User | undefined>;
  
  // Activities (user-scoped)
  getActivities(userId: string): Promise<Activity[]>;
  getActivityById(id: string, userId: string): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity, userId: string): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>, userId: string): Promise<Activity | undefined>;
  deleteActivity(id: string, userId: string): Promise<boolean>;
  getActivitiesByType(type: string, userId: string): Promise<Activity[]>;
  
  // Public activities (for viewing other users' profiles)
  getPublicActivities(userId: string): Promise<Activity[]>;
  getPublicActivitiesByType(type: string, userId: string): Promise<Activity[]>;
  
  // Activity Sessions (user-scoped)
  getSessions(userId: string): Promise<ActivitySession[]>;
  getSessionsByActivityId(activityId: string, userId: string): Promise<ActivitySession[]>;
  getSessionsByDate(date: string, userId: string): Promise<ActivitySession[]>;
  getSessionsByDateRange(startDate: string, endDate: string, userId: string): Promise<ActivitySession[]>;
  createSession(session: InsertSession, userId: string): Promise<ActivitySession>;
  updateSession(id: string, session: Partial<InsertSession>, userId: string): Promise<ActivitySession | undefined>;
  deleteSession(id: string, userId: string): Promise<boolean>;
  
  // Public sessions (for viewing other users' profiles)
  getPublicSessions(userId: string): Promise<ActivitySession[]>;
  
  // Backward compatibility aliases
  getGames(userId: string): Promise<Activity[]>;
  getGameById(id: string, userId: string): Promise<Activity | undefined>;
  createGame(game: InsertActivity, userId: string): Promise<Activity>;
  updateGame(id: string, game: Partial<InsertActivity>, userId: string): Promise<Activity | undefined>;
  deleteGame(id: string, userId: string): Promise<boolean>;
  getSessionsByGameId(gameId: string, userId: string): Promise<ActivitySession[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Public user operations
  async getPublicUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isPublic, 1))
      .orderBy(desc(users.createdAt));
  }

  async getUserByIdPublic(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.isPublic, 1)));
    return user;
  }

  // Activities (user-scoped)
  async getActivities(userId: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.updatedAt));
  }

  async getActivityById(id: string, userId: string): Promise<Activity | undefined> {
    const [activity] = await db
      .select()
      .from(activities)
      .where(and(eq(activities.id, id), eq(activities.userId, userId)));
    return activity;
  }

  async createActivity(activityData: InsertActivity, userId: string): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values({ ...activityData, userId })
      .returning();
    return activity;
  }

  async updateActivity(id: string, activityData: Partial<InsertActivity>, userId: string): Promise<Activity | undefined> {
    const [activity] = await db
      .update(activities)
      .set({ ...activityData, updatedAt: new Date() })
      .where(and(eq(activities.id, id), eq(activities.userId, userId)))
      .returning();
    return activity;
  }

  async deleteActivity(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(activities)
      .where(and(eq(activities.id, id), eq(activities.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getActivitiesByType(type: string, userId: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(and(eq(activities.userId, userId), eq(activities.type, type)))
      .orderBy(desc(activities.updatedAt));
  }

  // Public activities (for viewing other users' profiles)
  async getPublicActivities(userId: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(and(eq(activities.userId, userId), eq(activities.isPublic, 1)))
      .orderBy(desc(activities.updatedAt));
  }

  async getPublicActivitiesByType(type: string, userId: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(and(
        eq(activities.userId, userId),
        eq(activities.type, type),
        eq(activities.isPublic, 1)
      ))
      .orderBy(desc(activities.updatedAt));
  }

  // Activity Sessions (user-scoped)
  async getSessions(userId: string): Promise<ActivitySession[]> {
    return await db
      .select()
      .from(activitySessions)
      .where(eq(activitySessions.userId, userId))
      .orderBy(desc(activitySessions.createdAt));
  }

  async getSessionsByActivityId(activityId: string, userId: string): Promise<ActivitySession[]> {
    return await db
      .select()
      .from(activitySessions)
      .where(and(
        eq(activitySessions.activityId, activityId),
        eq(activitySessions.userId, userId)
      ))
      .orderBy(desc(activitySessions.createdAt));
  }

  async getSessionsByDate(date: string, userId: string): Promise<ActivitySession[]> {
    return await db
      .select()
      .from(activitySessions)
      .where(and(
        eq(activitySessions.date, date),
        eq(activitySessions.userId, userId)
      ))
      .orderBy(desc(activitySessions.createdAt));
  }

  async getSessionsByDateRange(startDate: string, endDate: string, userId: string): Promise<ActivitySession[]> {
    return await db
      .select()
      .from(activitySessions)
      .where(and(
        sql`${activitySessions.date} >= ${startDate}`,
        sql`${activitySessions.date} <= ${endDate}`,
        eq(activitySessions.userId, userId)
      ))
      .orderBy(desc(activitySessions.createdAt));
  }

  async createSession(sessionData: InsertSession, userId: string): Promise<ActivitySession> {
    const [session] = await db
      .insert(activitySessions)
      .values({ ...sessionData, userId })
      .returning();
    return session;
  }

  async updateSession(id: string, sessionData: Partial<InsertSession>, userId: string): Promise<ActivitySession | undefined> {
    const [session] = await db
      .update(activitySessions)
      .set(sessionData)
      .where(and(eq(activitySessions.id, id), eq(activitySessions.userId, userId)))
      .returning();
    return session;
  }

  async deleteSession(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(activitySessions)
      .where(and(eq(activitySessions.id, id), eq(activitySessions.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Public sessions (for viewing other users' profiles)
  async getPublicSessions(userId: string): Promise<ActivitySession[]> {
    return await db
      .select({
        id: activitySessions.id,
        userId: activitySessions.userId,
        activityId: activitySessions.activityId,
        date: activitySessions.date,
        duration: activitySessions.duration,
        notes: activitySessions.notes,
        quality: activitySessions.quality,
        location: activitySessions.location,
        createdAt: activitySessions.createdAt,
      })
      .from(activitySessions)
      .innerJoin(activities, eq(activitySessions.activityId, activities.id))
      .where(and(
        eq(activitySessions.userId, userId),
        eq(activities.isPublic, 1)
      ))
      .orderBy(desc(activitySessions.createdAt));
  }

  // Backward compatibility aliases
  async getGames(userId: string): Promise<Activity[]> {
    return this.getActivitiesByType('game', userId);
  }

  async getGameById(id: string, userId: string): Promise<Activity | undefined> {
    return this.getActivityById(id, userId);
  }

  async createGame(game: InsertActivity, userId: string): Promise<Activity> {
    return this.createActivity({ ...game, type: 'game' }, userId);
  }

  async updateGame(id: string, game: Partial<InsertActivity>, userId: string): Promise<Activity | undefined> {
    return this.updateActivity(id, game, userId);
  }

  async deleteGame(id: string, userId: string): Promise<boolean> {
    return this.deleteActivity(id, userId);
  }

  async getSessionsByGameId(gameId: string, userId: string): Promise<ActivitySession[]> {
    return this.getSessionsByActivityId(gameId, userId);
  }
}

export const storage = new DatabaseStorage();