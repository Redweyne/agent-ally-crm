import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertProspectSchema, insertLeadSchema, insertInteractionSchema, 
  insertAppointmentSchema, insertDeliverySchema, insertPaymentSchema,
  insertRuleSchema, insertTemplateSchema
} from "@shared/schema";
import { requireOperator, requireAgent, requireAdmin, requireOwnershipOrAdmin, getUserRole } from "./rbac";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { appointments } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Prospects API routes
  app.get("/api/prospects", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const agentId = req.query.agentId as string || req.user!.id;
      const prospects = await storage.getProspects(agentId);
      res.json(prospects);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/prospects", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const validatedData = insertProspectSchema.parse({
        ...req.body,
        agentId: req.body.agentId || req.user!.id,
      });
      
      const prospect = await storage.createProspect(validatedData);
      res.status(201).json(prospect);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/prospects/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const { id } = req.params;
      const updates = req.body;
      
      const prospect = await storage.updateProspect(id, updates);
      if (!prospect) {
        return res.status(404).json({ message: "Prospect non trouvé" });
      }
      
      res.json(prospect);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/prospects/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const { id } = req.params;
      const deleted = await storage.deleteProspect(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Prospect non trouvé" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Operator CRM Routes
  
  // Leads Management (Operator only)
  app.get("/api/leads", requireOperator, async (req, res, next) => {
    try {
      const operatorId = req.query.operatorId as string || req.user!.id;
      const leads = await storage.getLeads(operatorId);
      res.json(leads);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/leads", requireOperator, async (req, res, next) => {
    try {
      const validatedData = insertLeadSchema.parse({
        ...req.body,
        ownerUserId: req.body.ownerUserId || req.user!.id,
      });
      
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/leads/:id", requireOperator, async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const lead = await storage.updateLead(id, updates);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      next(error);
    }
  });

  // Assign lead to agent
  app.post("/api/leads/:id/assign", requireOperator, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { agentId } = req.body;
      
      const lead = await storage.assignLeadToAgent(id, agentId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      next(error);
    }
  });

  // Interactions
  app.get("/api/interactions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const leadId = req.query.leadId as string;
      const interactions = await storage.getInteractions(leadId);
      res.json(interactions);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/interactions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const validatedData = insertInteractionSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const interaction = await storage.createInteraction(validatedData);
      res.status(201).json(interaction);
    } catch (error) {
      next(error);
    }
  });

  // Appointments
  app.get("/api/appointments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const leadId = req.query.leadId as string;
      const appointments = await storage.getAppointments(leadId);
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/appointments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      next(error);
    }
  });

  // Deliveries (Operator only)
  app.get("/api/deliveries", requireOperator, async (req, res, next) => {
    try {
      const agentId = req.query.agentId as string;
      const deliveries = await storage.getDeliveries(agentId);
      res.json(deliveries);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/deliveries", requireOperator, async (req, res, next) => {
    try {
      const validatedData = insertDeliverySchema.parse(req.body);
      const delivery = await storage.createDelivery(validatedData);
      res.status(201).json(delivery);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/deliveries/:id/status", requireOperator, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const delivery = await storage.updateDeliveryStatus(id, status);
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      res.json(delivery);
    } catch (error) {
      next(error);
    }
  });

  // Payments (Operator only)
  app.get("/api/payments", requireOperator, async (req, res, next) => {
    try {
      const agentId = req.query.agentId as string;
      const payments = await storage.getPayments(agentId);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/payments", requireOperator, async (req, res, next) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  });

  // Automation Rules (Operator only)
  app.get("/api/rules", requireOperator, async (req, res, next) => {
    try {
      const rules = await storage.getRules();
      res.json(rules);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/rules", requireOperator, async (req, res, next) => {
    try {
      const validatedData = insertRuleSchema.parse(req.body);
      const rule = await storage.createRule(validatedData);
      res.status(201).json(rule);
    } catch (error) {
      next(error);
    }
  });

  // Templates (Operator only)
  app.get("/api/templates", requireOperator, async (req, res, next) => {
    try {
      const type = req.query.type as string;
      const templates = await storage.getTemplates(type);
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/templates", requireOperator, async (req, res, next) => {
    try {
      const validatedData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  });

  // Users/Agents listing (Operator only)
  app.get("/api/users", requireOperator, async (req, res, next) => {
    try {
      const role = req.query.role as string;
      const users = await storage.getUsersByRole(role || "agent");
      res.json(users.map(user => ({ 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        isActive: user.isActive 
      })));
    } catch (error) {
      next(error);
    }
  });

  // Operator-specific CRM endpoints
  
  // Queue Management
  app.get("/api/operator/queue", requireOperator, async (req, res, next) => {
    try {
      const operatorId = req.user!.id;
      const leads = await storage.getLeadsQueue(operatorId);
      res.json(leads);
    } catch (error) {
      next(error);
    }
  });

  // Process Outcome (keyboard shortcuts)
  app.post("/api/operator/outcome", requireOperator, async (req, res, next) => {
    try {
      const { leadId, outcome } = req.body;
      const result = await storage.processOutcome(leadId, outcome, req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Operator Interactions
  app.post("/api/operator/interactions", requireOperator, async (req, res, next) => {
    try {
      const validatedData = insertInteractionSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const interaction = await storage.createInteraction(validatedData);
      res.status(201).json(interaction);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/operator/interactions", requireOperator, async (req, res, next) => {
    try {
      const leadId = req.query.leadId as string;
      const interactions = await storage.getInteractions(leadId);
      res.json(interactions);
    } catch (error) {
      next(error);
    }
  });

  // Operator Appointments with .ics
  app.post("/api/operator/appointments", requireOperator, async (req, res, next) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      
      // Generate .ics file
      const lead = await storage.getLeadById(validatedData.leadId!);
      if (lead) {
        const icsContent = await storage.generateIcsFile(appointment, lead);
        res.json({ 
          ...appointment, 
          icsUrl: `/api/operator/appointments/${appointment.id}/ics`,
          icsContent 
        });
      } else {
        res.json(appointment);
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/operator/appointments/:id/ics", async (req, res, next) => {
    try {
      const { id } = req.params;
      const appointment = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
      if (!appointment[0]) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      const lead = await storage.getLeadById(appointment[0].leadId!);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      const icsContent = await storage.generateIcsFile(appointment[0], lead);
      
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="appointment-${id}.ics"`);
      res.send(icsContent);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/operator/appointments", requireOperator, async (req, res, next) => {
    try {
      const leadId = req.query.leadId as string;
      const appointments = await storage.getAppointments(leadId);
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  });

  // Operator Deliveries with share links and PDFs
  app.post("/api/operator/deliveries", requireOperator, async (req, res, next) => {
    try {
      const { leadId, agentId, price, extras } = req.body;
      const result = await storage.createDeliveryWithAssets(leadId, agentId, price, extras);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/operator/deliveries/:id/accept", async (req, res, next) => {
    try {
      const { id } = req.params;
      const delivery = await storage.acceptDelivery(id);
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      res.json(delivery);
    } catch (error) {
      next(error);
    }
  });

  // Public delivery view (no auth required)
  app.get("/delivery/:token", async (req, res, next) => {
    try {
      const { token } = req.params;
      const delivery = await storage.getDeliveryByToken(token);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      // Mark as opened if not already
      if (delivery.status === "sent") {
        await storage.updateDeliveryStatus(delivery.id, "opened");
      }
      
      const lead = await storage.getLeadById(delivery.leadId);
      const agent = await storage.getUser(delivery.agentId);
      
      res.json({
        delivery,
        lead,
        agent: agent ? { id: agent.id, name: agent.name, email: agent.email } : null
      });
    } catch (error) {
      next(error);
    }
  });

  // Operator Stats/Metrics
  app.get("/api/operator/stats", requireOperator, async (req, res, next) => {
    try {
      const operatorId = req.user!.id;
      const range = req.query.range as string || "7";
      const stats = await storage.getOperatorStats(operatorId, range);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // Data hygiene endpoints
  app.get("/api/operator/duplicates", requireOperator, async (req, res, next) => {
    try {
      const { phone, email } = req.query;
      const duplicates = await storage.checkDuplicateLeads(phone as string, email as string);
      res.json(duplicates);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/operator/contact-status/:leadId", requireOperator, async (req, res, next) => {
    try {
      const { leadId } = req.params;
      const blocked = await storage.isContactBlocked(leadId);
      const readyToSell = await storage.isReadyToSell(leadId);
      res.json({ blocked, readyToSell });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
