import { type Activity, type InsertActivity, type ActivitySession, type InsertSession, type Game, type InsertGame, type GamingSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Activities (includes games and other activities)
  getActivities(): Promise<Activity[]>;
  getActivityById(id: string): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<boolean>;
  getActivitiesByType(type: string): Promise<Activity[]>;
  
  // Activity Sessions
  getSessions(): Promise<ActivitySession[]>;
  getSessionsByActivityId(activityId: string): Promise<ActivitySession[]>;
  getSessionsByDate(date: string): Promise<ActivitySession[]>;
  getSessionsByDateRange(startDate: string, endDate: string): Promise<ActivitySession[]>;
  createSession(session: InsertSession): Promise<ActivitySession>;
  updateSession(id: string, session: Partial<InsertSession>): Promise<ActivitySession | undefined>;
  deleteSession(id: string): Promise<boolean>;
  
  // Backward compatibility aliases
  getGames(): Promise<Game[]>;
  getGameById(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, game: Partial<InsertGame>): Promise<Game | undefined>;
  deleteGame(id: string): Promise<boolean>;
  getSessionsByGameId(gameId: string): Promise<GamingSession[]>;
}

export class MemStorage implements IStorage {
  private activities: Map<string, Activity>;
  private sessions: Map<string, ActivitySession>;

  constructor() {
    this.activities = new Map();
    this.sessions = new Map();
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).sort((a, b) => 
      new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
    );
  }

  async getActivityById(id: string): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivitiesByType(type: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.type === type)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const now = new Date();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      createdAt: now,
      updatedAt: now,
      progress: insertActivity.progress ?? 0,
      totalHours: insertActivity.totalHours ?? 0,
      category: insertActivity.category ?? null,
      subcategory: insertActivity.subcategory ?? null,
      rating: insertActivity.rating ?? null,
      imageUrl: insertActivity.imageUrl ?? null,
      externalId: insertActivity.externalId ?? null,
      description: insertActivity.description ?? null,
      tags: insertActivity.tags ?? null,
      metadata: insertActivity.metadata ?? null
    };
    this.activities.set(id, activity);
    return activity;
  }

  async updateActivity(id: string, updateData: Partial<InsertActivity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;
    
    const updatedActivity: Activity = { 
      ...activity, 
      ...updateData, 
      updatedAt: new Date() 
    };
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }

  async deleteActivity(id: string): Promise<boolean> {
    return this.activities.delete(id);
  }

  // Activity Sessions
  async getSessions(): Promise<ActivitySession[]> {
    return Array.from(this.sessions.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getSessionsByActivityId(activityId: string): Promise<ActivitySession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.activityId === activityId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getSessionsByDate(date: string): Promise<ActivitySession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.date === date);
  }

  async getSessionsByDateRange(startDate: string, endDate: string): Promise<ActivitySession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.date >= startDate && session.date <= endDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createSession(insertSession: InsertSession): Promise<ActivitySession> {
    const id = randomUUID();
    const session: ActivitySession = { 
      ...insertSession, 
      id, 
      createdAt: new Date(),
      notes: insertSession.notes ?? null,
      quality: insertSession.quality ?? null,
      location: insertSession.location ?? null
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updateData: Partial<InsertSession>): Promise<ActivitySession | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession: ActivitySession = { ...session, ...updateData };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  // Backward compatibility aliases
  async getGames(): Promise<Game[]> {
    const activities = await this.getActivitiesByType('game');
    return activities as Game[];
  }

  async getGameById(id: string): Promise<Game | undefined> {
    const activity = await this.getActivityById(id);
    return activity as Game | undefined;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const activity = await this.createActivity(game);
    return activity as Game;
  }

  async updateGame(id: string, game: Partial<InsertGame>): Promise<Game | undefined> {
    const activity = await this.updateActivity(id, game);
    return activity as Game | undefined;
  }

  async deleteGame(id: string): Promise<boolean> {
    return this.deleteActivity(id);
  }

  async getSessionsByGameId(gameId: string): Promise<GamingSession[]> {
    const sessions = await this.getSessionsByActivityId(gameId);
    return sessions as GamingSession[];
  }
}

export const storage = new MemStorage();
