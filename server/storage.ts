import {
  users,
  activities,
  activitySessions,
  activeTimers,
  reviews,
  posts,
  communities,
  channels,
  communityMembers,
  tasks,
  rankingLists,
  rankingItems,
  type User,
  type UpsertUser,
  type InsertActivity,
  type Activity,
  type InsertSession,
  type ActivitySession,
  type ActiveTimer,
  type InsertActiveTimer,
  type InsertReview,
  type Review,
  type Post,
  type InsertPost,
  type Community,
  type InsertCommunity,
  type Channel,
  type InsertChannel,
  type CommunityMember,
  type InsertCommunityMember,
  type Task,
  type InsertTask,
  type RankingList,
  type InsertRankingList,
  type RankingItem,
  type InsertRankingItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetTokenHash(tokenHash: string): Promise<User | undefined>;
  getUserByVerifyTokenHash(tokenHash: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserBySteamId(steamId: string): Promise<User | undefined>;
  getUserByProviderId(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(userId: string, userData: Partial<UpsertUser>): Promise<User | undefined>;
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
  
  // Active Timers (user-scoped)
  startTimer(activityId: string, userId: string): Promise<ActiveTimer>;
  stopTimer(activityId: string, userId: string): Promise<ActivitySession | null>;
  getActiveTimer(userId: string): Promise<ActiveTimer | null>;
  getActiveTimerByActivity(activityId: string, userId: string): Promise<ActiveTimer | null>;
  
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
  
  
  // Posts (social features)
  createPost(post: InsertPost, userId: string): Promise<Post>;
  getPosts(userId?: string): Promise<Post[]>; // Get all public posts or user's posts
  getPostById(id: string): Promise<Post | undefined>;
  getUserPosts(userId: string): Promise<Post[]>;
  updatePost(id: string, post: Partial<InsertPost>, userId: string): Promise<Post | undefined>;
  deletePost(id: string, userId: string): Promise<boolean>;
  likePost(postId: string, userId: string): Promise<boolean>;

  // Communities (social features)
  createCommunity(community: InsertCommunity, userId: string): Promise<Community>;
  getCommunities(): Promise<Community[]>;
  getCommunityById(id: string): Promise<Community | undefined>;
  updateCommunity(id: string, community: Partial<InsertCommunity>, userId: string): Promise<Community | undefined>;
  deleteCommunity(id: string, userId: string): Promise<boolean>;
  joinCommunity(communityId: string, userId: string): Promise<boolean>;
  leaveCommunity(communityId: string, userId: string): Promise<boolean>;
  getUserCommunities(userId: string): Promise<Community[]>;
  getCommunityMembers(communityId: string): Promise<CommunityMember[]>;

  // Tasks with public/private visibility
  createTask(task: InsertTask, userId: string): Promise<Task>;
  getTasks(userId: string): Promise<Task[]>;
  getPublicTasks(userId: string): Promise<Task[]>; // Get user's public tasks for profile
  getTaskById(id: string, userId: string): Promise<Task | undefined>;
  updateTask(id: string, task: Partial<InsertTask>, userId: string): Promise<Task | undefined>;
  deleteTask(id: string, userId: string): Promise<boolean>;

  // Ranking lists (user-scoped)
  createRankingList(list: InsertRankingList, userId: string): Promise<RankingList>;
  getRankingLists(userId: string): Promise<RankingList[]>;
  getRankingListById(id: string, userId: string): Promise<RankingList | undefined>;
  getRankingListsByType(type: string, userId: string): Promise<RankingList[]>;
  updateRankingList(id: string, list: Partial<InsertRankingList>, userId: string): Promise<RankingList | undefined>;
  deleteRankingList(id: string, userId: string): Promise<boolean>;
  
  // Ranking items
  addRankingItem(item: InsertRankingItem, userId: string): Promise<RankingItem>;
  getRankingItems(rankingListId: string, userId: string): Promise<RankingItem[]>;
  updateRankingItemPosition(id: string, position: number, userId: string): Promise<RankingItem | undefined>;
  removeRankingItem(id: string, userId: string): Promise<boolean>;
  reorderRankingItems(rankingListId: string, itemPositions: { id: string; position: number; tier?: string | null }[], userId: string): Promise<boolean>;

  // Channels
  createChannel(channel: InsertChannel, userId: string): Promise<Channel>;
  getChannelsByCommunity(communityId: string): Promise<Channel[]>;
  getChannelById(id: string): Promise<Channel | undefined>;
  updateChannel(id: string, channel: Partial<InsertChannel>, userId: string): Promise<Channel | undefined>;
  deleteChannel(id: string, userId: string): Promise<boolean>;

  // Backward compatibility aliases
  getGames(userId: string): Promise<Activity[]>;
  getGameById(id: string, userId: string): Promise<Activity | undefined>;
  createGame(game: InsertActivity, userId: string): Promise<Activity>;
  updateGame(id: string, game: Partial<InsertActivity>, userId: string): Promise<Activity | undefined>;
  deleteGame(id: string, userId: string): Promise<boolean>;
  getSessionsByGameId(gameId: string, userId: string): Promise<ActivitySession[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByResetTokenHash(tokenHash: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.resetTokenHash, tokenHash), gte(users.resetTokenExpiresAt, new Date())));
    return user;
  }

  async getUserByVerifyTokenHash(tokenHash: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.verifyTokenHash, tokenHash), gte(users.verifyTokenExpiresAt, new Date())));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserBySteamId(steamId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.steamId, steamId));
    return user;
  }

  async getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.provider, provider), eq(users.providerId, providerId)));
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
        startTime: activitySessions.startTime,
        endTime: activitySessions.endTime,
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

  // Active Timers (user-scoped)
  async startTimer(activityId: string, userId: string): Promise<ActiveTimer> {
    // Check if there's already an active timer for this user
    const existing = await this.getActiveTimer(userId);
    if (existing) {
      throw new Error("Timer already running. Stop the current timer before starting a new one.");
    }

    const [timer] = await db
      .insert(activeTimers)
      .values({ activityId, userId })
      .returning();
    return timer;
  }

  async stopTimer(activityId: string, userId: string): Promise<ActivitySession | null> {
    // Get the active timer
    const timer = await this.getActiveTimerByActivity(activityId, userId);
    if (!timer) {
      return null;
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - timer.startTime.getTime()) / (1000 * 60 * 60); // hours
    const date = timer.startTime.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Create a session record
    const session = await this.createSession({
      activityId,
      date,
      duration,
      startTime: timer.startTime,
      endTime: endTime,
    }, userId);

    // Delete the active timer
    await db
      .delete(activeTimers)
      .where(eq(activeTimers.id, timer.id));

    return session;
  }

  async getActiveTimer(userId: string): Promise<ActiveTimer | null> {
    const [timer] = await db
      .select()
      .from(activeTimers)
      .where(eq(activeTimers.userId, userId))
      .limit(1);
    return timer || null;
  }

  async getActiveTimerByActivity(activityId: string, userId: string): Promise<ActiveTimer | null> {
    const [timer] = await db
      .select()
      .from(activeTimers)
      .where(and(eq(activeTimers.activityId, activityId), eq(activeTimers.userId, userId)))
      .limit(1);
    return timer || null;
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


  // Posts (social features)
  async createPost(postData: InsertPost, userId: string): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({ ...postData, userId })
      .returning();
    return post;
  }

  async getPosts(userId?: string): Promise<(Post & { author?: { username: string | null; displayName: string | null; profileImageUrl: string | null } })[]> {
    const withAuthors = async (rows: Post[]) => {
      const authorIds = Array.from(new Set(rows.map(p => p.userId)));
      const authors = authorIds.length
        ? await db.select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            profileImageUrl: users.profileImageUrl,
          }).from(users).where(inArray(users.id, authorIds))
        : [];
      const byId = new Map(authors.map(a => [a.id, a]));
      return rows.map(p => ({ ...p, author: byId.get(p.userId) || undefined }));
    };
    return this._getPostsRaw(userId).then(withAuthors);
  }

  private async _getPostsRaw(userId?: string): Promise<Post[]> {
    if (userId) {
      // Get user's own posts (including private ones)
      return await db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt));
    } else {
      // Get all public posts
      return await db.select().from(posts).where(eq(posts.isPublic, 1)).orderBy(desc(posts.createdAt));
    }
  }

  async getPostById(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt));
  }

  async updatePost(id: string, postData: Partial<InsertPost>, userId: string): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ ...postData, updatedAt: new Date() })
      .where(and(eq(posts.id, id), eq(posts.userId, userId)))
      .returning();
    return post;
  }

  async deletePost(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async likePost(postId: string, userId: string): Promise<boolean> {
    const [post] = await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, postId))
      .returning();
    return !!post;
  }

  // Tasks with public/private visibility
  async createTask(taskData: InsertTask, userId: string): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values({ ...taskData, userId })
      .returning();
    return task;
  }

  async getTasks(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  }

  async getPublicTasks(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.isPublic, 1)))
      .orderBy(desc(tasks.createdAt));
  }

  async getTaskById(id: string, userId: string): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task;
  }

  async updateTask(id: string, taskData: Partial<InsertTask>, userId: string): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return task;
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Ranking lists (user-scoped)
  async createRankingList(listData: InsertRankingList, userId: string): Promise<RankingList> {
    const [list] = await db
      .insert(rankingLists)
      .values({ ...listData, userId })
      .returning();
    return list;
  }

  async getRankingLists(userId: string): Promise<RankingList[]> {
    return await db
      .select()
      .from(rankingLists)
      .where(eq(rankingLists.userId, userId))
      .orderBy(desc(rankingLists.createdAt));
  }

  async getRankingListById(id: string, userId: string): Promise<RankingList | undefined> {
    const [list] = await db
      .select()
      .from(rankingLists)
      .where(and(eq(rankingLists.id, id), eq(rankingLists.userId, userId)))
      .limit(1);
    return list;
  }

  async getRankingListsByType(type: string, userId: string): Promise<RankingList[]> {
    return await db
      .select()
      .from(rankingLists)
      .where(and(eq(rankingLists.type, type), eq(rankingLists.userId, userId)))
      .orderBy(desc(rankingLists.createdAt));
  }

  async updateRankingList(id: string, listData: Partial<InsertRankingList>, userId: string): Promise<RankingList | undefined> {
    const [list] = await db
      .update(rankingLists)
      .set({ ...listData, updatedAt: new Date() })
      .where(and(eq(rankingLists.id, id), eq(rankingLists.userId, userId)))
      .returning();
    return list;
  }

  async deleteRankingList(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(rankingLists)
      .where(and(eq(rankingLists.id, id), eq(rankingLists.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Ranking items
  async addRankingItem(itemData: InsertRankingItem, userId: string): Promise<RankingItem> {
    // Verify the ranking list belongs to the user
    const list = await this.getRankingListById(itemData.rankingListId, userId);
    if (!list) {
      throw new Error("Ranking list not found or unauthorized");
    }
    
    // Verify the activity belongs to the user
    const activity = await this.getActivityById(itemData.activityId, userId);
    if (!activity) {
      throw new Error("Activity not found or unauthorized");
    }
    
    const [item] = await db
      .insert(rankingItems)
      .values(itemData)
      .returning();
    return item;
  }

  async getRankingItems(rankingListId: string, userId: string): Promise<RankingItem[]> {
    // Verify the ranking list belongs to the user
    const list = await this.getRankingListById(rankingListId, userId);
    if (!list) {
      return [];
    }
    
    return await db
      .select()
      .from(rankingItems)
      .where(eq(rankingItems.rankingListId, rankingListId))
      .orderBy(rankingItems.position);
  }

  async updateRankingItemPosition(id: string, position: number, userId: string): Promise<RankingItem | undefined> {
    // First get the item to verify ownership via the parent list
    const [existingItem] = await db
      .select()
      .from(rankingItems)
      .where(eq(rankingItems.id, id))
      .limit(1);
    
    if (!existingItem) {
      return undefined;
    }
    
    // Verify the ranking list belongs to the user
    const list = await this.getRankingListById(existingItem.rankingListId, userId);
    if (!list) {
      return undefined;
    }
    
    const [item] = await db
      .update(rankingItems)
      .set({ position })
      .where(eq(rankingItems.id, id))
      .returning();
    return item;
  }

  async removeRankingItem(id: string, userId: string): Promise<boolean> {
    // First get the item to verify ownership via the parent list
    const [existingItem] = await db
      .select()
      .from(rankingItems)
      .where(eq(rankingItems.id, id))
      .limit(1);
    
    if (!existingItem) {
      return false;
    }
    
    // Verify the ranking list belongs to the user
    const list = await this.getRankingListById(existingItem.rankingListId, userId);
    if (!list) {
      return false;
    }
    
    const result = await db
      .delete(rankingItems)
      .where(eq(rankingItems.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderRankingItems(rankingListId: string, itemPositions: { id: string; position: number; tier?: string | null }[], userId: string): Promise<boolean> {
    // Verify the ranking list belongs to the user
    const list = await this.getRankingListById(rankingListId, userId);
    if (!list) {
      return false;
    }
    
    // Fetch all existing items for this list to verify ownership
    const existingItems = await db
      .select()
      .from(rankingItems)
      .where(eq(rankingItems.rankingListId, rankingListId));
    
    const existingItemIds = new Set(existingItems.map(item => item.id));
    
    // Verify all provided item IDs belong to this list
    for (const { id } of itemPositions) {
      if (!existingItemIds.has(id)) {
        console.error(`Item ${id} does not belong to list ${rankingListId}`);
        return false;
      }
    }
    
    try {
      // Update each item's position (and tier, when provided) in a transaction
      await db.transaction(async (tx) => {
        for (const { id, position, tier } of itemPositions) {
          await tx
            .update(rankingItems)
            .set(tier === undefined ? { position } : { position, tier })
            .where(and(eq(rankingItems.id, id), eq(rankingItems.rankingListId, rankingListId)));
        }
      });
      return true;
    } catch (error) {
      console.error("Error reordering ranking items:", error);
      return false;
    }
  }

  // Communities (Discord-like)
  async createCommunity(communityData: InsertCommunity, userId: string): Promise<Community> {
    const [community] = await db
      .insert(communities)
      .values({ ...communityData, ownerId: userId })
      .returning();
    
    // Add creator as owner member
    await db.insert(communityMembers).values({
      communityId: community.id,
      userId: userId,
      role: "owner"
    });
    
    return community;
  }

  async getCommunities(): Promise<Community[]> {
    return await db.select().from(communities).where(eq(communities.isPublic, 1)).orderBy(desc(communities.createdAt));
  }

  async getUserCommunities(userId: string): Promise<Community[]> {
    const memberCommunities = await db
      .select({ 
        id: communities.id,
        name: communities.name,
        description: communities.description,
        iconUrl: communities.iconUrl,
        bannerUrl: communities.bannerUrl,
        ownerId: communities.ownerId,
        memberCount: communities.memberCount,
        isPublic: communities.isPublic,
        createdAt: communities.createdAt,
        updatedAt: communities.updatedAt
      })
      .from(communities)
      .innerJoin(communityMembers, eq(communities.id, communityMembers.communityId))
      .where(eq(communityMembers.userId, userId));
    return memberCommunities;
  }

  async getCommunityById(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async updateCommunity(id: string, communityData: Partial<InsertCommunity>, userId: string): Promise<Community | undefined> {
    const [community] = await db
      .update(communities)
      .set({ ...communityData, updatedAt: new Date() })
      .where(and(eq(communities.id, id), eq(communities.ownerId, userId)))
      .returning();
    return community;
  }

  async deleteCommunity(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(communities)
      .where(and(eq(communities.id, id), eq(communities.ownerId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async joinCommunity(communityId: string, userId: string): Promise<boolean> {
    try {
      // Check if already a member
      const [existingMember] = await db
        .select()
        .from(communityMembers)
        .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
      
      if (existingMember) {
        return true; // Already a member
      }
      
      const [member] = await db
        .insert(communityMembers)
        .values({ communityId, userId, role: "member" })
        .returning();
    
      await db
        .update(communities)
        .set({ memberCount: sql`${communities.memberCount} + 1` })
        .where(eq(communities.id, communityId));
      
      return !!member;
    } catch (error) {
      return false;
    }
  }

  async leaveCommunity(communityId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
    
    if (result.rowCount && result.rowCount > 0) {
      await db
        .update(communities)
        .set({ memberCount: sql`${communities.memberCount} - 1` })
        .where(eq(communities.id, communityId));
      return true;
    }
    return false;
  }

  async getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
    return await db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId));
  }

  // Channels
  async createChannel(channelData: InsertChannel, userId: string): Promise<Channel> {
    const [channel] = await db
      .insert(channels)
      .values(channelData)
      .returning();
    return channel;
  }

  async getChannelsByCommunity(communityId: string): Promise<Channel[]> {
    return await db
      .select()
      .from(channels)
      .where(eq(channels.communityId, communityId))
      .orderBy(channels.position);
  }

  async getChannelById(id: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel;
  }

  async updateChannel(id: string, channelData: Partial<InsertChannel>, userId: string): Promise<Channel | undefined> {
    const [channel] = await db
      .update(channels)
      .set(channelData)
      .where(eq(channels.id, id))
      .returning();
    return channel;
  }

  async deleteChannel(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(channels)
      .where(eq(channels.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();