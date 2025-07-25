import { type Game, type InsertGame, type GamingSession, type InsertSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Games
  getGames(): Promise<Game[]>;
  getGameById(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, game: Partial<InsertGame>): Promise<Game | undefined>;
  deleteGame(id: string): Promise<boolean>;
  
  // Gaming Sessions
  getSessions(): Promise<GamingSession[]>;
  getSessionsByGameId(gameId: string): Promise<GamingSession[]>;
  getSessionsByDate(date: string): Promise<GamingSession[]>;
  getSessionsByDateRange(startDate: string, endDate: string): Promise<GamingSession[]>;
  createSession(session: InsertSession): Promise<GamingSession>;
  updateSession(id: string, session: Partial<InsertSession>): Promise<GamingSession | undefined>;
  deleteSession(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private games: Map<string, Game>;
  private sessions: Map<string, GamingSession>;

  constructor() {
    this.games = new Map();
    this.sessions = new Map();
  }

  // Games
  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values()).sort((a, b) => 
      new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
    );
  }

  async getGameById(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = randomUUID();
    const now = new Date();
    const game: Game = { 
      ...insertGame, 
      id, 
      createdAt: now,
      updatedAt: now,
      progress: insertGame.progress ?? 0,
      hoursPlayed: insertGame.hoursPlayed ?? 0,
      genre: insertGame.genre ?? null,
      rating: insertGame.rating ?? null,
      coverImage: insertGame.coverImage ?? null,
      gameId: insertGame.gameId ?? null
    };
    this.games.set(id, game);
    return game;
  }

  async updateGame(id: string, updateData: Partial<InsertGame>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame: Game = { 
      ...game, 
      ...updateData, 
      updatedAt: new Date() 
    };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async deleteGame(id: string): Promise<boolean> {
    return this.games.delete(id);
  }

  // Gaming Sessions
  async getSessions(): Promise<GamingSession[]> {
    return Array.from(this.sessions.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getSessionsByGameId(gameId: string): Promise<GamingSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.gameId === gameId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getSessionsByDate(date: string): Promise<GamingSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.date === date);
  }

  async getSessionsByDateRange(startDate: string, endDate: string): Promise<GamingSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.date >= startDate && session.date <= endDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createSession(insertSession: InsertSession): Promise<GamingSession> {
    const id = randomUUID();
    const session: GamingSession = { 
      ...insertSession, 
      id, 
      createdAt: new Date(),
      notes: insertSession.notes ?? null
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updateData: Partial<InsertSession>): Promise<GamingSession | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession: GamingSession = { ...session, ...updateData };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }
}

export const storage = new MemStorage();
