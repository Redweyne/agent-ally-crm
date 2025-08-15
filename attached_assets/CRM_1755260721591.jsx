import React, { useEffect, useMemo, useState } from "react";
import {
  Phone, MessageSquare, Calendar, CheckCircle2, XCircle, Download, Upload, Filter, User, Plus,
  Clock, Mail, MapPin, Euro, Home, Building2, Trash2, Search, Star, ShieldCheck, AlertTriangle,
  BarChart3, Crown, FileText, Info as InfoIcon
} from "lucide-react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";

/* ------------------------------------------------------------
   CRM Redweyne — Version 100% FR + Boost Mandataires
   - Noms FR (fonctions, variables, composants)
   - KPI mandataire (SLA, valeur pipeline €, exclusivités, RDV 7j)
   - Onglet "Opportunités" (valeur attendue, RDV imminent)
   - Score mandataire
   - Export CSV + Export PDF
   - Création RDV .ICS
   - Scripts + Paramètres + RGPD + Tutoriel
------------------------------------------------------------ */

/* ====== Constantes ====== */
const STATUTS = [
  "Nouveau",
  "Contacté",
  "Qualifié",
  "RDV fixé",
  "Mandat signé",
  "Gagné",
  "Perdu",
  "Pas de réponse",
];

const PROBA_PAR_STATUT = {
  "Nouveau": 0.05,
  "Contacté": 0.1,
  "Qualifié": 0.25,
  "RDV fixé": 0.5,
  "Mandat signé": 0.9,
  "Gagné": 1,
  "Perdu": 0,
  "Pas de réponse": 0.02,
};

const RELANCE_PAR_DEFAUT = [2, 5, 10]; // jours (J+2, J+5, J+10)
const SEUIL_VALEUR_EUR = 3000; // seuil "Opportunités"

/* ====== Données exemple ====== */
const AGENTS_EXEMPLE = [
  { id: "rwd", nom: "Redweyne (Global)", email: "redweyne@crm.local", telephone: "+33 6 00 00 00 00" },
  { id: "ag1", nom: "Alice Martin", email: "alice.martin@agence.fr", telephone: "+33 6 11 22 33 44" },
  { id: "ag2", nom: "Benjamin Leroy", email: "ben.leroy@agence.fr", telephone: "+33 6 55 66 77 88" },
];

const PROSPECTS_EXEMPLE = [
  {
    id: "P-1001",
    creeLe: new Date().toISOString(),
    nomComplet: "Sophie Bernard",
    telephone: "+33 6 12 34 56 78",
    email: "sophie.bernard@example.com",
    type: "Vendeur",
    ville: "Nantes",
    typeBien: "Appartement",
    budget: 0,
    prixEstime: 320000,
    tauxHonoraires: 0.04,
    exclusif: false,
    motivation: "Déménagement professionnel en septembre",
    timeline: "< 3 mois",
    intention: "Estimation + mise en vente",
    source: "Campagne Meta - Form Lead",
    consentement: true,
    statut: "Qualifié",
    dernierContact: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    prochaineAction: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    agentId: "ag1",
    adresse: "Île de Nantes",
    notes: "Très réactive, préfère appel le midi.",
  },
  {
    id: "P-1002",
    creeLe: new Date().toISOString(),
    nomComplet: "Karim Haddad",
    telephone: "+33 7 98 76 54 32",
    email: "karim.haddad@example.com",
    type: "Acheteur",
    ville: "Rezé",
    typeBien: "Maison",
    budget: 450000,
    prixEstime: 0,
    tauxHonoraires: 0.03,
    exclusif: false,
    motivation: "Nouveau bébé, besoin d'une chambre en plus",
    timeline: "3–6 mois",
    intention: "Recherche + alerte",
    source: "Google Ads - Landing",
    consentement: true,
    statut: "Contacté",
    dernierContact: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    prochaineAction: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    agentId: "ag2",
    adresse: "Rezé centre",
    notes: "Ok pour visio.",
  },
  {
    id: "P-1003",
    creeLe: new Date().toISOString(),
    nomComplet: "Claire Dupuis",
    telephone: "+33 6 22 33 44 55",
    email: "",
    type: "Vendeur",
    ville: "Saint-Herblain",
    typeBien: "Maison",
    budget: 0,
    prixEstime: 380000,
    tauxHonoraires: 0.05,
    exclusif: true,
    motivation: "Succession, souhaite vendre discrètement",
    timeline: "< 1 mois",
    intention: "Estimation rapide",
    source: "Référent - Notaire",
    consentement: false,
    statut: "Nouveau",
    dernierContact: null,
    prochaineAction: null,
    agentId: "rwd",
    adresse: "",
    notes: "Ne pas laisser de message vocal.",
  },
];

/* ====== Utilitaires ====== */
const fmtNombre = new Intl.NumberFormat("fr-FR");
const fmtMonnaie = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v || 0);

