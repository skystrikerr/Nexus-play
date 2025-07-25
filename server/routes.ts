import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema, insertSessionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Games routes
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGameById(req.params.id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid game data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.put("/api/games/:id", async (req, res) => {
    try {
      const gameData = insertGameSchema.partial().parse(req.body);
      const game = await storage.updateGame(req.params.id, gameData);
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

  app.delete("/api/games/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGame(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // Gaming sessions routes
  app.get("/api/sessions", async (req, res) => {
    try {
      const { gameId, date, startDate, endDate } = req.query;
      
      let sessions;
      if (gameId) {
        sessions = await storage.getSessionsByGameId(gameId as string);
      } else if (date) {
        sessions = await storage.getSessionsByDate(date as string);
      } else if (startDate && endDate) {
        sessions = await storage.getSessionsByDateRange(startDate as string, endDate as string);
      } else {
        sessions = await storage.getSessions();
      }
      
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.put("/api/sessions/:id", async (req, res) => {
    try {
      const sessionData = insertSessionSchema.partial().parse(req.body);
      const session = await storage.updateSession(req.params.id, sessionData);
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

  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSession(req.params.id);
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

  // Statistics endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const games = await storage.getGames();
      const sessions = await storage.getSessions();
      
      const totalGames = games.length;
      const completedGames = games.filter(g => g.status === 'completed').length;
      const totalHours = games.reduce((sum, game) => sum + (game.hoursPlayed || 0), 0);
      
      // Calculate current month hours
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthSessions = sessions.filter(s => s.date.startsWith(currentMonth));
      const monthlyHours = monthSessions.reduce((sum, session) => sum + session.duration, 0);
      
      res.json({
        totalGames,
        completedGames,
        totalHours: Math.round(totalHours),
        monthlyHours: Math.round(monthlyHours * 10) / 10
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
