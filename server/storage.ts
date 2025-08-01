import {
  users,
  activities,
  activitySessions,
  reviews,
  type User,
  type UpsertUser,
  type InsertActivity,
  type Activity,
  type InsertSession,
  type ActivitySession,
  type InsertReview,
  type Review,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserBySteamId(steamId: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserXboxInfo(userId: string, xboxInfo: { xboxLiveId: string; xboxAccessToken: string }): Promise<User | undefined>;
  updateUserSteamInfo(userId: string, steamInfo: { steamId: string; steamApiKey?: string }): Promise<User | undefined>;
  
  // Public user operations
  getPublicUsers(): Promise<User[]>;
  getUserByIdPublic(id: string): Promise<User | undefined>;
  
  // Activities (user-scoped)
  getActivities(userId: string): Promise<Activity[]>;
  getActivityById(id: string, userId: string): Promise<Activity | undefined>;
  getActivityByExternalId(externalId: string, userId: string): Promise<Activity | undefined>;
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
  
  // Reviews (user-scoped)
  getReviews(userId: string): Promise<Review[]>;
  getReviewById(id: string, userId: string): Promise<Review | undefined>;
  getReviewByActivityId(activityId: string, userId: string): Promise<Review | undefined>;
  createReview(review: InsertReview, userId: string): Promise<Review>;
  updateReview(id: string, review: Partial<InsertReview>, userId: string): Promise<Review | undefined>;
  deleteReview(id: string, userId: string): Promise<boolean>;
  
  // Public reviews (for viewing other users' reviews)
  getPublicReviews(userId: string): Promise<Review[]>;
  getPublicReviewsByActivity(activityId: string): Promise<Review[]>;
  
  // Completion tracking
  markActivityCompleted(activityId: string, userId: string, completedAt?: Date): Promise<Activity | undefined>;
  
  // Stripe/Premium operations
  updateStripeCustomerId(userId: string, customerId: string): Promise<void>;
  updateUserStripeInfo(userId: string, stripeData: { customerId: string; subscriptionId: string }): Promise<void>;
  updateUserPremiumStatus(userId: string, isPremium: boolean): Promise<void>;
  
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

  async getUserBySteamId(steamId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.steamId, steamId));
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

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
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

  async getActivityByExternalId(externalId: string, userId: string): Promise<Activity | undefined> {
    const [activity] = await db
      .select()
      .from(activities)
      .where(and(eq(activities.externalId, externalId), eq(activities.userId, userId)));
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

  async updateUserXboxInfo(userId: string, xboxInfo: { xboxLiveId: string; xboxAccessToken: string }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        xboxLiveId: xboxInfo.xboxLiveId,
        xboxAccessToken: xboxInfo.xboxAccessToken,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSteamInfo(userId: string, steamInfo: { steamId: string; steamApiKey?: string }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        steamId: steamInfo.steamId,
        steamApiKey: steamInfo.steamApiKey,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Reviews (user-scoped)
  async getReviews(userId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewById(id: string, userId: string): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.id, id), eq(reviews.userId, userId)));
    return review;
  }

  async getReviewByActivityId(activityId: string, userId: string): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.activityId, activityId), eq(reviews.userId, userId)));
    return review;
  }

  async createReview(review: InsertReview, userId: string): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values({ ...review, userId })
      .returning();
    return newReview;
  }

  async updateReview(id: string, review: Partial<InsertReview>, userId: string): Promise<Review | undefined> {
    const [updatedReview] = await db
      .update(reviews)
      .set({ ...review, updatedAt: new Date() })
      .where(and(eq(reviews.id, id), eq(reviews.userId, userId)))
      .returning();
    return updatedReview;
  }

  async deleteReview(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(reviews)
      .where(and(eq(reviews.id, id), eq(reviews.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Public reviews (for viewing other users' reviews)
  async getPublicReviews(userId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.isPublic, 1)))
      .orderBy(desc(reviews.createdAt));
  }

  async getPublicReviewsByActivity(activityId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.activityId, activityId), eq(reviews.isPublic, 1)))
      .orderBy(desc(reviews.createdAt));
  }

  // Completion tracking
  async markActivityCompleted(activityId: string, userId: string, completedAt?: Date): Promise<Activity | undefined> {
    const [updatedActivity] = await db
      .update(activities)
      .set({ 
        status: 'completed',
        progress: 100,
        updatedAt: new Date()
      })
      .where(and(eq(activities.id, activityId), eq(activities.userId, userId)))
      .returning();
    return updatedActivity;
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

  // Analytics operations
  async getAnalyticsData(userId: string, days: number): Promise<{
    activityHours: Array<{ type: string; hours: number; sessions: number }>;
    dailyHours: Array<{ date: string; [key: string]: number | string }>;
    weeklyStats: Array<{ week: string; totalHours: number; activeDays: number; avgSessionLength: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get sessions within the time range
    const startDateStr = startDate.toISOString().split('T')[0];
    const sessions = await db
      .select()
      .from(activitySessions)
      .where(and(
        eq(activitySessions.userId, userId),
        gte(activitySessions.date, startDateStr)
      ))
      .orderBy(desc(activitySessions.date));

    // Get activities to map types
    const activities = await this.getActivities(userId);
    const activityMap = new Map(activities.map(a => [a.id, a]));

    // Process activity hours by type
    const activityHoursMap = new Map<string, { hours: number; sessions: number }>();
    
    sessions.forEach(session => {
      const activity = activityMap.get(session.activityId);
      const type = activity?.type || 'other';
      const hours = session.duration || 0;
      
      const current = activityHoursMap.get(type) || { hours: 0, sessions: 0 };
      activityHoursMap.set(type, {
        hours: current.hours + hours,
        sessions: current.sessions + 1
      });
    });

    const activityHours = Array.from(activityHoursMap.entries()).map(([type, data]) => ({
      type,
      hours: data.hours,
      sessions: data.sessions
    }));

    // Process daily hours for time series
    const dailyHoursMap = new Map<string, Record<string, number>>();
    
    sessions.forEach(session => {
      const activity = activityMap.get(session.activityId);
      const type = activity?.type || 'other';
      const dateStr = session.date;
      const hours = session.duration || 0;
      
      if (!dailyHoursMap.has(dateStr)) {
        dailyHoursMap.set(dateStr, {});
      }
      
      const dayData = dailyHoursMap.get(dateStr)!;
      dayData[type] = (dayData[type] || 0) + hours;
    });

    const dailyHours = Array.from(dailyHoursMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate weekly stats (simplified for now)
    const totalHours = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalSessions = sessions.length;
    const uniqueDays = new Set(sessions.map(s => s.date)).size;
    
    const weeklyStats = [{
      week: `Last ${days} days`,
      totalHours,
      activeDays: uniqueDays,
      avgSessionLength: totalSessions > 0 ? totalHours / totalSessions : 0
    }];

    return {
      activityHours,
      dailyHours,
      weeklyStats
    };
  }

  // Stripe/Premium operations
  async updateStripeCustomerId(userId: string, customerId: string): Promise<void> {
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId));
  }

  async updateUserStripeInfo(userId: string, stripeData: { customerId: string; subscriptionId: string }): Promise<void> {
    await db
      .update(users)
      .set({ 
        stripeCustomerId: stripeData.customerId,
        stripeSubscriptionId: stripeData.subscriptionId,
        isPremium: true
      })
      .where(eq(users.id, userId));
  }

  async updateUserPremiumStatus(userId: string, isPremium: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isPremium })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();