import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProspectSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
