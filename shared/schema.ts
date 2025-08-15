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
  exactSource: text("exact_source"), // Detailed source tracking
  consentement: boolean("consentement").default(false),
  statut: text("statut").default("Nouveau"), // Now includes "Mandate Pending", "Mandate Signed", "Won", "Lost", "In Negotiation"
  dernierContact: timestamp("dernier_contact"),
  prochaineAction: timestamp("prochaine_action"),
  agentId: varchar("agent_id").references(() => users.id),
  adresse: text("adresse"),
  notes: text("notes"),
  score: integer("score").default(50),
  agentOutcome: text("agent_outcome"), // "signed", "lost", "in_negotiation"
  isHotLead: boolean("is_hot_lead").default(false),
  leadCost: real("lead_cost").default(0), // Cost of acquiring this lead
  estimatedClosingDays: integer("estimated_closing_days"), // Days to close
  contactHistory: jsonb("contact_history").default([]), // Array of contact interactions
  priceHistory: jsonb("price_history").default([]), // For tracking price changes
});

// New table for contact interactions
export const contactInteractions = pgTable("contact_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prospectId: varchar("prospect_id").references(() => prospects.id),
  agentId: varchar("agent_id").references(() => users.id),
  type: text("type").notNull(), // "call", "email", "sms", "meeting", "note"
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow(),
  outcome: text("outcome"), // "positive", "neutral", "negative"
});

// Agency settings table for branding
export const agencySettings = pgTable("agency_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyName: text("agency_name").notNull(),
  logo: text("logo"), // URL or base64
  primaryColor: text("primary_color").default("#3b82f6"),
  secondaryColor: text("secondary_color").default("#64748b"),
  customFont: text("custom_font"),
  isDemoMode: boolean("is_demo_mode").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const prospectsRelations = relations(prospects, ({ one, many }) => ({
  agent: one(users, {
    fields: [prospects.agentId],
    references: [users.id],
  }),
  interactions: many(contactInteractions),
}));

export const usersRelations = relations(users, ({ many }) => ({
  prospects: many(prospects),
  interactions: many(contactInteractions),
}));

export const contactInteractionsRelations = relations(contactInteractions, ({ one }) => ({
  prospect: one(prospects, {
    fields: [contactInteractions.prospectId],
    references: [prospects.id],
  }),
  agent: one(users, {
    fields: [contactInteractions.agentId],
    references: [users.id],
  }),
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

// Schema types
export const insertContactInteractionSchema = createInsertSchema(contactInteractions).omit({
  id: true,
  timestamp: true,
});

export const insertAgencySettingsSchema = createInsertSchema(agencySettings).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProspect = z.infer<typeof insertProspectSchema>;
export type Prospect = typeof prospects.$inferSelect;
export type InsertContactInteraction = z.infer<typeof insertContactInteractionSchema>;
export type ContactInteraction = typeof contactInteractions.$inferSelect;
export type InsertAgencySettings = z.infer<typeof insertAgencySettingsSchema>;
export type AgencySettings = typeof agencySettings.$inferSelect;
