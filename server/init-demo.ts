import { db } from "./db";
import { users, prospects } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { demoUsers, demoProspects } from "./demo-data";

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
        role: user.username === 'admin' ? 'admin' : 'agent'
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

    console.log(`🎉 Demo data initialized successfully!`);
    console.log(`📊 Created ${createdUsers.length} users and ${demoProspects.length} prospects`);
    console.log(`🔑 Demo login credentials:`);
    console.log(`   Admin: admin / demo123`);
    console.log(`   Agent 1: agent1 / demo123`);
    console.log(`   Agent 2: agent2 / demo123`);

  } catch (error) {
    console.error("❌ Error initializing demo data:", error);
    throw error;
  }
}