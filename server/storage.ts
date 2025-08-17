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
  
  // Queue and Outcomes
  getLeadsQueue(operatorId?: string): Promise<Lead[]>;
  processOutcome(leadId: string, outcome: string, userId: string): Promise<{ lead: Lead; interaction: Interaction; tasks?: any[] }>;
  
  // Appointment .ics generation
  generateIcsFile(appointment: Appointment, lead: Lead): Promise<string>;
  
  // Deliveries with PDF and share links
  createDeliveryWithAssets(leadId: string, agentId: string, price: number, extras: any): Promise<{ delivery: Delivery; deliveryUrl: string; pdfUrl: string }>;
  getDeliveryByToken(token: string): Promise<Delivery | undefined>;
  acceptDelivery(deliveryId: string): Promise<Delivery | undefined>;
  
  // Metrics and Analytics
  getOperatorStats(operatorId: string, range: string): Promise<any>;
  
  // Data hygiene
  checkDuplicateLeads(phone?: string, email?: string): Promise<Lead[]>;
  isContactBlocked(leadId: string): Promise<{ blocked: boolean; reason?: string }>;
  isReadyToSell(leadId: string): Promise<boolean>;
  
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
    // Prepare updates with proper date handling
    const cleanUpdates: any = { ...updates };
    
    // Remove date fields that should not be updated or convert them properly
    delete cleanUpdates.creeLe; // Never update creation date
    
    // Handle prochaineAction date field
    if (cleanUpdates.prochaineAction && typeof cleanUpdates.prochaineAction === 'string') {
      cleanUpdates.prochaineAction = new Date(cleanUpdates.prochaineAction);
    }
    
    const [prospect] = await db
      .update(prospects)
      .set({
        ...cleanUpdates,
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

  // Queue and Outcomes
  async getLeadsQueue(operatorId?: string): Promise<Lead[]> {
    const query = db.select().from(leads);
    if (operatorId) {
      query.where(eq(leads.ownerUserId, operatorId));
    }
    // Sort by hotScore DESC, hoursSinceCreated DESC, sourceWeight DESC, localWindowFit DESC
    const leadsData = await query;
    return leadsData.sort((a, b) => {
      const aHot = a.isHotLead ? 100 : a.score || 50;
      const bHot = b.isHotLead ? 100 : b.score || 50;
      if (aHot !== bHot) return bHot - aHot;
      
      const aHours = a.createdAt ? (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60) : 0;
      const bHours = b.createdAt ? (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60) : 0;
      if (Math.abs(aHours - bHours) > 1) return bHours - aHours;
      
      const sourceWeights: Record<string, number> = { "facebook": 5, "google": 4, "direct": 3, "referral": 2 };
      const aWeight = sourceWeights[a.source?.toLowerCase() || ""] || 1;
      const bWeight = sourceWeights[b.source?.toLowerCase() || ""] || 1;
      return bWeight - aWeight;
    });
  }

  async processOutcome(leadId: string, outcome: string, userId: string): Promise<{ lead: Lead; interaction: Interaction; tasks?: any[] }> {
    const lead = await this.getLeadById(leadId);
    if (!lead) throw new Error("Lead not found");
    
    // Create interaction record
    const interaction = await this.createInteraction({
      leadId,
      userId,
      kind: "call",
      direction: "outbound",
      summary: `Outcome: ${outcome}`,
      outcome
    });
    
    let updatedLead = lead;
    const tasks: any[] = [];
    
    // Process outcome logic
    switch (outcome) {
      case "no_answer":
        // Send SMS A, create follow-up J+2, status Follow-up
        updatedLead = (await this.updateLead(leadId, { 
          statut: "Follow-up",
          prochaineAction: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // J+2
        }))!;
        tasks.push({ type: "sms", template: "A", scheduledFor: new Date() });
        tasks.push({ type: "follow_up", scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) });
        break;
        
      case "voicemail":
        // SMS B, follow-up J+1
        updatedLead = (await this.updateLead(leadId, { 
          statut: "Follow-up",
          prochaineAction: new Date(Date.now() + 24 * 60 * 60 * 1000) // J+1
        }))!;
        tasks.push({ type: "sms", template: "B", scheduledFor: new Date() });
        tasks.push({ type: "follow_up", scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000) });
        break;
        
      case "bad_number":
        // bad_number=true, disable outbound
        updatedLead = (await this.updateLead(leadId, { 
          badNumber: true,
          statut: "Bad Contact"
        }))!;
        break;
        
      case "not_seller":
        // status Disqualified
        updatedLead = (await this.updateLead(leadId, { 
          statut: "Disqualified"
        }))!;
        break;
        
      case "booked":
        // create appointment + .ics, send confirm SMS, status Booked
        updatedLead = (await this.updateLead(leadId, { 
          statut: "Booked"
        }))!;
        tasks.push({ type: "appointment", scheduledFor: new Date() });
        tasks.push({ type: "sms", template: "confirm", scheduledFor: new Date() });
        break;
        
      case "dnc":
        // dnc=true, block outbound
        updatedLead = (await this.updateLead(leadId, { 
          dnc: true,
          statut: "Do Not Contact"
        }))!;
        break;
    }
    
    return { lead: updatedLead, interaction, tasks };
  }

  // Appointment .ics generation
  async generateIcsFile(appointment: Appointment, lead: Lead): Promise<string> {
    const startDate = new Date(appointment.startTime);
    const endDate = new Date(appointment.endTime);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Your Company//Your App//EN',
      'BEGIN:VEVENT',
      `UID:${appointment.icsUid || appointment.id}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:Rendez-vous avec ${lead.nomComplet}`,
      `DESCRIPTION:Contact: ${lead.telephone}\nEmail: ${lead.email}\nType: ${lead.type}`,
      `LOCATION:${appointment.location || 'À définir'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    return icsContent;
  }

  // Deliveries with assets
  async createDeliveryWithAssets(leadId: string, agentId: string, price: number, extras: any): Promise<{ delivery: Delivery; deliveryUrl: string; pdfUrl: string }> {
    const deliveryToken = Math.random().toString(36).substring(2, 15);
    const delivery = await this.createDelivery({
      leadId,
      agentId,
      price,
      deliveryUrl: `/delivery/${deliveryToken}`,
      pdfPath: `/pdfs/delivery-${deliveryToken}.pdf`
    });
    
    return {
      delivery,
      deliveryUrl: `/delivery/${deliveryToken}`,
      pdfUrl: `/pdfs/delivery-${deliveryToken}.pdf`
    };
  }

  async getDeliveryByToken(token: string): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.deliveryUrl, `/delivery/${token}`));
    return delivery || undefined;
  }

  async acceptDelivery(deliveryId: string): Promise<Delivery | undefined> {
    const [delivery] = await db
      .update(deliveries)
      .set({ status: "accepted" })
      .where(eq(deliveries.id, deliveryId))
      .returning();
    return delivery || undefined;
  }

  // Metrics
  async getOperatorStats(operatorId: string, range: string): Promise<any> {
    const daysBack = range === "7" ? 7 : 30;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    
    const allLeads = await db.select().from(leads).where(eq(leads.ownerUserId, operatorId));
    const recentLeads = allLeads.filter(lead => lead.createdAt && new Date(lead.createdAt) >= startDate);
    
    const stats = {
      today: {
        calls: recentLeads.length, // Simplified - should count actual interactions
        connects: recentLeads.filter(l => l.statut === "Contacted").length,
        booked: recentLeads.filter(l => l.statut === "Booked").length,
        deliveries: 0, // Would need to join with deliveries table
        collected: 0
      },
      funnel: {
        created: recentLeads.length,
        contacted: recentLeads.filter(l => l.statut === "Contacted").length,
        booked: recentLeads.filter(l => l.statut === "Booked").length,
        delivered: recentLeads.filter(l => l.statut === "Sent to Agent").length,
        won: recentLeads.filter(l => l.statut === "Sold").length
      },
      roi: {
        revenue: recentLeads.filter(l => l.statut === "Sold").reduce((sum, l) => sum + (l.prixEstime || 0), 0),
        cost: recentLeads.reduce((sum, l) => sum + (l.cost || 0), 0)
      }
    };
    
    return stats;
  }

  // Data hygiene
  async checkDuplicateLeads(phone?: string, email?: string): Promise<Lead[]> {
    if (!phone && !email) return [];
    
    if (phone) {
      return await db.select().from(leads).where(eq(leads.telephone, phone));
    }
    if (email) {
      return await db.select().from(leads).where(eq(leads.email, email));
    }
    
    return [];
  }

  async isContactBlocked(leadId: string): Promise<{ blocked: boolean; reason?: string }> {
    const lead = await this.getLeadById(leadId);
    if (!lead) return { blocked: false };
    
    if (lead.badNumber) return { blocked: true, reason: "Bad number" };
    if (lead.dnc) return { blocked: true, reason: "Do not contact" };
    
    return { blocked: false };
  }

  async isReadyToSell(leadId: string): Promise<boolean> {
    const lead = await this.getLeadById(leadId);
    if (!lead) return false;
    
    // Ready to Sell criteria: valid phone, consent, intention+timeline, estimate/budget, city/area, ≥1 live touch
    const hasValidPhone = lead.telephone && !lead.badNumber;
    const hasConsent = lead.consentement;
    const hasIntentionAndTimeline = lead.intention && lead.timeline;
    const hasEstimateOrBudget = lead.prixEstime || lead.budget;
    const hasLocation = lead.ville;
    
    // Check for live touch (simplified - would check interactions table)
    const hasLiveTouch = lead.dernierContact;
    
    return !!(hasValidPhone && hasConsent && hasIntentionAndTimeline && hasEstimateOrBudget && hasLocation && hasLiveTouch);
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