const joursRestants = (iso) => {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const normaliserTelephone = (p) => (p || "").replace(/\s|\+|-/g, "");
const cx = (...cls) => cls.filter(Boolean).join(" ");

const CLES_STOCKAGE = {
  prospects: "rw_crm_prospects_fr",
  agents: "rw_crm_agents_fr",
  relance: "rw_crm_relance_fr",
  onboarding: "rw_crm_onboarding_done",
};

function chargerLS(cle, defautVal) {
  try { const v = localStorage.getItem(cle); return v ? JSON.parse(v) : defautVal; } catch { return defautVal; }
}
function sauverLS(cle, valeur) {
  try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch {}
}

/* ====== Liens (Téléphone/SMS/WhatsApp) ====== */
function lienTel(tel) { return tel ? `tel:${String(tel).replace(/\s+/g, "")}` : "#"; }
function lienSMS(tel, texte = "Bonjour, c’est Redweyne. Comme convenu je vous contacte…") {
  return tel ? `sms:${String(tel).replace(/\s+/g, "")}?&body=${encodeURIComponent(texte)}` : "#";
}
function lienWA(tel, texte = "Bonjour !") {
  return tel ? `https://wa.me/${String(tel).replace(/\s|\+|-/g, "")}?text=${encodeURIComponent(texte)}` : "#";
}

/* ====== Scoring & Valeur attendue ====== */
function scoreMandataire(prospect) {
  let score = 50;
  if (prospect.type === "Vendeur") score += 10;
  if (prospect.timeline?.includes("<")) score += 10;
  if (prospect.motivation?.length > 20) score += 5;
  if (prospect.consentement) score += 5;
  if (prospect.statut === "RDV fixé") score += 8;
  if (prospect.statut === "Mandat signé") score += 15;
  if (prospect.statut === "Gagné") score += 10;
  if (prospect.statut === "Perdu" || prospect.statut === "Pas de réponse") score -= 15;
  score += clamp(Math.floor((prospect.budget || 0) / 100000), 0, 10);
  return clamp(score, 0, 100);
}

function valeurAttendueEUR(prospect) {
  const prix = Number(prospect.prixEstime || 0);
  const taux = Number(prospect.tauxHonoraires || 0);
  const proba = PROBA_PAR_STATUT[prospect.statut] ?? 0;
  return prix * taux * proba * (prospect.exclusif ? 1.1 : 1);
}

/* ====== Export CSV / Import CSV ====== */
function exporterCSV(prospects) {
  const entetes = [
    "id","creeLe","nomComplet","telephone","email","type","ville","typeBien","budget",
    "prixEstime","tauxHonoraires","exclusif","motivation","timeline","intention","source",
    "consentement","statut","dernierContact","prochaineAction","agentId","score","adresse","notes"
  ];
  const ech = (v) => (v == null ? "" : String(v).replaceAll('"', '""'));
  const lignes = prospects.map(p => entetes.map(h => `"${ech(p[h])}"`).join(",")).join("\n");
  const csv = entetes.join(",") + "\n" + lignes;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `redweyne_prospects_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
}

function importerCSV(fichier, setProspects) {
  const reader = new FileReader();
  reader.onload = () => {
    const texte = reader.result; const [ligneEntete, ...rows] = texte.split(/\r?\n/).filter(Boolean);
    const entetes = ligneEntete.split(",").map(h => h.replaceAll('"', "").trim());
    const parsed = rows.map(ligne => {
      const cells = ligne.match(/\"([^\"]*)\"(?=,|$)/g)?.map(s => s.replaceAll('"', "")) || ligne.split(",");
      const o = {}; entetes.forEach((h, i) => (o[h] = cells[i] || ""));
      o.budget = Number(o.budget || 0);
      o.prixEstime = Number(o.prixEstime || 0);
      o.tauxHonoraires = Number(o.tauxHonoraires || 0.04);
      o.exclusif = String(o.exclusif).toLowerCase() === "true" || String(o.exclusif).toLowerCase() === "oui";
      o.consentement = String(o.consentement).toLowerCase() === "true" || String(o.consentement).toLowerCase() === "oui";
      o.score = scoreMandataire(o);
      return o;
    });
    setProspects(prev => [...parsed, ...prev]);
  };
  reader.readAsText(fichier);
}

/* ====== Export PDF ====== */
function exporterPDF(kpi, prospects) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Rapport CRM – Redweyne", 14, 18);

  doc.setFontSize(12);
  const y0 = 36;
  doc.text(`SLA moyen : ${kpi.slaMoyenMin || 0} min`, 14, y0);
  doc.text(`Valeur pipeline : ${fmtMonnaie(kpi.valeurPipeline || 0)}`, 14, y0 + 8);
  doc.text(`Exclusivités : ${kpi.nbExclusifs || 0}`, 14, y0 + 16);
  doc.text(`RDV (7 jours) : ${kpi.rdv7 || 0}`, 14, y0 + 24);

  doc.text("Top 10 prospects par valeur :", 14, y0 + 40);
  const top = [...prospects].sort((a,b)=>valeurAttendueEUR(b)-valeurAttendueEUR(a)).slice(0,10);
  top.forEach((p,i)=>{
    doc.text(`${i+1}. ${p.nomComplet || "Sans nom"} — ${fmtMonnaie(valeurAttendueEUR(p))}`, 14, y0 + 50 + i*7);
  });

  doc.save("rapport_redweyne.pdf");
}

/* ====== Création RDV .ICS ====== */
function genererICS({ titre, description, debut, fin, lieu }) {
  const dt = (d) => new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Redweyne CRM//FR","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
    `UID:${(typeof crypto!=="undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`,
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dt(debut)}`,
    `DTEND:${dt(fin || new Date(new Date(debut).getTime() + 30*60*1000))}`,
    `SUMMARY:${titre}`,
    `DESCRIPTION:${(description || "").replaceAll(/\n/g, "\\n")}`,
    `LOCATION:${lieu || ""}`,
    "END:VEVENT","END:VCALENDAR",
  ].join("\n");
}

function creerRDVICS(prospect) {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const ics = genererICS({
    titre: `RDV — ${prospect.nomComplet || "Prospect"}`,
    description: `Téléphone: ${prospect.telephone}\nIntention: ${prospect.intention}\nNotes: ${prospect.notes || ""}`,
    debut: start,
    fin: new Date(start.getTime() + 30 * 60 * 1000),
    lieu: prospect.adresse || prospect.ville || "Téléphone",
  });
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `RDV_${prospect.id}.ics`; a.click(); URL.revokeObjectURL(url);
}

/* ====== Composant principal ====== */
export default function CRMRedweyneFrancais() {
  // États
  const [agents, setAgents] = useState(() => chargerLS(CLES_STOCKAGE.agents, AGENTS_EXEMPLE));
  const [agentSelectionneId, setAgentSelectionneId] = useState(agents[0]?.id || "rwd");

  const [prospects, setProspects] = useState(() => {
    const enCache = chargerLS(CLES_STOCKAGE.prospects, null);
    if (enCache && Array.isArray(enCache) && enCache.length) {
      return enCache.map(p => ({ ...p, score: scoreMandataire(p) }));
    }
    const seed = PROSPECTS_EXEMPLE.map(p => ({ ...p, score: scoreMandataire(p) }));
    sauverLS(CLES_STOCKAGE.prospects, seed);
    return seed;
  });

  const [relance, setRelance] = useState(() => chargerLS(CLES_STOCKAGE.relance, RELANCE_PAR_DEFAUT));
  const [recherche, setRecherche] = useState("");
  const [ongletActif, setOngletActif] = useState("Tableau Agent"); // "Opportunités" / "Pipeline" / "Prospects" / "Scripts" / "Paramètres"
  const [prospectOuvert, setProspectOuvert] = useState(null);
  const [filtreType, setFiltreType] = useState("Tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");

  // Tutoriel
  const [afficherTutoriel, setAfficherTutoriel] = useState(() => !localStorage.getItem(CLES_STOCKAGE.onboarding));
  const [etapeTutoriel, setEtapeTutoriel] = useState(0);
  const etapes = [
    { titre: "Bienvenue", texte: "Voici ton CRM 100% français. On va faire un tour rapide." },
    { titre: "Tableau Agent", texte: "Suis tes KPI utiles : SLA, valeur pipeline, exclusivités, RDV semaine." },
    { titre: "Opportunités", texte: "Retrouve les prospects à forte valeur et agis en priorité." },
    { titre: "Pipeline", texte: "Avance les statuts en vue Kanban." },
    { titre: "Prospects", texte: "Filtre, recherche, exporte et importe tes contacts." },
  ];
  function terminerTutoriel() {
    localStorage.setItem(CLES_STOCKAGE.onboarding, "1");
    setAfficherTutoriel(false);
  }

  // Persistance
  useEffect(() => sauverLS(CLES_STOCKAGE.prospects, prospects), [prospects]);
  useEffect(() => sauverLS(CLES_STOCKAGE.agents, agents), [agents]);
  useEffect(() => sauverLS(CLES_STOCKAGE.relance, relance), [relance]);

  // Doublons (téléphone)
  const doublonsTel = useMemo(() => {
    const map = new Map();
    prospects.forEach(p => {
      const k = normaliserTelephone(p.telephone);
      if (!k) return;
      map.set(k, (map.get(k) || 0) + 1);
    });
    return map;
  }, [prospects]);

  // Filtrage / recherche
  const prospectsFiltres = useMemo(() => {
    return prospects
      .filter(p => agentSelectionneId === "rwd" ? true : p.agentId === agentSelectionneId)
      .filter(p => (filtreType === "Tous" ? true : p.type === filtreType))
      .filter(p => (filtreStatut === "Tous" ? true : p.statut === filtreStatut))
      .filter(p => {
        const q = recherche.trim().toLowerCase();
        if (!q) return true;
        return [p.nomComplet, p.telephone, p.ville, p.typeBien, p.intention, p.motivation, p.notes]
          .filter(Boolean)
          .some(v => v.toLowerCase().includes(q));
      });
  }, [prospects, recherche, agentSelectionneId, filtreType, filtreStatut]);

  // KPI (Tableau Agent)
  const kpi = useMemo(() => {
    const ajdStr = new Date().toDateString();
    const nbAjd = prospects.filter(p => new Date(p.creeLe).toDateString() === ajdStr).length;
    const nbRDV = prospects.filter(p => p.statut === "RDV fixé").length;
    const nbGagnes = prospects.filter(p => p.statut === "Gagné").length;
    const tauxConv = prospects.length ? Math.round((nbGagnes / prospects.length) * 100) : 0;

    const prospectsAgent = prospects.filter(p => agentSelectionneId === "rwd" ? true : p.agentId === agentSelectionneId);
    const reponses = prospectsAgent
      .filter(p => p.dernierContact)
      .map(p => new Date(p.dernierContact).getTime() - new Date(p.creeLe).getTime())
      .filter(v => v > 0);
    const slaMoyenMin = reponses.length ? Math.round(reponses.reduce((a,b) => a + b, 0) / reponses.length / 60000) : 0;

    const valeurPipeline = prospectsAgent
      .filter(p => ["Qualifié", "RDV fixé", "Mandat signé", "Gagné"].includes(p.statut))
      .reduce((s, p) => s + valeurAttendueEUR(p), 0);

    const nbExclusifs = prospectsAgent.filter(p => p.exclusif).length;

    const dans7j = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const rdv7 = prospectsAgent.filter(p => p.prochaineAction && new Date(p.prochaineAction).getTime() <= dans7j && p.statut === "RDV fixé").length;

    return { nbAjd, nbRDV, nbGagnes, tauxConv, slaMoyenMin, valeurPipeline, nbExclusifs, rdv7 };
  }, [prospects, agentSelectionneId]);

  // Graph activité 7 jours (snapshot simple)
  const donneesGraph = useMemo(() => {
    const jours = [...Array(7)].map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString("fr-FR", { weekday: "short" });
      const crees = prospects.filter(p => new Date(p.creeLe).toDateString() === d.toDateString()).length;
      const contactes = prospects.filter(p => p.statut === "Contacté").length;
      const rdv = prospects.filter(p => p.statut === "RDV fixé").length;
      return { name: label, "Créés": crees, "Contactés": contactes, "RDV": rdv };
    });
    return jours;
  }, [prospects]);

  // Sélections onglets
  const opportunites = useMemo(() => {
    const dans3j = Date.now() + 3 * 24 * 60 * 60 * 1000;
    return prospectsFiltres
      .map(p => ({ ...p, valeur: valeurAttendueEUR(p) }))
      .filter(p =>
        p.valeur >= SEUIL_VALEUR_EUR ||
        (p.prochaineAction && new Date(p.prochaineAction).getTime() <= dans3j) ||
        ["RDV fixé", "Mandat signé"].includes(p.statut)
      )
      .sort((a, b) => b.valeur - a.valeur || b.score - a.score);
  }, [prospectsFiltres]);

  const colonnesPipeline = useMemo(() => {
    const m = {}; STATUTS.forEach(s => (m[s] = []));
    prospectsFiltres.forEach(p => m[p.statut]?.push(p));
    return m;
  }, [prospectsFiltres]);

  /* ====== Mutations ====== */
  function mettreAJourProspect(id, patch) {
    setProspects(prev => prev.map(p => (p.id === id ? { ...p, ...patch, score: scoreMandataire({ ...p, ...patch }) } : p)));
  }

  function ajouterProspect() {
    const nid = `P-${Math.floor(Math.random() * 9000 + 1000)}`;
    const vierge = {
      id: nid, creeLe: new Date().toISOString(), nomComplet: "", telephone: "", email: "",
      type: "Vendeur", ville: "", typeBien: "Appartement", budget: 0,
      prixEstime: 0, tauxHonoraires: 0.04, exclusif: false,
      motivation: "", timeline: "3–6 mois", intention: "", source: "Ajout manuel",
      consentement: false, statut: "Nouveau", dernierContact: null, prochaineAction: null,
      agentId: agentSelectionneId, adresse: "", notes: "", score: 50,
    };
    setProspects([vierge, ...prospects]); setProspectOuvert(vierge);
  }

  function supprimerProspect(id) {
    setProspects(prev => prev.filter(p => p.id !== id));
    if (prospectOuvert?.id === id) setProspectOuvert(null);
  }

  function deplacerStatut(prospect, direction = 1) {
    const i = STATUTS.indexOf(prospect.statut);
    const n = clamp(i + direction, 0, STATUTS.length - 1);
    mettreAJourProspect(prospect.id, { statut: STATUTS[n] });
  }

  /* ====== UI ====== */
  const agentActif = agents.find(a => a.id === agentSelectionneId) || agents[0];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* En-tête */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-neutral-900 text-white grid place-items-center font-bold">RW</div>
            <div>
              <div className="font-semibold leading-tight">Redweyne CRM — Leads Immobiliers</div>
              <div className="text-xs text-neutral-500">Bonus d’inscription • Simple, rapide, orienté mandat</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-3 py-2">
              <User className="w-4 h-4 text-neutral-500"/>
              <select
                value={agentSelectionneId}
                onChange={e => setAgentSelectionneId(e.target.value)}
                className="bg-transparent text-sm focus:outline-none"
              >
                {agents.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
              </select>
            </div>

            <button
              onClick={() => exporterCSV(prospects)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border text-sm"
              title="Exporter CSV"
            >
              <Download className="w-4 h-4"/> CSV
            </button>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border text-sm cursor-pointer" title="Importer CSV">
              <Upload className="w-4 h-4"/> Import
              <input type="file" accept=".csv" className="hidden" onChange={e=> e.target.files?.[0] && importerCSV(e.target.files[0], setProspects)} />
            </label>

            <button
              onClick={() => exporterPDF(kpi, prospects)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border text-sm"
              title="Exporter PDF"
            >
              <FileText className="w-4 h-4"/> PDF
            </button>

            <button
              onClick={ajouterProspect}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm"
              title="Nouveau prospect"
            >
              <Plus className="w-4 h-4"/> Nouveau
            </button>
          </div>
        </div>
      </header>

      {/* Tutoriel au premier lancement */}
      {afficherTutoriel && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl border max-w-md w-full p-5">
            <div className="flex items-center gap-2 text-neutral-600 text-sm">
              <InfoIcon className="w-4 h-4"/> Tutoriel express
            </div>
            <div className="mt-2 text-lg font-semibold">{etapes[etapeTutoriel].titre}</div>
            <div className="mt-1 text-sm text-neutral-700">{etapes[etapeTutoriel].texte}</div>
            <div className="mt-4 flex items-center justify-between">
              <button
                className="px-3 py-2 rounded-xl border text-sm"
                onClick={() => setEtapeTutoriel(Math.max(0, etapeTutoriel - 1))}
                disabled={etapeTutoriel === 0}
              >
                Précédent
              </button>
              {etapeTutoriel < etapes.length - 1 ? (
                <button
                  className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm"
                  onClick={() => setEtapeTutoriel(etapeTutoriel + 1)}
                >
                  Continuer
                </button>
              ) : (
                <button
                  className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm"
                  onClick={terminerTutoriel}
                >
                  Terminer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contenu */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* KPIs tête de page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI icone={Plus} etiquette="Leads aujourd’hui" valeur={kpi.nbAjd} sousTexte="nouveaux" aide="Nombre de prospects créés aujourd’hui."/>
          <KPI icone={Calendar} etiquette="RDV fixés" valeur={kpi.nbRDV} sousTexte="pipeline actif" aide="Prospects au statut RDV fixé."/>
          <KPI icone={CheckCircle2} etiquette="Gagnés" valeur={kpi.nbGagnes} sousTexte="mandats" aide="Nombre de mandats gagnés."/>
          <KPI icone={Star} etiquette="Taux de conv." valeur={`${kpi.tauxConv}%`} sousTexte="global" aide="(Mandats gagnés) / (Prospects totaux)."/>
        </div>

        {/* Tableau Agent (valeur) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <CarteKPI titre="SLA moyen" aide="Temps moyen entre la création du lead et le 1er contact.">
            <div className="text-2xl font-semibold mt-1">{kpi.slaMoyenMin ? `${kpi.slaMoyenMin} min` : "—"}</div>
            <div className="text-xs text-neutral-500">Temps de 1ère réponse</div>
          </CarteKPI>
          <CarteKPI titre="Valeur pipeline" aide="Somme des honoraires attendus pondérés par la probabilité.">
            <div className="text-2xl font-semibold mt-1">{fmtMonnaie(kpi.valeurPipeline)}</div>
            <div className="text-xs text-neutral-500">€ attendus (pondérés)</div>
          </CarteKPI>
          <CarteKPI titre="Exclusivités" aide="Prospects marqués en mandat exclusif.">
            <div className="text-2xl font-semibold mt-1">{kpi.nbExclusifs}</div>
            <div className="text-xs text-neutral-500">Mandats exclusifs</div>
          </CarteKPI>
          <CarteKPI titre="RDV (7j)" aide="Rendez-vous planifiés dans les 7 prochains jours.">
            <div className="text-2xl font-semibold mt-1">{kpi.rdv7}</div>
            <div className="text-xs text-neutral-500">À venir</div>
          </CarteKPI>
        </div>

        {/* Graph activité */}
        <div className="mt-6 p-4 bg-white rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Activité 7 jours</div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donneesGraph} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="Créés" />
                <Line type="monotone" dataKey="Contactés" />
                <Line type="monotone" dataKey="RDV" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Onglets */}
        <div className="mt-6 flex flex-wrap gap-2">
          {["Tableau Agent","Opportunités","Pipeline","Prospects","Scripts","Paramètres"].map(t => (
            <button key={t} onClick={()=>setOngletActif(t)} className={cx("px-3 py-2 rounded-xl text-sm border", ongletActif===t?"bg-neutral-900 text-white":"bg-white")}>{t}</button>
          ))}
        </div>

        {/* === Onglet : Opportunités === */}
        {ongletActif === "Opportunités" && (
          <section className="mt-4">
            <div className="bg-white rounded-2xl shadow-sm border p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Opportunités à forte valeur</div>
                <div className="text-xs text-neutral-500">
                  Seuil valeur: {fmtMonnaie(SEUIL_VALEUR_EUR)} • Total: {opportunites.length}
                </div>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr className="text-left">
                      <th className="p-3">Prospect</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Ville</th>
                      <th className="p-3">Bien</th>
                      <th className="p-3">Valeur attendue</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3">Prochaine action</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunites.map(p => (
                      <tr key={p.id} className="border-t hover:bg-neutral-50">
                        <td className="p-3">
                          <div className="font-medium cursor-pointer hover:underline" onClick={()=>setProspectOuvert(p)}>{p.nomComplet || "Sans nom"}</div>
                          <div className="text-xs text-neutral-500">{p.telephone || "—"}</div>
                        </td>
                        <td className="p-3">{p.type}</td>
                        <td className="p-3">{p.ville || "—"}</td>
                        <td className="p-3">{p.typeBien || "—"}</td>
                        <td className="p-3 font-medium">{fmtMonnaie(valeurAttendueEUR(p))}</td>
                        <td className="p-3">
                          <span className={cx("px-2 py-1 rounded-lg text-xs",
                            p.score>=80?"bg-green-100 text-green-700":p.score>=60?"bg-amber-100 text-amber-700":"bg-neutral-100 text-neutral-700"
                          )}>{p.score}</span>
                        </td>
                        <td className="p-3">{p.statut}</td>
                        <td className="p-3 text-xs text-neutral-600">
                          {p.prochaineAction ? `${joursRestants(p.prochaineAction)} j` : "—"}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <a className={cx("p-2 rounded-lg border", p.telephone?"":"opacity-40 pointer-events-none")} title="Appeler" href={lienTel(p.telephone)}><Phone className="w-4 h-4"/></a>
                            <a className={cx("p-2 rounded-lg border", p.telephone?"":"opacity-40 pointer-events-none")} title="SMS" href={lienSMS(p.telephone)}><MessageSquare className="w-4 h-4"/></a>
                            <button className="p-2 rounded-lg border" title="Ouvrir" onClick={()=>setProspectOuvert(p)}><FileText className="w-4 h-4"/></button>
                            <button className="p-2 rounded-lg border" title="→ Suivant" onClick={()=>deplacerStatut(p, +1)}>→</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {opportunites.length === 0 && (
                      <tr><td colSpan={9} className="p-6 text-center text-neutral-500">Aucune opportunité selon le seuil.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* === Pipeline (Kanban light) === */}
        {ongletActif === "Pipeline" && (
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATUTS.slice(0, 6).map(st => (
              <div key={st} className="bg-white rounded-2xl shadow-sm border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{st}</div>
                  <div className="text-xs text-neutral-500">{colonnesPipeline[st]?.length || 0}</div>
                </div>
                <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                  {(colonnesPipeline[st] || []).map(p => {
                    const telNorm = normaliserTelephone(p.telephone);
                    const isDupe = telNorm && (doublonsTel.get(telNorm) || 0) > 1;
                    return (
                      <div key={p.id} className="border rounded-2xl p-3 hover:shadow-sm transition bg-white">
                        <div className="flex items-center justify-between">
                          <div className="font-medium cursor-pointer hover:underline" onClick={()=>setProspectOuvert(p)}>{p.nomComplet || "Sans nom"}</div>
                          <div className="flex items-center gap-2">
                            {isDupe && <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3"/> Doublon</span>}
                            <div className="text-xs px-2 py-1 rounded-lg bg-neutral-100">{p.type}</div>
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                          <MapPin className="w-3 h-3"/> {p.ville || "—"}
                          <Building2 className="w-3 h-3"/> {p.typeBien || "—"}
                          <Euro className="w-3 h-3"/> {p.prixEstime ? fmtNombre.format(p.prixEstime) : (p.budget ? fmtNombre.format(p.budget) : "—")}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <a className={cx("px-2 py-1 rounded-lg border", p.telephone?"":"opacity-40 pointer-events-none")} href={lienTel(p.telephone)}><Phone className="w-3 h-3"/></a>
                          <a className={cx("px-2 py-1 rounded-lg border", p.telephone?"":"opacity-40 pointer-events-none")} href={lienSMS(p.telephone)}><MessageSquare className="w-3 h-3"/></a>
                          <button className="px-2 py-1 rounded-lg border" onClick={()=>deplacerStatut(p, -1)}>◀</button>
                          <button className="px-2 py-1 rounded-lg border" onClick={()=>deplacerStatut(p, +1)}>▶</button>
                          <button className="ml-auto px-2 py-1 rounded-lg border" onClick={()=>supprimerProspect(p.id)}><Trash2 className="w-3 h-3"/></button>
                        </div>
                        <div className="mt-2 text-xs text-neutral-500 line-clamp-2">{p.motivation || p.intention || p.notes || ""}</div>
                      </div>
                    );
                  })}
                  {(colonnesPipeline[st] || []).length === 0 && (
                    <div className="text-xs text-neutral-500">Aucun prospect.</div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* === Prospects (liste + filtres) === */}
        {ongletActif === "Prospects" && (
          <section className="mt-4">
            <div className="bg-white rounded-2xl shadow-sm border p-3 flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-neutral-500"/>
                <input
                  className="bg-transparent text-sm focus:outline-none"
                  placeholder="Rechercher nom, ville, intention…"
                  value={recherche}
                  onChange={e=>setRecherche(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-3 py-2">
                <Filter className="w-4 h-4 text-neutral-500"/>
                <select className="bg-transparent text-sm" value={filtreType} onChange={e=>setFiltreType(e.target.value)}>
                  {["Tous","Vendeur","Acheteur"].map(x=> <option key={x}>{x}</option>)}
                </select>
                <select className="bg-transparent text-sm" value={filtreStatut} onChange={e=>setFiltreStatut(e.target.value)}>
                  {["Tous", ...STATUTS].map(x=> <option key={x}>{x}</option>)}
                </select>
              </div>
              <button
                onClick={ajouterProspect}
                className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm"
              >
                <Plus className="w-4 h-4"/> Nouveau prospect
              </button>
            </div>

            <div className="mt-3 bg-white rounded-2xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr className="text-left">
                    <th className="p-3">Prospect</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Ville</th>
                    <th className="p-3">Bien</th>
                    <th className="p-3">Prix estimé</th>
                    <th className="p-3">Honoraires %</th>
                    <th className="p-3">Exclu</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Valeur €</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prospectsFiltres.map(p => (
                    <tr key={p.id} className="border-t hover:bg-neutral-50">
                      <td className="p-3">
                        <div className="font-medium cursor-pointer hover:underline" onClick={()=>setProspectOuvert(p)}>{p.nomComplet || "Sans nom"}</div>
                        <div className="text-xs text-neutral-500">{p.telephone || "—"}</div>
                      </td>
                      <td className="p-3">{p.type}</td>
                      <td className="p-3">{p.ville || "—"}</td>
                      <td className="p-3">{p.typeBien || "—"}</td>
                      <td className="p-3">{p.prixEstime ? fmtMonnaie(p.prixEstime) : "—"}</td>
                      <td className="p-3">{p.tauxHonoraires ? Math.round(p.tauxHonoraires*100) + "%" : "—"}</td>
                      <td className="p-3">{p.exclusif ? "Oui" : "Non"}</td>
                      <td className="p-3">{p.statut}</td>
                      <td className="p-3">
                        <span className={cx("px-2 py-1 rounded-lg text-xs",
                          p.score>=80?"bg-green-100 text-green-700":p.score>=60?"bg-amber-100 text-amber-700":"bg-neutral-100 text-neutral-700"
                        )}>{p.score}</span>
                      </td>
                      <td className="p-3">{fmtMonnaie(valeurAttendueEUR(p))}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <a className={cx("p-2 rounded-lg border", p.telephone?"":"opacity-40 pointer-events-none")} title="Appeler" href={lienTel(p.telephone)}><Phone className="w-4 h-4"/></a>
                          <a className={cx("p-2 rounded-lg border", p.telephone?"":"opacity-40 pointer-events-none")} title="SMS" href={lienSMS(p.telephone)}><MessageSquare className="w-4 h-4"/></a>
                          <button className="p-2 rounded-lg border" title="RDV" onClick={()=>creerRDVICS(p)}><Calendar className="w-4 h-4"/></button>
                          <button className="p-2 rounded-lg border" title="Supprimer" onClick={()=>supprimerProspect(p.id)}><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {prospectsFiltres.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-6 text-center text-neutral-500">Aucun résultat.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* === Scripts === */}
        {ongletActif === "Scripts" && (
          <section className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-center gap-2 font-semibold mb-2"><Phone className="w-4 h-4"/> Script appel Vendeur</div>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Salut, je suis <b>Redweyne</b>. J’ai bien reçu votre demande d’estimation à <b>{agentActif?.nom}</b>. C’est toujours d’actualité ?</li>
                <li>Motif: <i>Pourquoi</i> la vente ? (mutation, famille, projet…) — <span className="text-neutral-500">noter motivation</span></li>
                <li>Timing: vous visez plutôt <b>&lt; 3 mois</b> ou plus tard ?</li>
                <li>Bien: type, surface, adresse approximative. Photos dispo ?</li>
                <li>Prochaine étape: <b>proposer un créneau</b> (visio/visite) et envoyer <b>SMS de confirmation</b>.</li>
              </ol>
              <div className="mt-3 text-xs text-neutral-500">Raccourcis: Résumer en 1 phrase + programmer suivi J+{relance[0]}, J+{relance[1]}, J+{relance[2]}.</div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-center gap-2 font-semibold mb-2"><Phone className="w-4 h-4"/> Script appel Acheteur</div>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Bonjour, <b>Redweyne</b> à l’appareil. Vous cherchez une <b>maison/appartement</b> sur <b>Nantes</b>, c’est bien ça ?</li>
                <li>Budget + financement: déjà validé ? Ex: {fmtMonnaie(250000)}–{fmtMonnaie(500000)}</li>
                <li>Critères clés: quartiers, pièces, extérieur, stationnement.</li>
                <li>Confiance: expliquer le process et <b>mise en alerte</b> + RDV découverte.</li>
                <li>Confirmer: créneau RDV + SMS récap.</li>
              </ol>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-center gap-2 font-semibold mb-2"><MessageSquare className="w-4 h-4"/> SMS prêts à l’emploi</div>
              <div className="space-y-2 text-sm">
                <Template etiquette="Confirmation RDV">Bonjour {"{Prénom}"}, c’est Redweyne. Confirmé pour notre échange {"{date}"} à {"{heure}"}. Je vous envoie un rappel avant. À tout à l’heure !</Template>
                <Template etiquette="Relance J+2">Bonjour {"{Prénom}"}, je fais suite à votre demande {"{intention}"}. On s’appelle 5 minutes aujourd’hui ?</Template>
                <Template etiquette="Opt-out RGPD">Bonjour, reçu via formulaire. Si vous ne souhaitez plus être contacté, répondez STOP et je supprime vos données.</Template>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-center gap-2 font-semibold mb-2"><FileText className="w-4 h-4"/> Email de passation à l’agent</div>
              <p className="text-sm whitespace-pre-wrap">{`Objet: Lead chaud – ${agentActif?.nom} – {Nom}

Bonjour {Prenom Agent},

Voici un lead qualifié prêt pour un appel:
• Nom: {Nom Complet}
• Téléphone: {Téléphone}
• Intention: {Intention}
• Créneau: {Créneau}
• Notes: {Notes}

La personne s’attend à votre appel. Merci de me tenir informé du résultat.

— Redweyne`}</p>
            </div>
          </section>
        )}

        {/* === Paramètres === */}
        {ongletActif === "Paramètres" && (
          <section className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Profil agent */}
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="font-semibold mb-2">Profil agent</div>
              <LigneLibelle libelle="Nom">
                <input className="w-full border rounded-xl px-3 py-2" value={agentActif.nom} onChange={e=>setAgents(agents.map(a=> a.id===agentActif.id? { ...a, nom:e.target.value }: a))}/>
              </LigneLibelle>
              <LigneLibelle libelle="Email">
                <input className="w-full border rounded-xl px-3 py-2" value={agentActif.email} onChange={e=>setAgents(agents.map(a=> a.id===agentActif.id? { ...a, email:e.target.value }: a))}/>
              </LigneLibelle>
              <LigneLibelle libelle="Téléphone">
                <input className="w-full border rounded-xl px-3 py-2" value={agentActif.telephone} onChange={e=>setAgents(agents.map(a=> a.id===agentActif.id? { ...a, telephone:e.target.value }: a))}/>
              </LigneLibelle>
            </div>

            {/* Cadence de relance */}
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="font-semibold mb-2">Cadence de relance (jours)</div>
              <div className="flex items-center gap-2">
                {relance.map((d, i) => (
                  <input
                    key={i}
                    type="number"
                    className="w-20 border rounded-xl px-3 py-2"
                    value={d}
                    onChange={e=>{
                      const v = Number(e.target.value || 0);
                      const arr = [...relance]; arr[i] = clamp(v, 1, 60); setRelance(arr);
                    }}
                  />
                ))}
              </div>
              <div className="text-xs text-neutral-500 mt-2">
                Auto-planifie les tâches J+{relance[0]}, J+{relance[1]}, J+{relance[2]} après le premier contact.
              </div>
            </div>

            {/* RGPD */}
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="font-semibold mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> RGPD</div>
              <ul className="text-sm list-disc pl-5 space-y-1">
                <li>Base légale: consentement ou intérêt légitime (prospection immobilière).</li>
                <li>Durée: suppression automatique 24 mois après dernier contact.</li>
                <li>Opt-out: bouton "STOP" (SMS) & lien de désinscription email.</li>
                <li>Droits: accès, rectification, suppression sur demande.</li>
              </ul>
              <div className="mt-2 text-xs text-neutral-500">Ce module est indicatif. Prévoir DPA + registre de traitement.</div>
            </div>
          </section>
        )}
      </main>

      {/* === Volet Prospect (drawer) === */}
      {prospectOuvert && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30" onClick={()=>setProspectOuvert(null)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white border-l p-5 overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-xl font-semibold">{prospectOuvert.nomComplet || "Sans nom"}</div>
                <span className={cx("px-2 py-1 rounded-lg text-xs", prospectOuvert.type==="Vendeur"?"bg-rose-100 text-rose-700":"bg-blue-100 text-blue-700")}>{prospectOuvert.type}</span>
                <span className="px-2 py-1 rounded-lg text-xs bg-neutral-100">{prospectOuvert.statut}</span>
                {(normaliserTelephone(prospectOuvert.telephone) && (doublonsTel.get(normaliserTelephone(prospectOuvert.telephone))||0) > 1) && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3"/> Doublon</span>
                )}
              </div>
              <button onClick={()=>setProspectOuvert(null)} className="p-2 rounded-lg border"><XCircle className="w-5 h-5"/></button>
            </div>

            {/* Infos rapides */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <BlocInfo libelle="Téléphone" valeur={prospectOuvert.telephone || "—"} lien={prospectOuvert.telephone?lienTel(prospectOuvert.telephone):undefined} icone={Phone}/>
              <BlocInfo libelle="Email" valeur={prospectOuvert.email || "—"} icone={Mail}/>
              <BlocInfo libelle="Ville" valeur={prospectOuvert.ville || "—"} icone={MapPin}/>
              <BlocInfo libelle="Type de bien" valeur={prospectOuvert.typeBien || "—"} icone={Home}/>
              <BlocInfo libelle="Budget" valeur={prospectOuvert.budget ? fmtMonnaie(prospectOuvert.budget) : "—"} icone={Euro}/>
              <BlocInfo libelle="Délai" valeur={prospectOuvert.timeline || "—"} icone={Clock}/>
            </div>

            {/* Valeur & paramètres mandat */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <LigneLibelle libelle="Prix estimé (vendeur)">
                <input
                  type="number"
                  className="w-full border rounded-xl px-3 py-2"
                  value={prospectOuvert.prixEstime || 0}
                  onChange={e=>mettreAJourProspect(prospectOuvert.id, { prixEstime: Number(e.target.value||0) })}
                />
              </LigneLibelle>
              <LigneLibelle libelle="Honoraires (%)">
                <input
                  type="number"
                  className="w-full border rounded-xl px-3 py-2"
                  value={Math.round((prospectOuvert.tauxHonoraires||0)*100)}
                  onChange={e=>mettreAJourProspect(prospectOuvert.id, { tauxHonoraires: Number(e.target.value||0)/100 })}
                />
              </LigneLibelle>
              <div className="col-span-2 flex items-center gap-2">
                <input id="exclu" type="checkbox" checked={!!prospectOuvert.exclusif} onChange={e=>mettreAJourProspect(prospectOuvert.id, { exclusif: e.target.checked })}/>
                <label htmlFor="exclu" className="text-sm">Mandat exclusif</label>
                <div className="ml-auto text-sm">Valeur attendue: <b>{fmtMonnaie(valeurAttendueEUR(prospectOuvert))}</b></div>
              </div>
            </div>

            {/* Champs texte */}
            <div className="mt-4">
              <LigneLibelle libelle="Intention">
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={prospectOuvert.intention || ""}
                  onChange={e=>mettreAJourProspect(prospectOuvert.id, { intention: e.target.value })}
                />
              </LigneLibelle>

              <LigneLibelle libelle="Motivation">
                <textarea
                  className="w-full border rounded-xl px-3 py-2"
                  rows={3}
                  value={prospectOuvert.motivation || ""}
                  onChange={e=>mettreAJourProspect(prospectOuvert.id, { motivation: e.target.value })}
                />
              </LigneLibelle>

              <LigneLibelle libelle="Adresse (optionnel)">
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={prospectOuvert.adresse || ""}
                  onChange={e=>mettreAJourProspect(prospectOuvert.id, { adresse: e.target.value })}
                />
              </LigneLibelle>

              <LigneLibelle libelle="Notes internes">
                <textarea
                  className="w-full border rounded-xl px-3 py-2"
                  rows={3}
                  value={prospectOuvert.notes || ""}
                  onChange={e=>mettreAJourProspect(prospectOuvert.id, { notes: e.target.value })}
                />
              </LigneLibelle>
            </div>

            {/* Actions rapides */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                className={cx("inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl",
                  prospectOuvert.telephone?"bg-neutral-900 text-white":"bg-neutral-200 text-neutral-500 cursor-not-allowed")}
                disabled={!prospectOuvert.telephone}
                onClick={()=>prospectOuvert.telephone && window.open(lienTel(prospectOuvert.telephone), "_blank")}
              >
                <Phone className="w-4 h-4"/> Appeler
              </button>
              <a
                className={cx("inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border",
                  prospectOuvert.telephone?"":"opacity-40 pointer-events-none")}
                href={lienSMS(prospectOuvert.telephone)}
                target="_blank" rel="noreferrer"
              >
                <MessageSquare className="w-4 h-4"/> SMS
              </a>
              <a
                className={cx("inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border",
                  prospectOuvert.telephone?"":"opacity-40 pointer-events-none")}
                href={lienWA(prospectOuvert.telephone, `Bonjour ${prospectOuvert.nomComplet?.split(' ')[0]||''}, je vous contacte suite à votre demande. On se parle ?`)}
                target="_blank" rel="noreferrer"
              >
                <MessageSquare className="w-4 h-4"/> WhatsApp
              </a>
              <button
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border"
                onClick={()=>creerRDVICS(prospectOuvert)}
              >
                <Calendar className="w-4 h-4"/> Créer RDV (.ics)
              </button>
            </div>

            {/* Statut & méta */}
            <div className="mt-4 flex items-center gap-2">
              <button className="px-3 py-2 rounded-xl border" onClick={()=>deplacerStatut(prospectOuvert, -1)}>← Précédent</button>
              <button className="px-3 py-2 rounded-xl border" onClick={()=>deplacerStatut(prospectOuvert, +1)}>Suivant →</button>
              <div className="ml-auto text-sm">Score <span className="px-2 py-1 rounded-lg bg-neutral-100">{prospectOuvert.score}</span></div>
            </div>

            {/* RGPD + dates */}
            <div className="mt-4 text-xs text-neutral-500">
              Consentement RGPD: <b>{prospectOuvert.consentement ? "Oui" : "Non"}</b> —{" "}
              <button className="underline" onClick={()=>mettreAJourProspect(prospectOuvert.id, { consentement: !prospectOuvert.consentement })}>
                basculer
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
              <div>Dernier contact: {prospectOuvert.dernierContact ? new Date(prospectOuvert.dernierContact).toLocaleString("fr-FR") : "—"}</div>
              <div>Prochaine action: {prospectOuvert.prochaineAction ? `${joursRestants(prospectOuvert.prochaineAction)} j` : "—"}</div>
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto px-4 py-8 text-xs text-neutral-500">
        © {new Date().getFullYear()} Redweyne — CRM bonus d’inscription. Fait pour décrocher des mandats à partir de leads à 20€.
      </footer>
    </div>
  );
}

/* ====== Composants UI ====== */
function KPI({ icone:Icone, etiquette, valeur, sousTexte, aide }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4" title={aide || ""}>
      <div className="flex items-center gap-2 text-neutral-500 text-xs"><Icone className="w-4 h-4"/> {etiquette}</div>
      <div className="text-2xl font-semibold mt-1">{valeur}</div>
      <div className="text-xs text-neutral-500">{sousTexte}</div>
    </div>
  );
}

function CarteKPI({ titre, aide, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4" title={aide || ""}>
      <div className="flex items-center gap-2 text-neutral-500 text-xs"><InfoIcon className="w-4 h-4"/> {titre}</div>
      {children}
    </div>
  );
}

function LigneLibelle({ libelle, children }) {
  return (
    <div className="mt-2">
      <div className="text-xs text-neutral-500 mb-1">{libelle}</div>
      {children}
    </div>
  );
}

function BlocInfo({ icone:Icone, libelle, valeur, lien }) {
  const contenu = (
    <div className="border rounded-xl p-3 flex items-center gap-2">
      <Icone className="w-4 h-4 text-neutral-500"/>
      <div>
        <div className="text-xs text-neutral-500">{libelle}</div>
        <div className="text-sm">{valeur}</div>
      </div>
    </div>
  );
  return lien ? <a href={lien} target="_blank" rel="noreferrer">{contenu}</a> : contenu;
}

function Template({ etiquette, children }) {
  const [copie, setCopie] = useState(false);
  return (
    <div className="border rounded-2xl p-3">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">{etiquette}</div>
        <button
          onClick={async()=>{ await navigator.clipboard.writeText(children); setCopie(true); setTimeout(()=>setCopie(false), 1200); }}
          className="text-xs px-2 py-1 rounded-lg border"
        >{copie?"Copié!":"Copier"}</button>
      </div>
      <pre className="mt-2 text-xs whitespace-pre-wrap">{children}</pre>
    </div>
  );
}
