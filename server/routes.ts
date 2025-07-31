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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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

  // Xbox/Steam game sync routes
  app.post('/api/sync/xbox-games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.xboxAccessToken || !user?.xboxLiveId) {
        return res.status(400).json({ message: 'Xbox Live account not connected' });
      }

      // Fetch Xbox games (placeholder - would need actual Xbox API)
      const mockXboxGames = [
        { id: 'xbox_halo', name: 'Halo Infinite', imageUrl: 'https://example.com/halo.jpg', description: 'Master Chief returns' },
        { id: 'xbox_forza', name: 'Forza Horizon 5', imageUrl: 'https://example.com/forza.jpg', description: 'Open world racing' }
      ];
      
      // Add games to user's library
      let addedCount = 0;
      for (const game of mockXboxGames) {
        const existingActivities = await storage.getActivities(userId);
        const gameExists = existingActivities.some(g => g.externalId === game.id && g.type === 'game');
        
        if (!gameExists) {
          await storage.createActivity({
            title: game.name,
            type: 'game',
            category: 'Xbox',
            status: 'in_progress',
            imageUrl: game.imageUrl,
            externalId: game.id,
            description: game.description,
            metadata: { platform: 'xbox', source: 'xbox_sync' }
          }, userId);
          addedCount++;
        }
      }

      res.json({ 
        message: `Successfully synced ${addedCount} Xbox games`,
        gamesAdded: addedCount,
        totalGames: mockXboxGames.length
      });
    } catch (error) {
      console.error('Xbox game sync error:', error);
      res.status(500).json({ message: 'Failed to sync Xbox games' });
    }
  });

  app.post('/api/sync/steam-games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.steamId) {
        return res.status(400).json({ message: 'Steam account not connected' });
      }

      const apiKey = user.steamApiKey || process.env.STEAM_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ message: 'Steam API key not available' });
      }

      // Fetch Steam games from API
      const response = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${user.steamId}&include_appinfo=true&format=json`);
      const data = await response.json();
      const steamGames = data.response?.games || [];
      
      // Add games to user's library
      let addedCount = 0;
      for (const game of steamGames) {
        const existingActivities = await storage.getActivities(userId);
        const gameExists = existingActivities.some(g => g.externalId === game.appid.toString() && g.type === 'game');
        
        if (!gameExists) {
          await storage.createActivity({
            title: game.name,
            type: 'game',
            category: 'Steam',
            status: game.playtime_forever > 0 ? 'in_progress' : 'wishlist',
            imageUrl: `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`,
            externalId: game.appid.toString(),
            totalHours: game.playtime_forever / 60, // Convert minutes to hours
            metadata: { 
              platform: 'steam', 
              source: 'steam_sync',
              playtime_minutes: game.playtime_forever,
              last_played: game.rtime_last_played
            }
          }, userId);
          addedCount++;
        }
      }

      res.json({ 
        message: `Successfully synced ${addedCount} Steam games`,
        gamesAdded: addedCount,
        totalGames: steamGames.length
      });
    } catch (error) {
      console.error('Steam game sync error:', error);
      res.status(500).json({ message: 'Failed to sync Steam games' });
    }
  });

  // Xbox Live game sync routes
  app.post("/api/sync/xbox-games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.xboxLiveId) {
        return res.status(400).json({ message: "Xbox Live account not connected" });
      }

      // For now, we'll use a simple approach to get Xbox games
      // This would require an API key for OpenXBL or Xbox API service
      const response = await fetch(`https://xbl.io/api/v2/achievements/player/${user.xboxLiveId}`, {
        headers: {
          'X-Authorization': process.env.OPENXBL_API_KEY || '',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return res.status(400).json({ message: "Failed to fetch Xbox games" });
      }

      const xboxData = await response.json();
      let gamesAdded = 0;

      // Process Xbox games and add them to the user's library
      if (xboxData.achievements) {
        for (const gameData of xboxData.achievements) {
          const existingActivity = await storage.getActivityByExternalId(gameData.titleId.toString(), userId);
          
          if (!existingActivity) {
            await storage.createActivity({
              title: gameData.name,
              type: 'game',
              category: 'Xbox',
              status: 'in_progress',
              imageUrl: gameData.displayImage || null,
              externalId: gameData.titleId.toString(),
              metadata: {
                platform: 'Xbox',
                achievements: gameData.currentAchievements || 0,
                totalAchievements: gameData.possibleAchievements || 0,
                gamerscore: gameData.currentGamerscore || 0
              }
            }, userId);
            gamesAdded++;
          }
        }
      }

      res.json({ gamesAdded, message: `Successfully synced ${gamesAdded} Xbox games` });
    } catch (error) {
      console.error('Xbox sync error:', error);
      res.status(500).json({ message: 'Failed to sync Xbox games' });
    }
  });

  // Steam game sync routes  
  app.post("/api/sync/steam-games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.steamId) {
        return res.status(400).json({ message: "Steam account not connected" });
      }

      // Use Steam Web API to get owned games
      const steamApiKey = user.steamApiKey || process.env.STEAM_API_KEY;
      if (!steamApiKey) {
        return res.status(400).json({ message: "Steam API key required" });
      }

      const response = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${steamApiKey}&steamid=${user.steamId}&format=json&include_appinfo=true&include_played_free_games=true`);
      
      if (!response.ok) {
        return res.status(400).json({ message: "Failed to fetch Steam games" });
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
              totalHours: Math.round(game.playtime_forever / 60 * 100) / 100, // Convert minutes to hours
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

  // Get Xbox achievements for a specific game
  app.get("/api/xbox/achievements/:gameId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.xboxLiveId) {
        return res.status(400).json({ message: "Xbox Live account not connected" });
      }

      const response = await fetch(`https://xbl.io/api/v2/achievements/player/${user.xboxLiveId}/title/${req.params.gameId}`, {
        headers: {
          'X-Authorization': process.env.OPENXBL_API_KEY || '',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return res.status(400).json({ message: "Failed to fetch achievements" });
      }

      const achievements = await response.json();
      res.json(achievements);
    } catch (error) {
      console.error('Xbox achievements error:', error);
      res.status(500).json({ message: 'Failed to fetch Xbox achievements' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
