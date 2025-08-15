import { users, prospects, type User, type InsertUser, type Prospect, type InsertProspect } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Prospects
  getProspects(agentId?: string): Promise<Prospect[]>;
  getProspectById(id: string): Promise<Prospect | undefined>;
  createProspect(prospect: InsertProspect): Promise<Prospect>;
  updateProspect(id: string, updates: Partial<InsertProspect>): Promise<Prospect | undefined>;
  deleteProspect(id: string): Promise<boolean>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: "agent"
      })
      .returning();
    return user;
  }

  async getProspects(agentId?: string): Promise<Prospect[]> {
    if (agentId && agentId !== "rwd") {
      return await db.select().from(prospects).where(eq(prospects.agentId, agentId));
    }
    return await db.select().from(prospects);
  }

  async getProspectById(id: string): Promise<Prospect | undefined> {
    const [prospect] = await db.select().from(prospects).where(eq(prospects.id, id));
    return prospect || undefined;
  }

  async createProspect(insertProspect: InsertProspect): Promise<Prospect> {
    const [prospect] = await db
      .insert(prospects)
      .values({
        ...insertProspect,
        score: this.calculateScore(insertProspect),
      })
      .returning();
    return prospect;
  }

  async updateProspect(id: string, updates: Partial<InsertProspect>): Promise<Prospect | undefined> {
    const [prospect] = await db
      .update(prospects)
      .set({
        ...updates,
        score: updates.statut ? this.calculateScore(updates as InsertProspect) : undefined,
      })
      .where(eq(prospects.id, id))
      .returning();
    return prospect || undefined;
  }

  async deleteProspect(id: string): Promise<boolean> {
    const result = await db.delete(prospects).where(eq(prospects.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  private calculateScore(prospect: Partial<InsertProspect>): number {
    let score = 50;
    if (prospect.type === "Vendeur") score += 10;
    if (prospect.timeline?.includes("<")) score += 10;
    if (prospect.motivation && prospect.motivation.length > 20) score += 5;
    if (prospect.consentement) score += 5;
    if (prospect.statut === "RDV fixé") score += 8;
    if (prospect.statut === "Mandat signé") score += 15;
    if (prospect.statut === "Gagné") score += 10;
    if (prospect.statut === "Perdu" || prospect.statut === "Pas de réponse") score -= 15;
    score += Math.min(Math.floor((prospect.budget || 0) / 100000), 10);
    return Math.max(0, Math.min(100, score));
  }
}

export const storage = new DatabaseStorage();
