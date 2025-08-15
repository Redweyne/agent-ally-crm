import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// RBAC Middleware
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user!;
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        message: "Access denied", 
        required: allowedRoles,
        current: user.role 
      });
    }

    next();
  };
}

// Role-specific middleware
export const requireOperator = requireRole(["operator", "admin"]);
export const requireAgent = requireRole(["agent", "admin"]);
export const requireAdmin = requireRole(["admin"]);

// Check if user owns resource or is admin
export function requireOwnershipOrAdmin(resourceOwnerIdField: string = "ownerId") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user!;
    
    // Admin can access everything
    if (user.role === "admin") {
      return next();
    }

    // Check if user owns the resource
    const resourceOwnerId = req.body[resourceOwnerIdField] || req.params[resourceOwnerIdField];
    if (resourceOwnerId && resourceOwnerId !== user.id) {
      return res.status(403).json({ message: "Access denied - resource ownership required" });
    }

    next();
  };
}

// Get user role helper
export function getUserRole(req: Request): string | null {
  return req.user?.role || null;
}

// Check if user has permission for specific action
export function hasPermission(user: User, action: string, resource?: any): boolean {
  switch (action) {
    case "view_all_leads":
      return user.role === "operator" || user.role === "admin";
    
    case "assign_leads":
      return user.role === "operator" || user.role === "admin";
    
    case "manage_automation":
      return user.role === "operator" || user.role === "admin";
    
    case "view_payments":
      return user.role === "operator" || user.role === "admin";
    
    case "create_deliveries":
      return user.role === "operator" || user.role === "admin";
    
    case "view_own_prospects":
      return user.role === "agent" || user.role === "admin";
    
    case "receive_leads":
      return user.role === "agent" || user.role === "admin";
    
    default:
      return false;
  }
}