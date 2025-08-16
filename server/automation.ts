import { storage } from "./storage";
import { db } from "./db";
import { rules, leads, interactions } from "@shared/schema";
import { eq, and, lt, sql } from "drizzle-orm";

export interface AutomationJob {
  id: string;
  ruleId: string;
  leadId: string;
  action: string;
  payload: any;
  scheduledFor: Date;
  completedAt?: Date;
  sentAt?: Date;
}

class AutomationRunner {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("🤖 Automation runner started");
    
    // Run every 5 minutes to avoid spam
    this.interval = setInterval(() => {
      this.processJobs().catch(console.error);
    }, 5 * 60000);
    
    // Run immediately
    this.processJobs().catch(console.error);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log("🛑 Automation runner stopped");
  }

  async processJobs() {
    try {
      console.log("🔄 Processing automation jobs...");
      
      // Get active rules
      const activeRules = await db.select().from(rules).where(eq(rules.isActive, true));
      
      for (const rule of activeRules) {
        await this.processRule(rule);
      }
      
      console.log(`✅ Processed ${activeRules.length} automation rules`);
    } catch (error) {
      console.error("❌ Error processing automation jobs:", error);
    }
  }

  private async processRule(rule: any) {
    try {
      switch (rule.trigger) {
        case "outcome:no_answer":
          await this.processNoAnswerTrigger(rule);
          break;
        case "outcome:voicemail":
          await this.processVoicemailTrigger(rule);
          break;
        case "status:booked":
          await this.processBookedTrigger(rule);
          break;
        case "delivery:uncontacted_24h":
          await this.processUncontactedDeliveryTrigger(rule);
          break;
        case "lead:idle_7d":
          await this.processIdleLeadTrigger(rule);
          break;
      }
    } catch (error) {
      console.error(`❌ Error processing rule ${rule.name}:`, error);
    }
  }

  private async processNoAnswerTrigger(rule: any) {
    // Find recent interactions with no_answer outcome
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const noAnswerInteractions = await db.select()
      .from(interactions)
      .where(and(
        eq(interactions.outcome, "no_answer"),
        lt(interactions.timestamp, cutoffTime)
      ));

    for (const interaction of noAnswerInteractions) {
      if (interaction.leadId) {
        await this.executeAction(rule, interaction.leadId, {
          type: "send_sms",
          template: "A",
          followUpDays: 2
        });
      }
    }
  }

  private async processVoicemailTrigger(rule: any) {
    // Find recent interactions with voicemail outcome
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000);
    const voicemailInteractions = await db.select()
      .from(interactions)
      .where(and(
        eq(interactions.outcome, "voicemail"),
        lt(interactions.timestamp, cutoffTime)
      ));

    for (const interaction of voicemailInteractions) {
      if (interaction.leadId) {
        await this.executeAction(rule, interaction.leadId, {
          type: "send_sms",
          template: "B",
          followUpDays: 1
        });
      }
    }
  }

  private async processBookedTrigger(rule: any) {
    // Find booked leads that haven't received confirmation SMS yet
    const bookedLeads = await db.select()
      .from(leads)
      .where(eq(leads.statut, "Booked"));

    for (const lead of bookedLeads) {
      // Check if we already sent confirmation SMS for this booking
      const existingConfirmations = await db.select()
        .from(interactions)
        .where(and(
          eq(interactions.leadId, lead.id),
          eq(interactions.kind, "sms"),
          eq(interactions.direction, "outbound"),
          sql`${interactions.summary} LIKE '%confirmation%confirmé%'`
        ));

      // Only send confirmation if none exists
      if (existingConfirmations.length === 0) {
        await this.executeAction(rule, lead.id, {
          type: "send_confirmation_sms",
          scheduleReminders: true
        });
      }
    }
  }

  private async processUncontactedDeliveryTrigger(rule: any) {
    // Find deliveries older than 24h with no contact
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // This would need to join with deliveries table
    console.log("📦 Checking uncontacted deliveries...");
  }

  private async processIdleLeadTrigger(rule: any) {
    // Find leads with no contact in 7+ days
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const idleLeads = await db.select()
      .from(leads)
      .where(and(
        eq(leads.statut, "New"),
        lt(leads.createdAt, cutoffTime)
      ));

    for (const lead of idleLeads) {
      await this.executeAction(rule, lead.id, {
        type: "notify_operator",
        message: `Lead ${lead.nomComplet} has been idle for 7+ days`
      });
    }
  }

  private async executeAction(rule: any, leadId: string, actionData: any) {
    try {
      console.log(`🎯 Executing action for rule ${rule.name} on lead ${leadId}`);
      
      switch (actionData.type) {
        case "send_sms":
          await this.sendSMS(leadId, actionData.template);
          if (actionData.followUpDays) {
            await this.createFollowUpTask(leadId, actionData.followUpDays);
          }
          break;
          
        case "send_confirmation_sms":
          await this.sendConfirmationSMS(leadId);
          if (actionData.scheduleReminders) {
            await this.scheduleReminders(leadId);
          }
          break;
          
        case "notify_operator":
          await this.notifyOperator(leadId, actionData.message);
          break;
          
        case "create_task":
          await this.createFollowUpTask(leadId, actionData.days);
          break;
      }
      
      // Mark rule as executed (simplified - would track individual executions)
      console.log(`✅ Executed action ${actionData.type} for lead ${leadId}`);
      
    } catch (error) {
      console.error(`❌ Failed to execute action for lead ${leadId}:`, error);
    }
  }

  private async sendSMS(leadId: string, template: string) {
    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.badNumber || lead.dnc) {
      console.log(`📵 Skipping SMS for lead ${leadId} - blocked contact`);
      return;
    }

    const templates: Record<string, string> = {
      A: `Bonjour ${lead.nomComplet}, nous n'avons pas pu vous joindre. Pouvez-vous nous rappeler au XXX-XXX-XXXX ? Merci.`,
      B: `Bonjour ${lead.nomComplet}, nous avons laissé un message vocal. Merci de nous rappeler au XXX-XXX-XXXX.`,
      confirm: `Bonjour ${lead.nomComplet}, votre rendez-vous est confirmé. Nous vous enverrons un rappel 24h et 1h avant.`
    };

    const message = templates[template] || templates.A;
    
    // Simulate SMS sending (in real implementation, integrate with SMS provider)
    console.log(`📱 SMS sent to ${lead.telephone}: ${message}`);
    
    // Create interaction record using the lead owner's ID for automated actions
    if (lead.ownerUserId) {
      await storage.createInteraction({
        leadId,
        kind: "sms",
        direction: "outbound",
        summary: `Automated SMS (template ${template})`,
        userId: lead.ownerUserId
      });
    }
  }

  private async sendConfirmationSMS(leadId: string) {
    await this.sendSMS(leadId, "confirm");
  }

  private async scheduleReminders(leadId: string) {
    console.log(`⏰ Scheduling appointment reminders for lead ${leadId}`);
    // In real implementation, would schedule actual reminder jobs
  }

  private async createFollowUpTask(leadId: string, days: number) {
    const followUpDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await storage.updateLead(leadId, {
      prochaineAction: followUpDate,
      statut: "Follow-up"
    });
    console.log(`📅 Created follow-up task for lead ${leadId} in ${days} days`);
  }

  private async notifyOperator(leadId: string, message: string) {
    console.log(`🔔 Operator notification: ${message}`);
    // In real implementation, would send notification via email/slack/etc
  }
}

