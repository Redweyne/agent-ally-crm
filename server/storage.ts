import { 
  users, prospects, leads, interactions, appointments, deliveries, payments, rules, templates,
  type User, type InsertUser, type Prospect, type InsertProspect, 
  type Lead, type InsertLead, type Interaction, type InsertInteraction,
  type Appointment, type InsertAppointment, type Delivery, type InsertDelivery,
  type Payment, type InsertPayment, type Rule, type InsertRule,
  type Template, type InsertTemplate
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Prospects (Agent CRM)
  getProspects(agentId?: string): Promise<Prospect[]>;
  getProspectById(id: string): Promise<Prospect | undefined>;
  createProspect(prospect: InsertProspect): Promise<Prospect>;
  updateProspect(id: string, updates: Partial<InsertProspect>): Promise<Prospect | undefined>;
  deleteProspect(id: string): Promise<boolean>;
  
  // Leads (Operator CRM)
  getLeads(operatorId?: string): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  assignLeadToAgent(leadId: string, agentId: string): Promise<Lead | undefined>;
  
  // Interactions
  getInteractions(leadId?: string): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  
  // Appointments
  getAppointments(leadId?: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  
  // Deliveries
  getDeliveries(agentId?: string): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDeliveryStatus(id: string, status: string): Promise<Delivery | undefined>;
  
  // Payments
  getPayments(agentId?: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Automation Rules
  getRules(): Promise<Rule[]>;
  createRule(rule: InsertRule): Promise<Rule>;
  updateRule(id: string, updates: Partial<InsertRule>): Promise<Rule | undefined>;
  
  // Templates
  getTemplates(type?: string): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: string, updates: Partial<InsertTemplate>): Promise<Template | undefined>;
  
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
      .values(insertUser)
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  // Leads (Operator CRM)
  async getLeads(operatorId?: string): Promise<Lead[]> {
    if (operatorId) {
      return await db.select().from(leads).where(eq(leads.ownerUserId, operatorId));
    }
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db
      .update(leads)
      .set(updates)
      .where(eq(leads.id, id))
      .returning();
    return lead || undefined;
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async assignLeadToAgent(leadId: string, agentId: string): Promise<Lead | undefined> {
    const [lead] = await db
      .update(leads)
      .set({ assignedAgentId: agentId, statut: "Sent to Agent" })
      .where(eq(leads.id, leadId))
      .returning();
    return lead || undefined;
  }

  // Interactions
  async getInteractions(leadId?: string): Promise<Interaction[]> {
    if (leadId) {
      return await db.select().from(interactions).where(eq(interactions.leadId, leadId)).orderBy(desc(interactions.timestamp));
    }
    return await db.select().from(interactions).orderBy(desc(interactions.timestamp));
  }

  async createInteraction(insertInteraction: InsertInteraction): Promise<Interaction> {
    const [interaction] = await db
      .insert(interactions)
      .values(insertInteraction)
      .returning();
    return interaction;
  }

  // Appointments
  async getAppointments(leadId?: string): Promise<Appointment[]> {
    if (leadId) {
      return await db.select().from(appointments).where(eq(appointments.leadId, leadId)).orderBy(appointments.startTime);
    }
    return await db.select().from(appointments).orderBy(appointments.startTime);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    return appointment;
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [appointment] = await db
      .update(appointments)
      .set(updates)
      .where(eq(appointments.id, id))
      .returning();
    return appointment || undefined;
  }

  // Deliveries
  async getDeliveries(agentId?: string): Promise<Delivery[]> {
    if (agentId) {
      return await db.select().from(deliveries).where(eq(deliveries.agentId, agentId)).orderBy(desc(deliveries.createdAt));
    }
    return await db.select().from(deliveries).orderBy(desc(deliveries.createdAt));
  }

  async createDelivery(insertDelivery: InsertDelivery): Promise<Delivery> {
    const [delivery] = await db
      .insert(deliveries)
      .values(insertDelivery)
      .returning();
    return delivery;
  }

  async updateDeliveryStatus(id: string, status: string): Promise<Delivery | undefined> {
    const [delivery] = await db
      .update(deliveries)
      .set({ status: status as any })
      .where(eq(deliveries.id, id))
      .returning();
    return delivery || undefined;
  }

  // Payments
  async getPayments(agentId?: string): Promise<Payment[]> {
    if (agentId) {
      return await db.select().from(payments).where(eq(payments.agentId, agentId)).orderBy(desc(payments.createdAt));
    }
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  // Automation Rules
  async getRules(): Promise<Rule[]> {
    return await db.select().from(rules).orderBy(rules.name);
  }

  async createRule(insertRule: InsertRule): Promise<Rule> {
    const [rule] = await db
      .insert(rules)
      .values(insertRule)
      .returning();
    return rule;
  }

  async updateRule(id: string, updates: Partial<InsertRule>): Promise<Rule | undefined> {
    const [rule] = await db
      .update(rules)
      .set(updates)
      .where(eq(rules.id, id))
      .returning();
    return rule || undefined;
  }

  // Templates
  async getTemplates(type?: string): Promise<Template[]> {
    if (type) {
      return await db.select().from(templates).where(eq(templates.type, type)).orderBy(templates.name);
    }
    return await db.select().from(templates).orderBy(templates.name);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateTemplate(id: string, updates: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [template] = await db
      .update(templates)
      .set(updates)
      .where(eq(templates.id, id))
      .returning();
    return template || undefined;
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
