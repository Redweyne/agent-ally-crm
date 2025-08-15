import { db } from "./db";
import { users, prospects, leads } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { demoUsers, demoProspects, demoLeads } from "./demo-data";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function initializeDemoData() {
  try {
    console.log("🚀 Initializing demo data...");

    // Check if demo data already exists
    const existingUsers = await db.select().from(users).where(eq(users.username, 'admin'));
    if (existingUsers.length > 0) {
      console.log("✅ Demo data already exists, skipping initialization");
      return;
    }

    // Create demo users with hashed passwords
    const createdUsers = [];
    for (const user of demoUsers) {
      const hashedPassword = await hashPassword(user.password);
      const [createdUser] = await db.insert(users).values({
        ...user,
        password: hashedPassword,
      }).returning();
      createdUsers.push(createdUser);
      console.log(`✅ Created user: ${user.username} (${user.name})`);
    }

    // Assign prospects to agents
    const agents = createdUsers.filter(u => u.role === 'agent');
    
    for (let i = 0; i < demoProspects.length; i++) {
      const prospect = demoProspects[i];
      const assignedAgent = agents[i % agents.length]; // Distribute prospects among agents
      
      await db.insert(prospects).values({
        ...prospect,
        agentId: assignedAgent.id,
        // Convert dates to timestamps for database
        prochaineAction: prospect.prochaineAction || null,
        dernierContact: prospect.dernierContact || null,
      });
      
      console.log(`✅ Created prospect: ${prospect.nomComplet} (assigned to ${assignedAgent.name})`);
    }

    // Create demo leads for operator CRM
    const operator = createdUsers.find(u => u.role === 'operator');
    
    if (operator) {
      for (let i = 0; i < demoLeads.length; i++) {
        const lead = demoLeads[i];
        const assignedAgent = agents[i % agents.length]; // Distribute leads among agents for some of them
        
        await db.insert(leads).values({
          ...lead,
          ownerUserId: operator.id,
          assignedAgentId: i % 3 === 0 ? assignedAgent.id : null, // Only assign some leads to agents
          // Convert dates to timestamps for database
          prochaineAction: lead.prochaineAction || null,
          dernierContact: lead.dernierContact || null,
          createdAt: lead.createdAt || new Date(),
        });
        
        console.log(`✅ Created lead: ${lead.nomComplet} (owned by ${operator.name})`);
      }
    }

    console.log(`🎉 Demo data initialized successfully!`);
    console.log(`📊 Created ${createdUsers.length} users, ${demoProspects.length} prospects, and ${demoLeads.length} leads`);
    console.log(`🔑 Demo login credentials:`);
    console.log(`   Admin/Operator: admin / demo123`);
    console.log(`   Alice Martin: alice.martin / demo123`);
    console.log(`   Ben Leroy: ben.leroy / demo123`);

  } catch (error) {
    console.error("❌ Error initializing demo data:", error);
    throw error;
  }
}