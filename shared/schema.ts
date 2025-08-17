import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, real, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["agent", "operator", "admin"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["sent", "opened", "accepted", "refunded"]);
export const interactionKindEnum = pgEnum("interaction_kind", ["call", "sms", "whatsapp", "email", "meeting"]);
export const interactionDirectionEnum = pgEnum("interaction_direction", ["inbound", "outbound"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: roleEnum("role").notNull().default("agent"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leads table (renamed from prospects for operator CRM)
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
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
  exactSource: text("exact_source"),
  consentement: boolean("consentement").default(false),
  statut: text("statut").default("New"), // "New", "Contacted", "Qualified", "Booked", "Sent to Agent", "Sold", "Refunded/Bad"
  dernierContact: timestamp("dernier_contact"),
  prochaineAction: timestamp("prochaine_action"),
  
  // Operator CRM specific fields
  ownerUserId: varchar("owner_user_id").references(() => users.id), // The operator who owns this lead
  assignedAgentId: varchar("assigned_agent_id").references(() => users.id), // Agent assigned to handle this lead
  badNumber: boolean("bad_number").default(false),
  dnc: boolean("dnc").default(false), // Do not contact
  cost: real("cost").default(0), // Cost to acquire this lead
  
  adresse: text("adresse"),
  notes: text("notes"),
  score: integer("score").default(50),
  agentOutcome: text("agent_outcome"),
  isHotLead: boolean("is_hot_lead").default(false),
  leadCost: real("lead_cost").default(0),
  estimatedClosingDays: integer("estimated_closing_days"),
  contactHistory: jsonb("contact_history").default([]),
  priceHistory: jsonb("price_history").default([]),
});

// Keep prospects table for backward compatibility with agent CRM
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

// Interactions table (enhanced)
export const interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id),
  prospectId: varchar("prospect_id").references(() => prospects.id), // For backward compatibility
  userId: varchar("user_id").references(() => users.id),
  kind: interactionKindEnum("kind").notNull(),
  direction: interactionDirectionEnum("direction").notNull(),
  summary: text("summary"),
  outcome: text("outcome"), // "answered", "no_answer", "voicemail", "bad_number", "not_seller", "booked", "dnc"
  timestamp: timestamp("timestamp").defaultNow(),
  recordingUrl: text("recording_url"),
  transcript: text("transcript"),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  withAgentId: varchar("with_agent_id").references(() => users.id),
  icsUid: text("ics_uid"),
  remindersSent: boolean("reminders_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Deliveries table
export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  agentId: varchar("agent_id").references(() => users.id).notNull(),
  status: deliveryStatusEnum("status").notNull().default("sent"),
  price: real("price").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  deliveryUrl: text("delivery_url"), // Shareable link
  pdfPath: text("pdf_path"), // Path to generated PDF
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => users.id).notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("EUR"),
  paidAt: timestamp("paid_at").defaultNow(),
  stripeId: text("stripe_id"),
  deliveryId: varchar("delivery_id").references(() => deliveries.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Automation rules table
export const rules = pgTable("rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(), // e.g., "outcome:no_answer"
  action: text("action").notNull(), // e.g., "send_sms:templateA,create_task:2d"
  payload: jsonb("payload").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// SMS/Email templates table
export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // "sms", "email"
  subject: text("subject"), // For emails
  content: text("content").notNull(),
  variables: jsonb("variables").default([]), // Available merge tags
  createdAt: timestamp("created_at").defaultNow(),
});

// Keep existing contact interactions for backward compatibility
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
export const leadsRelations = relations(leads, ({ one, many }) => ({
  owner: one(users, {
    fields: [leads.ownerUserId],
    references: [users.id],
  }),
  assignedAgent: one(users, {
    fields: [leads.assignedAgentId],
    references: [users.id],
  }),
  interactions: many(interactions),
  appointments: many(appointments),
  deliveries: many(deliveries),
}));

export const prospectsRelations = relations(prospects, ({ one, many }) => ({
  agent: one(users, {
    fields: [prospects.agentId],
    references: [users.id],
  }),
  interactions: many(contactInteractions),
}));

export const usersRelations = relations(users, ({ many }) => ({
  prospects: many(prospects),
  ownedLeads: many(leads, { relationName: "OwnedLeads" }),
  assignedLeads: many(leads, { relationName: "AssignedLeads" }),
  interactions: many(interactions),
  contactInteractions: many(contactInteractions),
  appointments: many(appointments),
  deliveries: many(deliveries),
  payments: many(payments),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  lead: one(leads, {
    fields: [interactions.leadId],
    references: [leads.id],
  }),
  prospect: one(prospects, {
    fields: [interactions.prospectId],
    references: [prospects.id],
  }),
  user: one(users, {
    fields: [interactions.userId],
    references: [users.id],
  }),
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

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  lead: one(leads, {
    fields: [appointments.leadId],
    references: [leads.id],
  }),
  agent: one(users, {
    fields: [appointments.withAgentId],
    references: [users.id],
  }),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  lead: one(leads, {
    fields: [deliveries.leadId],
    references: [leads.id],
  }),
  agent: one(users, {
    fields: [deliveries.agentId],
    references: [users.id],
  }),
  payment: one(payments, {
    fields: [deliveries.id],
    references: [payments.deliveryId],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  agent: one(users, {
    fields: [payments.agentId],
    references: [users.id],
  }),
  delivery: one(deliveries, {
    fields: [payments.deliveryId],
    references: [deliveries.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  score: true,
});

export const insertProspectSchema = createInsertSchema(prospects).omit({
  creeLe: true,
  score: true,
});

// Update schema that handles string dates from frontend
export const updateProspectSchema = insertProspectSchema.extend({
  dernierContact: z.string().transform((val) => val ? new Date(val) : null).nullable().optional(),
  prochaineAction: z.string().transform((val) => val ? new Date(val) : null).nullable().optional(),
}).partial();

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  timestamp: true,
});

export const insertContactInteractionSchema = createInsertSchema(contactInteractions).omit({
  id: true,
  timestamp: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertRuleSchema = createInsertSchema(rules).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

export const insertAgencySettingsSchema = createInsertSchema(agencySettings).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertProspect = z.infer<typeof insertProspectSchema>;
export type UpdateProspect = z.infer<typeof updateProspectSchema>;
export type Prospect = typeof prospects.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactions.$inferSelect;
export type InsertContactInteraction = z.infer<typeof insertContactInteractionSchema>;
export type ContactInteraction = typeof contactInteractions.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertRule = z.infer<typeof insertRuleSchema>;
export type Rule = typeof rules.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertAgencySettings = z.infer<typeof insertAgencySettingsSchema>;
export type AgencySettings = typeof agencySettings.$inferSelect;
