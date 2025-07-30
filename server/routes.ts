import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertActivitySchema, insertSessionSchema, insertGameSchema, ACTIVITY_TYPES } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      
      if (req.user.provider === 'replit') {
        userId = req.user.claims.sub;
      } else {
        userId = req.user.id;
      }
      
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
      const userId = req.user.claims.sub;
      const { type } = req.query;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const activityData = insertActivitySchema.parse(req.body);
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
      const userId = req.user.claims.sub;
      const activityData = insertActivitySchema.partial().parse(req.body);
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const games = await storage.getGames(userId);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/games/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteGame(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // Activity sessions routes
  app.get("/api/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { activityId, gameId, date, startDate, endDate } = req.query;
      
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
      
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post("/api/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = insertSessionSchema.parse(req.body);
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteSession(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
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

  // Settings endpoints
  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      // For now, return default settings since we don't have a settings table
      // This can be extended later to use a dedicated settings table
      const defaultSettings = {
        theme: "dark",
        isPublic: true,
        bio: "",
        firstName: "",
        lastName: "",
        notifications: {
          achievements: true,
          reminders: true,
          social: true,
        },
      };
      res.json(defaultSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settingsData = req.body;
      
      // Update user profile fields in the users table
      if (settingsData.firstName !== undefined || settingsData.lastName !== undefined || settingsData.bio !== undefined) {
        const updateData: any = {};
        if (settingsData.firstName !== undefined) updateData.firstName = settingsData.firstName;
        if (settingsData.lastName !== undefined) updateData.lastName = settingsData.lastName;
        // Note: bio field would need to be added to users table schema
        
        await storage.upsertUser({ id: userId, ...updateData });
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
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
