import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("agent"), // "admin" or "agent"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prospects = pgTable("prospects", {
  id: varchar("id").primaryKey(),
  creeLe: timestamp("cree_le").defaultNow(),
  nomComplet: text("nom_complet"),
  telephone: text("telephone"),
  email: text("email"),
  type: text("type"), // "Vendeur" or "Acheteur"
  ville: text("ville"),
  typeBien: text("type_bien"),
  budget: integer("budget").default(0),
  prixEstime: integer("prix_estime").default(0),
  tauxHonoraires: real("taux_honoraires").default(0.04),
  exclusif: boolean("exclusif").default(false),
  motivation: text("motivation"),
  timeline: text("timeline"),
  intention: text("intention"),
  source: text("source"),
  consentement: boolean("consentement").default(false),
  statut: text("statut").default("Nouveau"),
  dernierContact: timestamp("dernier_contact"),
  prochaineAction: timestamp("prochaine_action"),
  agentId: varchar("agent_id").references(() => users.id),
  adresse: text("adresse"),
  notes: text("notes"),
  score: integer("score").default(50),
});

export const prospectsRelations = relations(prospects, ({ one }) => ({
  agent: one(users, {
    fields: [prospects.agentId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  prospects: many(prospects),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

export const insertProspectSchema = createInsertSchema(prospects).omit({
  creeLe: true,
  score: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProspect = z.infer<typeof insertProspectSchema>;
export type Prospect = typeof prospects.$inferSelect;