export const automationRunner = new AutomationRunner();

// Initialize default automation rules if they don't exist
export async function initializeDefaultRules() {
  try {
    const existingRules = await storage.getRules();
    
    if (existingRules.length === 0) {
      console.log("🔧 Creating default automation rules...");
      
      const defaultRules = [
        {
          name: "No Answer Follow-up",
          trigger: "outcome:no_answer",
          action: "send_sms:A,create_task:2d",
          payload: { template: "A", followUpDays: 2 },
          isActive: true
        },
        {
          name: "Voicemail Follow-up", 
          trigger: "outcome:voicemail",
          action: "send_sms:B,create_task:1d",
          payload: { template: "B", followUpDays: 1 },
          isActive: true
        },
        {
          name: "Booking Confirmation",
          trigger: "status:booked", 
          action: "send_confirmation_sms,schedule_reminders",
          payload: { scheduleReminders: true },
          isActive: true
        },
        {
          name: "Uncontacted Lead Alert",
          trigger: "lead:idle_7d",
          action: "notify_operator",
          payload: { notifyAfterDays: 7 },
          isActive: true
        },
        {
          name: "Delivery Reminder",
          trigger: "delivery:uncontacted_24h",
          action: "notify_operator",
          payload: { notifyAfterHours: 24 },
          isActive: false
        }
      ];

      for (const rule of defaultRules) {
        await storage.createRule(rule);
      }
      
      console.log("✅ Default automation rules created");
    }
  } catch (error) {
    console.error("❌ Error initializing default rules:", error);
  }
}