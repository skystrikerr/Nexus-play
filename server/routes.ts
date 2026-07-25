import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

import { setupAuth, isAuthenticated } from "./auth";
import { insertActivitySchema, insertSessionSchema, insertGameSchema, insertReviewSchema, insertPostSchema, insertTaskSchema, insertCommunitySchema, insertChannelSchema, insertRankingListSchema, insertRankingItemSchema, ACTIVITY_TYPES } from "@shared/schema";
import { z } from "zod";
import { getSandbox, createGuestActivity, guestStatsFor } from "./guestData";

const RAWG_BASE_URL = "https://api.rawg.io/api";

function getRawgKey(): string | undefined {
  return process.env.RAWG_API_KEY;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Guest users don't exist in database, return session user directly
      if (req.user.isGuest) {
        return res.json(req.user);
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile management routes
  app.put("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updateData = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        bio: z.string().max(500).optional(),
        isPublic: z.number().min(0).max(1).optional(),
      }).parse(req.body);

      const user = await storage.updateUser(userId, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update profile photo (image URL based)
  app.put("/api/profile/photo", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { profileImageUrl } = z.object({
        profileImageUrl: z.string().url().max(2048).refine(
          (url) => url.startsWith("https://"),
          { message: "Photo URL must use https" }
        ),
      }).parse(req.body);

      const user = await storage.updateUser(userId, { profileImageUrl });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ profileImageUrl });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid photo URL", errors: error.errors });
      }
      console.error("Error updating profile photo:", error);
      res.status(500).json({ message: "Failed to update profile photo" });
    }
  });

  // RAWG game database proxy — keeps the API key server-side
  app.get("/api/rawg/search", isAuthenticated, async (req, res) => {
    try {
      const key = getRawgKey();
      if (!key) {
        return res.status(503).json({ message: "Game search is not configured (missing RAWG_API_KEY)" });
      }
      const query = String(req.query.q || "").slice(0, 100);
      if (query.trim().length < 2) {
        return res.json({ count: 0, results: [] });
      }
      const url = `${RAWG_BASE_URL}/games?key=${key}&search=${encodeURIComponent(query)}&page_size=12&ordering=-rating,-added`;
      const rawgRes = await fetch(url);
      if (!rawgRes.ok) {
        return res.status(rawgRes.status === 429 ? 429 : 502).json({ count: 0, results: [] });
      }
      const data = await rawgRes.json();
      // RAWG embeds the API key in its pagination URLs — don't leak them to the client
      delete data.next;
      delete data.previous;
      res.json(data);
    } catch (error) {
      console.error("RAWG search error:", error);
      res.status(502).json({ count: 0, results: [] });
    }
  });

  // Upcoming game releases for the next ~3 months
  app.get("/api/rawg/releases", isAuthenticated, async (req, res) => {
    try {
      const key = getRawgKey();
      if (!key) {
        return res.status(503).json({ message: "Release calendar is not configured (missing RAWG_API_KEY)" });
      }
      const today = new Date();
      const end = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
      const fmt = (d: Date) => d.toISOString().split("T")[0];
      const url = `${RAWG_BASE_URL}/games?key=${key}&dates=${fmt(today)},${fmt(end)}&ordering=released&page_size=40`;
      const rawgRes = await fetch(url);
      if (!rawgRes.ok) {
        return res.status(rawgRes.status === 429 ? 429 : 502).json({ count: 0, results: [] });
      }
      const data = await rawgRes.json();
      delete data.next;
      delete data.previous;
      res.json(data);
    } catch (error) {
      console.error("RAWG releases error:", error);
      res.status(502).json({ count: 0, results: [] });
    }
  });

  app.get("/api/rawg/games/:id", isAuthenticated, async (req, res) => {
    try {
      const key = getRawgKey();
      if (!key) {
        return res.status(503).json({ message: "Game search is not configured (missing RAWG_API_KEY)" });
      }
      const gameId = parseInt(req.params.id, 10);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game id" });
      }
      const rawgRes = await fetch(`${RAWG_BASE_URL}/games/${gameId}?key=${key}`);
      if (!rawgRes.ok) {
        return res.status(502).json({ message: "Failed to fetch game details" });
      }
      res.json(await rawgRes.json());
    } catch (error) {
      console.error("RAWG details error:", error);
      res.status(502).json({ message: "Failed to fetch game details" });
    }
  });

  // Public user routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getPublicUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUserByIdPublic(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found or private" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id/activities", async (req, res) => {
    try {
      const activities = await storage.getPublicActivities(req.params.id);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });

  app.get("/api/users/:id/sessions", async (req, res) => {
    try {
      const sessions = await storage.getPublicSessions(req.params.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user sessions" });
    }
  });

  // Activities routes (protected)
  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type } = req.query;
      
      // Guests get their own private in-memory sandbox
      if (req.user.isGuest) {
        let activities = [...getSandbox(userId).activities];
        if (type && typeof type === 'string') {
          activities = activities.filter(a => a.type === type);
        }
        return res.json(activities);
      }
      
      let activities;
      if (type && typeof type === 'string') {
        activities = await storage.getActivitiesByType(type, userId);
      } else {
        activities = await storage.getActivities(userId);
      }
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (req.user.isGuest) {
        const activity = getSandbox(userId).activities.find(a => a.id === req.params.id);
        if (!activity) return res.status(404).json({ message: "Activity not found" });
        return res.json(activity);
      }
      const activity = await storage.getActivityById(req.params.id, userId);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.post("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activityData = insertActivitySchema.parse(req.body);
      if (req.user.isGuest) {
        const activity = createGuestActivity(getSandbox(userId), userId, activityData);
        return res.status(201).json(activity);
      }
      const activity = await storage.createActivity(activityData, userId);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.put("/api/activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activityData = insertActivitySchema.partial().parse(req.body);
      if (req.user.isGuest) {
        const box = getSandbox(userId);
        const activity = box.activities.find(a => a.id === req.params.id);
        if (!activity) return res.status(404).json({ message: "Activity not found" });
        Object.assign(activity, activityData, { updatedAt: new Date() });
        return res.json(activity);
      }
      const activity = await storage.updateActivity(req.params.id, activityData, userId);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update activity" });
    }
  });

  app.delete("/api/activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (req.user.isGuest) {
        const box = getSandbox(userId);
        const before = box.activities.length;
        box.activities = box.activities.filter(a => a.id !== req.params.id);
        box.sessions = box.sessions.filter(sess => sess.activityId !== req.params.id);
        box.rankingItems = box.rankingItems.filter(i => i.activityId !== req.params.id);
        if (box.activities.length === before) {
          return res.status(404).json({ message: "Activity not found" });
        }
        return res.status(204).send();
      }
      const success = await storage.deleteActivity(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  app.delete("/api/activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const deleted = await storage.deleteActivity(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Games routes (backward compatibility)
  app.get("/api/games", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.isGuest) {
        return res.json(getSandbox(req.user.id).activities.filter(a => a.type === "game"));
      }
      const userId = req.user.id;
      const games = await storage.getGames(userId);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/games/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const game = await storage.getGameById(req.params.id, userId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.post("/api/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData, userId);
      res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid game data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.put("/api/games/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const gameData = insertGameSchema.partial().parse(req.body);
      const game = await storage.updateGame(req.params.id, gameData, userId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid game data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  app.delete("/api/games/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const deleted = await storage.deleteGame(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // Activity sessions routes - Enhanced with activity details for calendar
  app.get("/api/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { activityId, gameId, date, startDate, endDate } = req.query;
      
      if (req.user.isGuest) {
        const box = getSandbox(userId);
        let sessions = [...box.sessions];
        if (activityId) {
          sessions = sessions.filter(s => s.activityId === activityId);
        } else if (gameId) {
          sessions = sessions.filter(s => s.activityId === gameId);
        } else if (date) {
          sessions = sessions.filter(s => s.date === date);
        }
        
        const enhancedSessions = sessions.map(session => {
          const activity = box.activities.find(a => a.id === session.activityId);
          return {
            ...session,
            activity: activity ? {
              title: activity.title,
              type: activity.type,
              category: activity.category,
              imageUrl: activity.imageUrl
            } : null
          };
        });
        
        return res.json(enhancedSessions);
      }
      
      let sessions;
      if (activityId) {
        sessions = await storage.getSessionsByActivityId(activityId as string, userId);
      } else if (gameId) {
        sessions = await storage.getSessionsByGameId(gameId as string, userId);
      } else if (date) {
        sessions = await storage.getSessionsByDate(date as string, userId);
      } else if (startDate && endDate) {
        sessions = await storage.getSessionsByDateRange(startDate as string, endDate as string, userId);
      } else {
        sessions = await storage.getSessions(userId);
      }
      
      // Enhance sessions with activity details for calendar view
      const enhancedSessions = await Promise.all(
        sessions.map(async (session) => {
          try {
            const activity = await storage.getActivityById(session.activityId, userId);
            return {
              ...session,
              activity: activity ? {
                title: activity.title,
                type: activity.type,
                category: activity.category,
                imageUrl: activity.imageUrl
              } : null
            };
          } catch (error) {
            // If activity not found, return session without activity details
            return session;
          }
        })
      );
      
      res.json(enhancedSessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post("/api/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sessionData = insertSessionSchema.parse(req.body);
      if (req.user.isGuest) {
        const box = getSandbox(userId);
        const session = { id: "guest-" + Date.now(), userId, ...sessionData, createdAt: new Date() };
        box.sessions.push(session);
        const activity = box.activities.find(a => a.id === sessionData.activityId);
        if (activity) {
          activity.totalHours = (activity.totalHours || 0) + (sessionData.duration || 0);
          activity.updatedAt = new Date();
        }
        return res.status(201).json(session);
      }
      const session = await storage.createSession(sessionData, userId);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.put("/api/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sessionData = insertSessionSchema.partial().parse(req.body);
      const session = await storage.updateSession(req.params.id, sessionData, userId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.delete("/api/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const deleted = await storage.deleteSession(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Timer routes
  app.get("/api/timer", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (req.user.isGuest) {
        return res.json(getSandbox(userId).activeTimer);
      }
      const activeTimer = await storage.getActiveTimer(userId);
      res.json(activeTimer);
    } catch (error) {
      console.error("Error fetching active timer:", error);
      res.status(500).json({ message: "Failed to fetch active timer" });
    }
  });

  app.post("/api/timer/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { activityId } = z.object({
        activityId: z.string(),
      }).parse(req.body);

      if (req.user.isGuest) {
        const box = getSandbox(userId);
        if (box.activeTimer) {
          return res.status(409).json({ message: "Timer already running" });
        }
        box.activeTimer = { id: "guest-timer", activityId, startedAt: Date.now() };
        return res.status(201).json({ ...box.activeTimer, startTime: new Date(box.activeTimer.startedAt) });
      }
      const timer = await storage.startTimer(activityId, userId);
      res.status(201).json(timer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid timer data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("Timer already running")) {
        return res.status(409).json({ message: error.message });
      }
      console.error("Error starting timer:", error);
      res.status(500).json({ message: "Failed to start timer" });
    }
  });

  app.post("/api/timer/stop", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { activityId } = z.object({
        activityId: z.string(),
      }).parse(req.body);

      if (req.user.isGuest) {
        const box = getSandbox(userId);
        if (!box.activeTimer || box.activeTimer.activityId !== activityId) {
          return res.status(404).json({ message: "No active timer found for this activity" });
        }
        const duration = Math.max(0.01, (Date.now() - box.activeTimer.startedAt) / 3600000);
        const session = {
          id: "guest-" + Date.now(),
          userId,
          activityId,
          date: new Date().toISOString().split("T")[0],
          duration: Math.round(duration * 100) / 100,
          notes: null,
          quality: null,
          location: null,
          createdAt: new Date(),
        };
        box.sessions.push(session);
        const activity = box.activities.find(a => a.id === activityId);
        if (activity) {
          activity.totalHours = (activity.totalHours || 0) + session.duration;
        }
        box.activeTimer = null;
        return res.json(session);
      }
      const session = await storage.stopTimer(activityId, userId);
      if (!session) {
        return res.status(404).json({ message: "No active timer found for this activity" });
      }
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid timer data", errors: error.errors });
      }
      console.error("Error stopping timer:", error);
      res.status(500).json({ message: "Failed to stop timer" });
    }
  });

  // External API proxy for game search
  app.get("/api/search-games", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Query parameter required" });
      }

      const apiKey = process.env.RAWG_API_KEY || process.env.VITE_RAWG_API_KEY || "default_key";
      const response = await fetch(`https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query as string)}&page_size=10`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Game search error:", error);
      res.status(500).json({ message: "Failed to search games" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { timeRange = '30' } = req.query;
      const days = parseInt(timeRange as string);
      
      // Get analytics data for the specified time range
      const analytics = await storage.getAnalyticsData(userId, days);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Settings endpoints
  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const settings = {
        theme: "dark",
        isPublic: user.isPublic === 1, // Convert 1/0 to boolean
        bio: user.bio || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        notifications: {
          achievements: true,
          reminders: true,
          social: true,
        },
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settingsData = req.body;
      
      // Build update object for user profile
      const updateData: any = {};
      if (settingsData.firstName !== undefined) updateData.firstName = settingsData.firstName;
      if (settingsData.lastName !== undefined) updateData.lastName = settingsData.lastName;
      if (settingsData.bio !== undefined) updateData.bio = settingsData.bio;
      if (settingsData.isPublic !== undefined) {
        // Convert boolean to 1/0 for database
        updateData.isPublic = settingsData.isPublic ? 1 : 0;
      }
      
      // Update user profile if there are changes
      if (Object.keys(updateData).length > 0) {
        await storage.updateUser(userId, updateData);
      }
      
      // For other settings like theme and notifications, we'd need a separate settings table
      // For now, just acknowledge the update
      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Statistics endpoint
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (req.user.isGuest) {
        return res.json(guestStatsFor(getSandbox(userId)));
      }
      
      const { type } = req.query;
      let activities;
      
      if (type && typeof type === 'string') {
        activities = await storage.getActivitiesByType(type, userId);
      } else {
        activities = await storage.getActivities(userId);
      }
      
      const sessions = await storage.getSessions(userId);
      
      // General statistics
      const totalActivities = activities.length;
      const completedActivities = activities.filter(a => a.status === 'completed').length;
      const inProgressActivities = activities.filter(a => a.status === 'in_progress').length;
      const totalHours = activities.reduce((sum, activity) => sum + (activity.totalHours || 0), 0);
      
      // Calculate current month hours
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthSessions = sessions.filter(s => s.date.startsWith(currentMonth));
      const monthlyHours = monthSessions.reduce((sum, session) => sum + session.duration, 0);
      
      // Activity type breakdown
      const byType = Object.values(ACTIVITY_TYPES).reduce((acc, activityType) => {
        const typeActivities = activities.filter(a => a.type === activityType);
        acc[activityType] = {
          count: typeActivities.length,
          completed: typeActivities.filter(a => a.status === 'completed').length,
          hours: typeActivities.reduce((sum, a) => sum + (a.totalHours || 0), 0)
        };
        return acc;
      }, {} as Record<string, { count: number; completed: number; hours: number }>);
      
      res.json({
        totalActivities,
        completedActivities,
        inProgressActivities,
        totalHours: Math.round(totalHours),
        monthlyHours: Math.round(monthlyHours * 10) / 10,
        byType,
        // Backward compatibility
        totalGames: byType.game?.count || 0,
        completedGames: byType.game?.completed || 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Tasks routes (using activities with type='task')
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tasks = await storage.getActivitiesByType('task', userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskData = {
        ...req.body,
        type: 'task'
      };
      const task = await storage.createActivity(taskData, userId);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskData = req.body;
      const task = await storage.updateActivity(req.params.id, taskData, userId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const deleted = await storage.deleteActivity(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Gaming platform sync routes
  app.post('/api/gaming/sync/steam', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.steamId) {
        return res.status(400).json({ message: 'Steam account not connected' });
      }

      const apiKey = user.steamApiKey || process.env.STEAM_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ message: 'Steam API key required' });
      }

      // Fetch Steam games from API
      const response = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${user.steamId}&include_appinfo=true&format=json`);
      
      if (!response.ok) {
        return res.status(400).json({ message: 'Failed to fetch Steam games' });
      }

      const steamData = await response.json();
      let gamesAdded = 0;

      if (steamData.response?.games) {
        for (const game of steamData.response.games) {
          const existingActivity = await storage.getActivityByExternalId(game.appid.toString(), userId);
          
          if (!existingActivity) {
            await storage.createActivity({
              title: game.name,
              type: 'game',
              category: 'Steam',
              status: game.playtime_forever > 0 ? 'in_progress' : 'wishlist',
              imageUrl: `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/header.jpg`,
              externalId: game.appid.toString(),
              totalHours: Math.round(game.playtime_forever / 60 * 100) / 100,
              metadata: {
                platform: 'Steam',
                playtime_2weeks: game.playtime_2weeks || 0,
                playtime_forever: game.playtime_forever || 0,
                last_played: game.rtime_last_played || null
              }
            }, userId);
            gamesAdded++;
          }
        }
      }

      res.json({ gamesAdded, message: `Successfully synced ${gamesAdded} Steam games` });
    } catch (error) {
      console.error('Steam sync error:', error);
      res.status(500).json({ message: 'Failed to sync Steam games' });
    }
  });

  app.post('/api/gaming/sync/xbox', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.xboxLiveId || !user?.xboxAccessToken) {
        return res.status(400).json({ message: 'Xbox account not connected' });
      }

      // Sample games for demonstration - real implementation would use Xbox API
      const mockXboxGames = [
        { 
          id: 'halo-infinite', 
          name: 'Halo Infinite', 
          imageUrl: 'https://store-images.s-microsoft.com/image/apps.18966.13727851868390641.c9cc5f5e-1a03-4a0d-94a4-9daa6d1f4ec5.9b91c027-46ec-4c5b-86b4-6a4ab9d4c8bc',
          achievements: { earned: 15, total: 40 },
          gamerscore: 450
        }
      ];

      let gamesAdded = 0;
      for (const game of mockXboxGames) {
        const existingActivity = await storage.getActivityByExternalId(game.id, userId);
        
        if (!existingActivity) {
          await storage.createActivity({
            title: game.name,
            type: 'game',
            category: 'Xbox',
            status: 'in_progress',
            imageUrl: game.imageUrl,
            externalId: game.id,
            metadata: {
              platform: 'Xbox',
              achievements: game.achievements,
              gamerscore: game.gamerscore
            }
          }, userId);
          gamesAdded++;
        }
      }

      res.json({ gamesAdded, message: `Successfully synced ${gamesAdded} Xbox games` });
    } catch (error) {
      console.error('Xbox sync error:', error);
      res.status(500).json({ message: 'Failed to sync Xbox games' });
    }
  });





  // Reviews endpoints
  app.get("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reviews = await storage.getReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/reviews/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const review = await storage.getReviewById(req.params.id, userId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });

  app.get("/api/activities/:activityId/review", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const review = await storage.getReviewByActivityId(req.params.activityId, userId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error fetching activity review:", error);
      res.status(500).json({ message: "Failed to fetch activity review" });
    }
  });

  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData, userId);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.put("/api/reviews/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reviewData = insertReviewSchema.partial().parse(req.body);
      const review = await storage.updateReview(req.params.id, reviewData, userId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.delete("/api/reviews/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteReview(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Activity completion endpoint
  app.post("/api/activities/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const completedAt = req.body.completedAt ? new Date(req.body.completedAt) : new Date();
      const activity = await storage.markActivityCompleted(req.params.id, userId, completedAt);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      console.error("Error marking activity as completed:", error);
      res.status(500).json({ message: "Failed to mark activity as completed" });
    }
  });


  // Posts API (Social Media Features)
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(postData, userId);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: error.message || "Failed to create post" });
    }
  });

  app.post("/api/posts/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const success = await storage.likePost(id, userId);
      
      if (success) {
        res.json({ message: "Post liked successfully" });
      } else {
        res.status(404).json({ message: "Post not found" });
      }
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  // Communities API (Discord/Reddit-like)
  app.get("/api/communities", async (req, res) => {
    try {
      const communities = await storage.getCommunities();
      res.json(communities);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.post("/api/communities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const communityData = insertCommunitySchema.parse(req.body);
      const community = await storage.createCommunity(communityData, userId);
      res.status(201).json(community);
    } catch (error) {
      console.error("Error creating community:", error);
      res.status(400).json({ message: error.message || "Failed to create community" });
    }
  });

  app.post("/api/communities/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const success = await storage.joinCommunity(id, userId);
      
      if (success) {
        res.json({ message: "Joined community successfully" });
      } else {
        res.status(404).json({ message: "Community not found" });
      }
    } catch (error) {
      console.error("Error joining community:", error);
      res.status(500).json({ message: "Failed to join community" });
    }
  });

  app.post("/api/communities/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const success = await storage.leaveCommunity(id, userId);
      
      if (success) {
        res.json({ message: "Left community successfully" });
      } else {
        res.status(404).json({ message: "Community not found" });
      }
    } catch (error) {
      console.error("Error leaving community:", error);
      res.status(500).json({ message: "Failed to leave community" });
    }
  });

  // Tasks API with Public/Private Visibility
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/public/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const tasks = await storage.getPublicTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching public tasks:", error);
      res.status(500).json({ message: "Failed to fetch public tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData, userId);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: error.message || "Failed to create task" });
    }
  });

  // Ranking Lists API
  app.get("/api/ranking-lists", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.isGuest) {
        return res.json(getSandbox(req.user.id).rankingLists);
      }
      const userId = req.user.id;
      const { type } = req.query;
      const lists = type 
        ? await storage.getRankingListsByType(type as string, userId)
        : await storage.getRankingLists(userId);
      res.json(lists);
    } catch (error) {
      console.error("Error fetching ranking lists:", error);
      res.status(500).json({ message: "Failed to fetch ranking lists" });
    }
  });

  app.get("/api/ranking-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const list = await storage.getRankingListById(req.params.id, userId);
      if (!list) {
        return res.status(404).json({ message: "Ranking list not found" });
      }
      res.json(list);
    } catch (error) {
      console.error("Error fetching ranking list:", error);
      res.status(500).json({ message: "Failed to fetch ranking list" });
    }
  });

  app.post("/api/ranking-lists", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.isGuest) {
        const box = getSandbox(req.user.id);
        const list = {
          id: "guest-list-" + Date.now(),
          userId: req.user.id,
          name: String(req.body.name || "My Tier List").slice(0, 200),
          description: req.body.description ? String(req.body.description).slice(0, 500) : null,
          type: "game",
          isPublic: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        box.rankingLists.push(list);
        return res.status(201).json(list);
      }
      const userId = req.user.id;
      const listData = insertRankingListSchema.parse(req.body);
      const list = await storage.createRankingList(listData, userId);
      res.status(201).json(list);
    } catch (error) {
      console.error("Error creating ranking list:", error);
      res.status(400).json({ message: error.message || "Failed to create ranking list" });
    }
  });

  app.put("/api/ranking-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const listData = insertRankingListSchema.partial().parse(req.body);
      const list = await storage.updateRankingList(req.params.id, listData, userId);
      if (!list) {
        return res.status(404).json({ message: "Ranking list not found" });
      }
      res.json(list);
    } catch (error) {
      console.error("Error updating ranking list:", error);
      res.status(400).json({ message: error.message || "Failed to update ranking list" });
    }
  });

  app.delete("/api/ranking-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (req.user.isGuest) {
        const box = getSandbox(userId);
        const before = box.rankingLists.length;
        box.rankingLists = box.rankingLists.filter(l => l.id !== req.params.id);
        box.rankingItems = box.rankingItems.filter(i => i.rankingListId !== req.params.id);
        if (box.rankingLists.length === before) {
          return res.status(404).json({ message: "Ranking list not found" });
        }
        return res.status(204).send();
      }
      const success = await storage.deleteRankingList(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Ranking list not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ranking list:", error);
      res.status(500).json({ message: "Failed to delete ranking list" });
    }
  });

  // Ranking Items API
  app.get("/api/ranking-lists/:listId/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (req.user.isGuest) {
        const items = getSandbox(userId).rankingItems
          .filter(i => i.rankingListId === req.params.listId)
          .sort((a, b) => a.position - b.position);
        return res.json(items);
      }
      const items = await storage.getRankingItems(req.params.listId, userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching ranking items:", error);
      res.status(500).json({ message: "Failed to fetch ranking items" });
    }
  });

  app.post("/api/ranking-lists/:listId/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const itemData = insertRankingItemSchema.parse(req.body);
      if (req.user.isGuest) {
        const box = getSandbox(userId);
        const item = { id: "guest-item-" + Date.now(), ...itemData, tier: itemData.tier ?? null, notes: null, createdAt: new Date() };
        box.rankingItems.push(item);
        return res.status(201).json(item);
      }
      const item = await storage.addRankingItem(itemData, userId);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error adding ranking item:", error);
      res.status(400).json({ message: error.message || "Failed to add ranking item" });
    }
  });

  app.delete("/api/ranking-items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (req.user.isGuest) {
        const box = getSandbox(userId);
        const before = box.rankingItems.length;
        box.rankingItems = box.rankingItems.filter(i => i.id !== req.params.id);
        if (box.rankingItems.length === before) {
          return res.status(404).json({ message: "Ranking item not found" });
        }
        return res.status(204).send();
      }
      const success = await storage.removeRankingItem(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Ranking item not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error removing ranking item:", error);
      res.status(500).json({ message: "Failed to remove ranking item" });
    }
  });

  app.post("/api/ranking-lists/:listId/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { items } = req.body;
      if (req.user.isGuest) {
        const box = getSandbox(userId);
        for (const it of items || []) {
          const existing = box.rankingItems.find(i => i.id === it.id && i.rankingListId === req.params.listId);
          if (existing) {
            existing.position = it.position;
            if (it.tier !== undefined) existing.tier = it.tier;
          }
        }
        return res.status(200).json({ message: "Items reordered successfully" });
      }
      const success = await storage.reorderRankingItems(req.params.listId, items, userId);
      if (!success) {
        return res.status(500).json({ message: "Failed to reorder ranking items" });
      }
      res.status(200).json({ message: "Items reordered successfully" });
    } catch (error) {
      console.error("Error reordering ranking items:", error);
      res.status(500).json({ message: "Failed to reorder ranking items" });
    }
  });

  // Communities API (Discord-like)
  app.get("/api/communities", async (req, res) => {
    try {
      const communities = await storage.getCommunities();
      res.json(communities);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.post("/api/communities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const communityData = insertCommunitySchema.parse(req.body);
      const community = await storage.createCommunity(communityData, userId);
      res.status(201).json(community);
    } catch (error) {
      console.error("Error creating community:", error);
      res.status(400).json({ message: error.message || "Failed to create community" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
