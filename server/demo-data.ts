import { nanoid } from "nanoid";
import type { InsertUser, InsertProspect } from "@shared/schema";

// Demo users
export const demoUsers: InsertUser[] = [
  {
    username: "admin",
    password: "demo123", // This will be hashed when inserted
    name: "Marie Dubois",
    email: "marie@redweyne.fr"
  },
  {
    username: "agent1",
    password: "demo123",
    name: "Pierre Martin",
    email: "pierre@redweyne.fr"
  },
  {
    username: "agent2", 
    password: "demo123",
    name: "Sophie Laurent",
    email: "sophie@redweyne.fr"
  }
];

// Demo prospects with realistic data
export const demoProspects: (Omit<InsertProspect, 'agentId'> & { 
  prochaineAction?: Date;
  dernierContact?: Date;
})[] = [
  {
    id: nanoid(),
    nomComplet: "Jean Dupont",
    telephone: "06 12 34 56 78",
    email: "jean.dupont@email.fr",
    type: "Vendeur",
    ville: "Paris 15ème",
    typeBien: "Appartement",
    budget: 0,
    prixEstime: 450000,
    tauxHonoraires: 0.04,
    exclusif: true,
    motivation: "Déménagement professionnel",
    timeline: "2 mois",
    intention: "Vente rapide",
    source: "Site web",
    exactSource: "Google Ads - Estimation gratuite",
    consentement: true,
    statut: "Qualifié",
    adresse: "12 rue de la Convention, 75015 Paris",
    notes: "Client motivé, bien situé, exclusivité signée",
    score: 85,
    agentOutcome: "in_negotiation",
    leadCost: 45,
    estimatedClosingDays: 60,
    prochaineAction: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    dernierContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    id: nanoid(),
    nomComplet: "Marie Leroy",
    telephone: "06 98 76 54 32",
    email: "marie.leroy@email.fr",
    type: "Acheteur",
    ville: "Neuilly-sur-Seine",
    typeBien: "Maison",
    budget: 800000,
    prixEstime: 0,
    tauxHonoraires: 0.03,
    exclusif: false,
    motivation: "Agrandissement familial",
    timeline: "6 mois",
    intention: "Recherche active",
    source: "Recommandation",
    exactSource: "Client référent - Jean Dupont",
    consentement: true,
    statut: "RDV fixé",
    adresse: "",
    notes: "Famille avec 2 enfants, recherche jardin",
    score: 75,
    agentOutcome: "signed",
    leadCost: 0,
    estimatedClosingDays: 90,
    prochaineAction: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
    dernierContact: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Yesterday
  },
  {
    id: nanoid(),
    nomComplet: "Thomas Bernard",
    telephone: "06 45 67 89 12",
    email: "thomas.bernard@email.fr",
    type: "Vendeur",
    ville: "Boulogne-Billancourt",
    typeBien: "Studio",
    budget: 0,
    prixEstime: 280000,
    tauxHonoraires: 0.05,
    exclusif: false,
    motivation: "Investissement locatif",
    timeline: "1 mois",
    intention: "Vente urgente",
    source: "Facebook Ads",
    exactSource: "Facebook Ads - Estimation rapide studio",
    consentement: true,
    statut: "Mandate Pending",
    adresse: "8 avenue du Général Leclerc, 92100 Boulogne",
    notes: "Investisseur, plusieurs biens, urgent",
    score: 92,
    agentOutcome: "in_negotiation",
    leadCost: 25,
    estimatedClosingDays: 30,
    prochaineAction: new Date(), // Today
    dernierContact: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
  },
  {
    id: nanoid(),
    nomComplet: "Claire Moreau",
    telephone: "06 11 22 33 44",
    email: "claire.moreau@email.fr",
    type: "Acheteur",
    ville: "Vincennes",
    typeBien: "Appartement",
    budget: 550000,
    prixEstime: 0,
    tauxHonoraires: 0.03,
    exclusif: true,
    motivation: "Premier achat",
    timeline: "3 mois",
    intention: "Recherche méthodique",
    source: "Le Bon Coin",
    exactSource: "Le Bon Coin - Annonce appartement Vincennes",
    consentement: true,
    statut: "Contacté",
    adresse: "",
    notes: "Primo-accédante, dossier solide, patient",
    score: 68,
    leadCost: 12,
    estimatedClosingDays: 120,
    prochaineAction: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    dernierContact: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  {
    id: nanoid(),
    nomComplet: "Philippe Durand",
    telephone: "06 55 44 33 22",
    email: "philippe.durand@email.fr",
    type: "Vendeur",
    ville: "Saint-Cloud",
    typeBien: "Maison",
    budget: 0,
    prixEstime: 1200000,
    tauxHonoraires: 0.035,
    exclusif: true,
    motivation: "Succession",
    timeline: "6 mois",
    intention: "Vente optimisée",
    source: "Porte à porte",
    exactSource: "Prospection secteur - Saint-Cloud centre",
    consentement: true,
    statut: "Mandat signé",
    adresse: "15 rue de la Paix, 92210 Saint-Cloud",
    notes: "Belle maison familiale, travaux à prévoir",
    score: 78,
    agentOutcome: "signed",
    leadCost: 0,
    estimatedClosingDays: 180,
    prochaineAction: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    dernierContact: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Yesterday
  },
  {
    id: nanoid(),
    nomComplet: "Isabelle Petit",
    telephone: "06 77 88 99 00",
    email: "isabelle.petit@email.fr",
    type: "Acheteur",
    ville: "Levallois-Perret",
    typeBien: "Appartement",
    budget: 420000,
    prixEstime: 0,
    tauxHonoraires: 0.03,
    exclusif: false,
    motivation: "Rapprochement travail",
    timeline: "urgent",
    intention: "Achat rapide",
    source: "Site web",
    exactSource: "Google Search - Agence Levallois",
    consentement: true,
    statut: "Gagné",
    adresse: "",
    notes: "Achat finalisé - très satisfaite du service",
    score: 95,
    agentOutcome: "signed",
    leadCost: 35,
    estimatedClosingDays: 45,
    dernierContact: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
  }
];