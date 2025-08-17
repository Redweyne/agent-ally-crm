// Prospect scoring algorithm for agent CRM
import type { Prospect } from "@shared/schema";

export function calculateProspectScore(prospect: Partial<Prospect>): number {
  let score = 30; // Base score

  // Status scoring (most important factor)
  switch (prospect.statut) {
    case 'Mandat signé':
    case 'Gagné':
      score += 40; // Very high
      break;
    case 'Mandate Pending':
    case 'RDV fixé':
      score += 30; // High opportunity
      break;
    case 'Qualifié':
    case 'Contacté':
      score += 20; // Medium opportunity
      break;
    case 'Nouveau':
      score += 10; // New lead
      break;
    default:
      score += 5;
  }

  // Hot lead bonus
  if (prospect.isHotLead) {
    score += 25;
  }

  // Exclusivity bonus (shows serious intent)
  if (prospect.exclusif) {
    score += 15;
  }

  // Budget/Price estimation scoring
  const value = prospect.budget || prospect.prixEstime || 0;
  if (value > 800000) {
    score += 20; // High value property
  } else if (value > 500000) {
    score += 15;
  } else if (value > 300000) {
    score += 10;
  } else if (value > 100000) {
    score += 5;
  }

  // Timeline urgency scoring
  switch (prospect.timeline) {
    case 'urgent':
    case '1 mois':
    case 'moins de 3 mois':
      score += 15; // Urgent timeline
      break;
    case '2 mois':
    case '3 mois':
      score += 10;
      break;
    case '6 mois':
      score += 5;
      break;
  }

  // Recent contact scoring
  if (prospect.dernierContact) {
    const daysSinceContact = Math.floor((Date.now() - new Date(prospect.dernierContact).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceContact <= 1) {
      score += 10; // Very recent contact
    } else if (daysSinceContact <= 3) {
      score += 7;
    } else if (daysSinceContact <= 7) {
      score += 5;
    } else if (daysSinceContact > 30) {
      score -= 10; // Old contact, needs follow-up
    }
  }

  // Source quality scoring
  switch (prospect.source) {
    case 'Recommandation':
      score += 15; // Best source
      break;
    case 'Site web':
      score += 10; // Direct interest
      break;
    case 'Google Ads':
    case 'Facebook Ads':
      score += 8; // Paid but targeted
      break;
    case 'Le Bon Coin':
      score += 5;
      break;
    case 'Porte à porte':
      score += 12; // High effort, potentially high reward
      break;
  }

  // Consent bonus (RGPD compliance)
  if (prospect.consentement) {
    score += 5;
  }

  // Commission rate factor (higher rate = more motivated agent)
  if (prospect.tauxHonoraires) {
    if (prospect.tauxHonoraires >= 0.05) {
      score += 10; // High commission
    } else if (prospect.tauxHonoraires >= 0.04) {
      score += 7;
    } else if (prospect.tauxHonoraires >= 0.03) {
      score += 5;
    }
  }

  // Ensure score stays within reasonable bounds (0-100)
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function updateAllProspectScores() {
  console.log("🔢 Updating prospect scores with realistic algorithm...");
  
  const { db } = await import("./db");
  const { prospects } = await import("@shared/schema");
  
  // Get all prospects
  const allProspects = await db.select().from(prospects);
  
  console.log(`📊 Found ${allProspects.length} prospects to update`);
  
  for (const prospect of allProspects) {
    const newScore = calculateProspectScore(prospect);
    
    if (newScore !== prospect.score) {
      await db.update(prospects)
        .set({ score: newScore })
        .where({ id: prospect.id } as any);
      
      console.log(`✅ Updated ${prospect.nomComplet}: ${prospect.score} → ${newScore}`);
    }
  }
  
  console.log("🎯 Prospect scoring update completed!");
}