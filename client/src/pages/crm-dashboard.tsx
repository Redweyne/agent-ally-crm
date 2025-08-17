import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileCRMLayout from "@/components/mobile-crm-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Plus, Download, Upload, FileText, User, 
  Clock, Euro, Crown, Calendar, Phone, MessageSquare,
  BarChart3, Users, TrendingUp, Star, Home, LogOut,
  Search, Filter, Info, Edit, Save, X, Check,
  PhoneOff, UserX, Merge, AlertCircle, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { Prospect } from "@shared/schema";

import KpiCard from "@/components/crm/kpi-card";
import ProspectTable from "@/components/crm/prospect-table";
import PipelineBoard from "@/components/crm/pipeline-board";
import ProspectForm from "@/components/crm/prospect-form";
import MobileFilterDrawer from "@/components/crm/mobile-filter-drawer";
import MobileProspectCards from "@/components/crm/mobile-prospect-cards";
import DemoBanner from "@/components/crm/demo-banner";
import ROICalculator from "@/components/crm/roi-calculator";
import ContactTimeline from "@/components/crm/contact-timeline";
import HotLeadBadge from "@/components/crm/hot-lead-badge";
import DarkModeToggle from "@/components/crm/dark-mode-toggle";
import NotificationsPanel from "@/components/crm/notifications-panel";

// Helper functions
const getStatusProbability = (status: string): number => {
  const probabilities: Record<string, number> = {
    "Nouveau": 0.05,
    "Contacté": 0.1,
    "Qualifié": 0.25,
    "RDV fixé": 0.5,
    "Mandat signé": 0.75,
    "Mandate Pending": 0.65,
    "Gagné": 1.0,
    "Perdu": 0.0,
  };
  return probabilities[status] || 0.1;
};

// Enhanced CRM helper functions
const isReadyToSell = (prospect: any): boolean => {
  return !!(prospect.telephone && 
           prospect.consentement &&
           prospect.intention &&
           prospect.timeline &&
           prospect.ville &&
           (prospect.budget || prospect.prixEstime) &&
           ((prospect as any).liveTouches || 0) >= 1);
};

const isHotLead = (prospect: any): boolean => {
  const score = prospect.score || 0;
  const timeline = prospect.timeline || "";
  const timelineMonths = parseInt(timeline.split(' ')[0]) || 12;
  return score > 80 && timelineMonths < 3;
};

const OUTCOMES = {
  '1': 'Interested',
  '2': 'Not interested', 
  '3': 'Callback',
  '4': 'Voicemail',
  '5': 'Wrong number',
  '6': 'Appointment booked',
  '7': 'Do not call'
};

const TIME_SLOTS = [
  { label: 'Today PM', value: 'today-pm' },
  { label: 'Tomorrow AM', value: 'tomorrow-am' },
  { label: 'Tomorrow PM', value: 'tomorrow-pm' }
];

export default function CrmDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const [selectedAgentId, setSelectedAgentId] = useState(user?.id || "");
  const [activeTab, setActiveTab] = useState("tableau");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tous");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showProspectForm, setShowProspectForm] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showCallToday, setShowCallToday] = useState(false);
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [isMobileCallMode, setIsMobileCallMode] = useState(false);
  const [editingFees, setEditingFees] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [localProspects, setLocalProspects] = useState<Prospect[]>([]);
  const [showReadyToSell, setShowReadyToSell] = useState(false);
  const [showHotLeads, setShowHotLeads] = useState(false);
  const [showDueToday, setShowDueToday] = useState(false);

  // Fetch prospects
  const { data: prospects = [], isLoading } = useQuery<Prospect[]>({
    queryKey: ["prospects", selectedAgentId],
    queryFn: async () => {
      const response = await fetch(`/api/prospects?agentId=${selectedAgentId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized');
        throw new Error('Failed to fetch prospects');
      }
      return response.json();
    },
    enabled: !!selectedAgentId,
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnMount: true,
  });

  // Mutations
  const createProspectMutation = useMutation({
    mutationFn: async (data: Partial<Prospect>) => {
      const res = await apiRequest("POST", "/api/prospects", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      toast({ title: "Prospect créé avec succès" });
      setShowProspectForm(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erreur lors de la création", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateProspectMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Prospect> & { id: string }) => {
      const res = await apiRequest("PUT", `/api/prospects/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      toast({ title: "Prospect mis à jour" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erreur lors de la mise à jour", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteProspectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/prospects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      toast({ title: "Prospect supprimé" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erreur lors de la suppression", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Load localStorage data for enhanced features
  useEffect(() => {
    const savedProspects = localStorage.getItem('enhanced-prospects');
    if (savedProspects) {
      setLocalProspects(JSON.parse(savedProspects));
    }
  }, []);

  // Save to localStorage when prospects change
  useEffect(() => {
    if (localProspects.length > 0) {
      localStorage.setItem('enhanced-prospects', JSON.stringify(localProspects));
    }
  }, [localProspects]);

  // Merge server prospects with localStorage enhancements
  const enhancedProspects = useMemo(() => {
    return prospects.map(prospect => {
      const enhanced = localProspects.find(lp => lp.id === prospect.id);
      return enhanced ? { ...prospect, ...enhanced } : prospect;
    });
  }, [prospects, localProspects]);

  // Filtered and sorted prospects
  const filteredProspects = useMemo(() => {
    let filtered = enhancedProspects.filter(prospect => {
      const matchesSearch = !searchQuery || 
        [prospect.nomComplet, prospect.telephone, prospect.email, prospect.ville, prospect.exactSource]
          .filter(Boolean)
          .some(field => field?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = typeFilter === "Tous" || prospect.type === typeFilter;
      const matchesStatus = statusFilter === "Tous" || prospect.statut === statusFilter;
      
      // Enhanced filters
      if (showReadyToSell && !isReadyToSell(prospect)) return false;
      if (showHotLeads && !isHotLead(prospect)) return false;
      if (showDueToday) {
        const today = new Date().toISOString().split('T')[0];
        if ((prospect as any).nextFollowUp !== today) return false;
      }
      
      // Budget filter
      const prospectBudget = prospect.budget || prospect.prixEstime || 0;
      const matchesMinBudget = !minBudget || prospectBudget >= parseInt(minBudget);
      const matchesMaxBudget = !maxBudget || prospectBudget <= parseInt(maxBudget);
      
      // Call today filter - prospects that need to be contacted today
      if (showCallToday) {
        const today = new Date().toDateString();
        const needsCall = prospect.prochaineAction && 
          new Date(prospect.prochaineAction).toDateString() === today &&
          !["Gagné", "Perdu", "Pas de réponse"].includes(prospect.statut || "");
        
        if (!needsCall) return false;
      }
      
      return matchesSearch && matchesType && matchesStatus && matchesMinBudget && matchesMaxBudget;
    });

    // Enhanced sorting with Hot First option
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "hot-first":
          const aHot = isHotLead(a) ? 1 : 0;
          const bHot = isHotLead(b) ? 1 : 0;
          if (aHot !== bHot) return bHot - aHot;
          // Secondary sort by score
          return (b.score || 0) - (a.score || 0);
        case "value":
          aValue = (a.budget || a.prixEstime || 0) * (a.tauxHonoraires || 0.04);
          bValue = (b.budget || b.prixEstime || 0) * (b.tauxHonoraires || 0.04);
          break;
        case "score":
          aValue = a.score || 0;
          bValue = b.score || 0;
          break;
        case "name":
          aValue = a.nomComplet || "";
          bValue = b.nomComplet || "";
          break;
        case "date":
        default:
          aValue = new Date(a.creeLe || 0).getTime();
          bValue = new Date(b.creeLe || 0).getTime();
          break;
      }
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      const numA = typeof aValue === "number" ? aValue : 0;
      const numB = typeof bValue === "number" ? bValue : 0;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });

    return filtered;
  }, [enhancedProspects, searchQuery, typeFilter, statusFilter, minBudget, maxBudget, showCallToday, showReadyToSell, showHotLeads, showDueToday, sortBy, sortOrder]);

  // Opportunities filtering - prospects with high value or imminent appointments
  const opportunityProspects = useMemo(() => {
    return enhancedProspects.filter(prospect => {
      // Exclude already won or lost prospects
      if (["Gagné", "Perdu", "Pas de réponse"].includes(prospect.statut || "")) {
        return false;
      }

      // High value prospects (budget >= 300k EUR or estimated commission >= 9k EUR)
      const budget = prospect.budget || prospect.prixEstime || 0;
      const commission = budget * (prospect.tauxHonoraires || 0.04);
      const isHighValue = budget >= 300000 || commission >= 9000;

      // Good scoring prospects (score > 55)
      const hasGoodScore = (prospect.score || 0) > 55;

      // Advanced stage prospects
      const isAdvancedStage = ["Qualifié", "RDV fixé", "Mandat signé", "Mandate Pending", "En négociation"].includes(prospect.statut || "");

      // Imminent appointments (next 7 days)
      const hasImminentAction = (() => {
        if (!prospect.prochaineAction) return false;
        const actionDate = new Date(prospect.prochaineAction);
        const now = new Date();
        const daysDiff = Math.ceil((actionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= 7;
      })();

      // Ready to sell (all qualification criteria met)
      const isQualified = isReadyToSell(prospect);

      // Hot leads from database flag
      const isMarkedHotLead = prospect.isHotLead || false;

      return isHighValue || hasGoodScore || isAdvancedStage || hasImminentAction || isQualified || isMarkedHotLead;
    }).sort((a, b) => {
      // Sort by priority: Hot leads first, then by score, then by value
      const aHot = isHotLead(a) ? 1 : 0;
      const bHot = isHotLead(b) ? 1 : 0;
      if (aHot !== bHot) return bHot - aHot;

      // Sort by score descending
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;

      // Then by value
      const aValue = (a.budget || a.prixEstime || 0) * (a.tauxHonoraires || 0.04);
      const bValue = (b.budget || b.prixEstime || 0) * (b.tauxHonoraires || 0.04);
      return bValue - aValue;
    });
  }, [enhancedProspects]);

  // Enhanced CRM functions
  const handleOutcome = (prospectId: string, outcomeKey: string) => {
    const outcome = OUTCOMES[outcomeKey as keyof typeof OUTCOMES];
    const followUpDays = outcomeKey === '3' ? 2 : 1; // Callback = J+2, others = J+1
    const nextFollowUp = new Date();
    nextFollowUp.setDate(nextFollowUp.getDate() + followUpDays);

    setLocalProspects(prev => {
      const updated = prev.map(p => 
        p.id === prospectId 
          ? { 
              ...p, 
              outcome, 
              nextFollowUp: nextFollowUp.toISOString().split('T')[0],
              liveTouches: ((p as any).liveTouches || 0) + 1
            }
          : p
      );
      
      // Add if not exists
      if (!updated.find(p => p.id === prospectId)) {
        const prospect = prospects.find(p => p.id === prospectId);
        if (prospect) {
          updated.push({
            ...prospect,
            outcome,
            nextFollowUp: nextFollowUp.toISOString().split('T')[0],
            liveTouches: ((prospect as any).liveTouches || 0) + 1
          });
        }
      }
      
      return updated;
    });

    toast({
      title: "Outcome recorded",
      description: `${outcome} - Follow up scheduled for ${nextFollowUp.toLocaleDateString()}`
    });
  };

  const calculateExpectedRevenue = (prospect: Prospect) => {
    const budget = prospect.budget || prospect.prixEstime || 0;
    const fees = prospect.tauxHonoraires || 0.04;
    return (budget * fees).toLocaleString('fr-FR');
  };

  const bookAppointment = (prospectId: string, slot: string) => {
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) return;

    const now = new Date();
    let appointmentDate = new Date();
    let time = '';

    switch (slot) {
      case 'today-pm':
        time = '14:00';
        break;
      case 'tomorrow-am':
        appointmentDate.setDate(now.getDate() + 1);
        time = '10:00';
        break;
      case 'tomorrow-pm':
        appointmentDate.setDate(now.getDate() + 1);
        time = '14:00';
        break;
    }

    // Generate ICS file
    const startDate = new Date(`${appointmentDate.toISOString().split('T')[0]}T${time}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RedLead2Guide//EN
BEGIN:VEVENT
UID:${prospectId}-${Date.now()}@redlead2guide.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Appointment with ${prospect.nomComplet}
DESCRIPTION:Real estate appointment\\nPhone: ${prospect.telephone}\\nArea: ${prospect.ville}\\nBudget: €${(prospect.budget || prospect.prixEstime || 0).toLocaleString()}
LOCATION:${prospect.ville}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment-${prospect.nomComplet?.replace(/\s/g, '-')}.ics`;
    a.click();
    
    toast({
      title: "Appointment booked",
      description: `${slot.replace('-', ' ')} with ${prospect.nomComplet}`
    });
  };

  const exportProspectPDF = (prospect: Prospect) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lead Package - ${prospect.nomComplet}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
            .content { margin: 20px 0; }
            .section { margin: 15px 0; }
            .label { font-weight: bold; }
            .badge { background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RedLead2Guide CRM</h1>
            <h2>Lead Package</h2>
          </div>
          <div class="content">
            <div class="section">
              <div class="label">Name:</div> ${prospect.nomComplet}
              ${isReadyToSell(prospect) ? '<span class="badge">Ready to Sell</span>' : ''}
              ${isHotLead(prospect) ? '<span class="badge">Hot Lead</span>' : ''}
            </div>
            <div class="section"><div class="label">Phone:</div> ${prospect.telephone}</div>
            <div class="section"><div class="label">Email:</div> ${prospect.email}</div>
            <div class="section"><div class="label">Area:</div> ${prospect.ville}</div>
            <div class="section"><div class="label">Budget:</div> €${(prospect.budget || prospect.prixEstime || 0).toLocaleString()}</div>
            <div class="section"><div class="label">Expected Revenue:</div> €${calculateExpectedRevenue(prospect)}</div>
            <div class="section"><div class="label">Timeline:</div> ${prospect.timeline || 'N/A'}</div>
            <div class="section"><div class="label">Score:</div> ${prospect.score}/100</div>
            <div class="section"><div class="label">Status:</div> ${prospect.statut}</div>
            <div class="section"><div class="label">Notes:</div> ${prospect.notes || (prospect as any).commentaires || 'N/A'}</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const exportJSON = () => {
    const data = { prospects: localProspects };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.prospects) setLocalProspects(data.prospects);
        toast({ title: "Data imported successfully" });
      } catch (error) {
        toast({ title: "Import failed", description: "Invalid file format" });
      }
    };
    reader.readAsText(file);
  };

  const findDuplicates = () => {
    const duplicates: Prospect[][] = [];
    const processed = new Set();

    enhancedProspects.forEach((prospect, index) => {
      if (processed.has(index)) return;
      
      const matches = enhancedProspects.filter((other, otherIndex) => {
        if (otherIndex <= index) return false;
        return other.telephone === prospect.telephone || 
               (other.nomComplet?.toLowerCase() === prospect.nomComplet?.toLowerCase() && other.email === prospect.email);
      });

      if (matches.length > 0) {
        duplicates.push([prospect, ...matches]);
        matches.forEach(match => {
          const matchIndex = enhancedProspects.findIndex(p => p.id === match.id);
          processed.add(matchIndex);
        });
      }
    });

    return duplicates;
  };

  const mergeDuplicates = (primaryProspect: Prospect, duplicates: Prospect[]) => {
    const merged = {
      ...primaryProspect,
      liveTouches: Math.max((primaryProspect as any).liveTouches || 0, ...duplicates.map(d => (d as any).liveTouches || 0)),
      score: Math.max(primaryProspect.score || 0, ...duplicates.map(d => d.score || 0)),
      notes: [primaryProspect.notes || (primaryProspect as any).commentaires, ...duplicates.map(d => d.notes || (d as any).commentaires)].filter(n => n).join('\n\n')
    };

    setLocalProspects(prev => prev.filter(p => !duplicates.some(d => d.id === p.id))
                                 .map(p => p.id === primaryProspect.id ? merged : p));
    
    toast({ title: "Prospects merged successfully" });
  };

  // Keyboard shortcuts for outcomes
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedProspect && e.key >= '1' && e.key <= '7') {
        handleOutcome(selectedProspect.id!, e.key);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedProspect]);

  // KPI calculations
  const kpis = useMemo(() => {
    const today = new Date().toDateString();
    const newToday = prospects.filter(p => new Date(p.creeLe!).toDateString() === today).length;
    const rdvCount = prospects.filter(p => p.statut === "RDV fixé").length;
    const wonCount = prospects.filter(p => p.statut === "Gagné").length;
    const conversionRate = prospects.length > 0 ? Math.round((wonCount / prospects.length) * 100) : 0;

    // Calculate SLA (average response time)
    const responses = prospects
      .filter(p => p.dernierContact && p.creeLe)
      .map(p => new Date(p.dernierContact!).getTime() - new Date(p.creeLe!).getTime())
      .filter(time => time > 0);
    
    const avgSlaMs = responses.length > 0 ? responses.reduce((a, b) => a + b) / responses.length : 0;
    const avgSlaMinutes = Math.round(avgSlaMs / (1000 * 60));

    // Pipeline value calculation
    const pipelineValue = prospects
      .filter(p => ["Qualifié", "RDV fixé", "Mandat signé", "Gagné"].includes(p.statut!))
      .reduce((sum, p) => {
        const price = p.prixEstime || p.budget || 0;
        const rate = p.tauxHonoraires || 0.04;
        const probability = getStatusProbability(p.statut!);
        const exclusiveBonus = p.exclusif ? 1.1 : 1;
        return sum + (price * rate * probability * exclusiveBonus);
      }, 0);

    const exclusiveCount = prospects.filter(p => p.exclusif).length;

    // RDV in next 7 days
    const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcomingRdv = prospects.filter(p => 
      p.prochaineAction && 
      new Date(p.prochaineAction) <= next7Days &&
      p.statut === "RDV fixé"
    ).length;

    return {
      newToday,
      rdvCount,
      wonCount,
      conversionRate,
      avgSlaMinutes,
      pipelineValue,
      exclusiveCount,
      upcomingRdv
    };
  }, [prospects]);

  // Chart data (last 7 days activity)
  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      const dayName = date.toLocaleDateString("fr-FR", { weekday: "short" });
      
      const created = prospects.filter(p => 
        new Date(p.creeLe!).toDateString() === date.toDateString()
      ).length;
      
      return {
        name: dayName,
        "Créés": created,
        "Contactés": prospects.filter(p => p.statut === "Contacté").length,
        "RDV": prospects.filter(p => p.statut === "RDV fixé").length,
      };
    });
    return days;
  }, [prospects]);



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const exportCSV = () => {
    const headers = ["Nom", "Type", "Statut", "Téléphone", "Email", "Ville", "Valeur"];
    const csvData = filteredProspects.map(p => [
      p.nomComplet || "",
      p.type || "",
      p.statut || "",
      p.telephone || "",
      p.email || "",
      p.ville || "",
      p.prixEstime || p.budget || 0
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospects_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <MobileCRMLayout
        user={user}
        prospects={filteredProspects}
        kpis={kpis}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onCall={(prospect) => {
          console.log('Calling:', prospect.telephone);
          window.open(`tel:${prospect.telephone}`, '_self');
        }}
        onWhatsApp={(prospect) => {
          const message = `Bonjour ${prospect.nomComplet}, je suis votre agent immobilier concernant votre projet ${prospect.type?.toLowerCase()} à ${prospect.ville}.`;
          const phoneNumber = prospect.telephone?.replace(/\s/g, '').replace(/\+33/, '33');
          const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
        }}
        onScheduleRDV={(prospect) => {
          setSelectedProspect(prospect);
        }}
        onCreateProspect={() => setShowProspectForm(true)}
        onEditProspect={(prospect) => {
          setSelectedProspect(prospect);
          setShowProspectForm(true);
        }}
        onSaveProspect={(prospectData) => {
          if (prospectData.id && prospectData.id !== '') {
            // Update existing prospect
            updateProspectMutation.mutate(prospectData);
          } else {
            // Create new prospect
            const newProspectData = {
              ...prospectData,
              agentId: user?.id,
              id: undefined // Let the server generate the ID
            };
            createProspectMutation.mutate(newProspectData);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="crm-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-primary text-white grid place-items-center font-bold text-sm">
              RL
            </div>
            <div>
              <div className="font-semibold leading-tight text-sm sm:text-base" data-testid="header-title">
                RedLead2Guide CRM — Leads Immobiliers
              </div>
              <div className="text-xs text-gray-500" data-testid="header-subtitle">
                CRM moderne • Orienté mandat
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
              <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm dark:text-gray-200" data-testid="current-user">
                {user?.name}
              </span>
            </div>

            <NotificationsPanel prospects={prospects} />

            <DarkModeToggle />

            <Button
              onClick={exportCSV}
              variant="outline"
              size="sm"
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>

            <Button
              onClick={exportJSON}
              variant="outline"
              size="sm"
              data-testid="button-export-json"
            >
              <Download className="w-4 h-4 mr-2" />
              Backup
            </Button>

            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={importJSON}
                className="hidden"
              />
            </label>

            <Button
              variant={showDuplicates ? "default" : "outline"}
              onClick={() => setShowDuplicates(!showDuplicates)}
              size="sm"
            >
              <Merge className="w-4 h-4 mr-2" />
              Duplicates ({findDuplicates().length})
            </Button>

            <Button
              variant={isMobileCallMode ? "default" : "outline"}
              onClick={() => setIsMobileCallMode(!isMobileCallMode)}
              size="sm"
              className="md:hidden"
            >
              Call Mode
            </Button>

            <Button
              onClick={() => setShowProspectForm(true)}
              size="sm"
              data-testid="button-new-prospect"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              size="sm"
              data-testid="button-back-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Site
            </Button>

            <Button
              variant="outline"
              onClick={handleLogout}
              size="sm"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Demo Banner */}
        <DemoBanner />
        
        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard
            title="Leads aujourd'hui"
            value={kpis.newToday}
            subtitle="nouveaux"
            icon={Plus}
            trend={kpis.newToday > 0 ? "up" : "neutral"}
          />
          <KpiCard
            title="Ready to Sell"
            value={enhancedProspects.filter(isReadyToSell).length}
            subtitle="prêts à vendre"
            icon={Check}
            trend="up"
          />
          <KpiCard
            title="Hot Leads"
            value={enhancedProspects.filter(isHotLead).length}
            subtitle="prospects chauds"
            icon={Star}
            trend="up"
          />
          <KpiCard
            title="RDV fixés"
            value={kpis.rdvCount}
            subtitle="pipeline actif"
            icon={Calendar}
            trend={kpis.rdvCount > 0 ? "up" : "neutral"}
          />
          <KpiCard
            title="Gagnés"
            value={kpis.wonCount}
            subtitle="mandats"
            icon={Star}
            trend={kpis.wonCount > 0 ? "up" : "neutral"}
          />
          <KpiCard
            title="Taux de conv."
            value={`${kpis.conversionRate}%`}
            subtitle="global"
            icon={TrendingUp}
            trend={kpis.conversionRate > 20 ? "up" : kpis.conversionRate > 10 ? "neutral" : "down"}
          />
        </div>

        {/* Enhanced KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                SLA Moyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="kpi-sla">
                {kpis.avgSlaMinutes > 0 ? `${kpis.avgSlaMinutes} min` : "—"}
              </div>
              <p className="text-xs text-gray-500">Temps de 1ère réponse</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Euro className="w-4 h-4 mr-2" />
                Valeur Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="kpi-pipeline">
                {formatCurrency(kpis.pipelineValue)}
              </div>
              <p className="text-xs text-gray-500">€ attendus (pondérés)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Crown className="w-4 h-4 mr-2" />
                Exclusivités
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="kpi-exclusives">
                {kpis.exclusiveCount}
              </div>
              <p className="text-xs text-gray-500">Mandats exclusifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                RDV (7j)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="kpi-upcoming-rdv">
                {kpis.upcomingRdv}
              </div>
              <p className="text-xs text-gray-500">À venir</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Activité 7 jours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="Créés" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Contactés" 
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="RDV" 
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="tableau" data-testid="tab-tableau">Tableau Agent</TabsTrigger>
            <TabsTrigger value="opportunites" data-testid="tab-opportunites">Opportunités</TabsTrigger>
            <TabsTrigger value="pipeline" data-testid="tab-pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="prospects" data-testid="tab-prospects">Prospects</TabsTrigger>
            <TabsTrigger value="scripts" data-testid="tab-scripts">Scripts</TabsTrigger>
            <TabsTrigger value="parametres" data-testid="tab-parametres">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="tableau">
            <div className="text-center py-8">
              <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Les KPIs sont affichés dans les cartes ci-dessus</p>
            </div>
          </TabsContent>

          <TabsContent value="opportunites">
            <Card>
              <CardHeader>
                <CardTitle>Opportunités Prioritaires ({opportunityProspects.length})</CardTitle>
                <CardDescription>
                  Prospects avec forte valeur attendue, hot leads, stages avancés ou RDV imminent
                </CardDescription>
              </CardHeader>
              <CardContent>
                {opportunityProspects.length === 0 ? (
                  <div className="text-center py-8">
                    <Info className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Aucune opportunité prioritaire trouvée</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Les critères incluent: valeur élevée (&gt;400k€), hot leads (score &gt;50), 
                      stages avancés, ou actions dans les 7 prochains jours
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Opportunity Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-amber-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-amber-700">
                          {opportunityProspects.filter(p => (p.score || 0) > 50).length}
                        </div>
                        <div className="text-sm text-amber-600">Hot Leads</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-green-700">
                          {opportunityProspects.filter(p => {
                            const budget = p.budget || p.prixEstime || 0;
                            const commission = budget * (p.tauxHonoraires || 0.04);
                            return budget >= 400000 || commission >= 12000;
                          }).length}
                        </div>
                        <div className="text-sm text-green-600">Forte Valeur</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-700">
                          {opportunityProspects.filter(p => 
                            ["Qualifié", "RDV fixé", "Mandat signé", "Mandate Pending"].includes(p.statut || "")
                          ).length}
                        </div>
                        <div className="text-sm text-blue-600">Stage Avancé</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-purple-700">
                          {opportunityProspects.filter(p => {
                            if (!p.prochaineAction) return false;
                            const actionDate = new Date(p.prochaineAction);
                            const now = new Date();
                            const daysDiff = Math.ceil((actionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            return daysDiff >= 0 && daysDiff <= 7;
                          }).length}
                        </div>
                        <div className="text-sm text-purple-600">Action 7j</div>
                      </div>
                    </div>

                    {/* Opportunity Table */}
                    <ProspectTable 
                      prospects={opportunityProspects}
                      onEdit={(prospect) => {
                        setSelectedProspect(prospect);
                        setShowProspectForm(true);
                      }}
                      onDelete={(id) => deleteProspectMutation.mutate(id)}
                      compact
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pipeline">
            <PipelineBoard 
              prospects={filteredProspects}
              onUpdateStatus={(id, status) => 
                updateProspectMutation.mutate({ id, statut: status })
              }
            />
          </TabsContent>

          <TabsContent value="prospects">
            <div className="space-y-4">
              {/* Enhanced Search and Filters - Mobile/Desktop Responsive */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Mobile Filter Button - Visible on small screens */}
                    <div className="block sm:hidden">
                      <MobileFilterDrawer
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        minBudget={minBudget}
                        setMinBudget={setMinBudget}
                        maxBudget={maxBudget}
                        setMaxBudget={setMaxBudget}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        showReadyToSell={showReadyToSell}
                        setShowReadyToSell={setShowReadyToSell}
                        showHotLeads={showHotLeads}
                        setShowHotLeads={setShowHotLeads}
                        showDueToday={showDueToday}
                        setShowDueToday={setShowDueToday}
                        showCallToday={showCallToday}
                        setShowCallToday={setShowCallToday}
                        callTodayCount={prospects.filter(p => {
                          const today = new Date().toDateString();
                          return p.prochaineAction && 
                            new Date(p.prochaineAction).toDateString() === today &&
                            !["Gagné", "Perdu", "Pas de réponse"].includes(p.statut || "");
                        }).length}
                        activeFiltersCount={[
                          searchQuery ? 1 : 0,
                          typeFilter !== "Tous" ? 1 : 0,
                          statusFilter !== "Tous" ? 1 : 0,
                          minBudget ? 1 : 0,
                          maxBudget ? 1 : 0,
                          showReadyToSell ? 1 : 0,
                          showHotLeads ? 1 : 0,
                          showDueToday ? 1 : 0,
                          showCallToday ? 1 : 0,
                          sortBy !== "date" ? 1 : 0,
                          sortOrder !== "desc" ? 1 : 0
                        ].reduce((sum, val) => sum + val, 0)}
                      />
                    </div>

                    {/* Desktop Filters - Hidden on small screens */}
                    <div className="hidden sm:block">
                      {/* Search and Quick Actions */}
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Rechercher par nom, téléphone, email, ville, source exacte..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant={showReadyToSell ? "default" : "outline"}
                            onClick={() => setShowReadyToSell(!showReadyToSell)}
                            size="sm"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Ready to Sell
                          </Button>
                          
                          <Button
                            variant={showHotLeads ? "default" : "outline"}
                            onClick={() => setShowHotLeads(!showHotLeads)}
                            size="sm"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Hot Leads
                          </Button>
                          
                          <Button
                            variant={showDueToday ? "default" : "outline"}
                            onClick={() => setShowDueToday(!showDueToday)}
                            size="sm"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Due Today
                          </Button>
                          
                          <Button
                            variant={showCallToday ? "default" : "outline"}
                            onClick={() => setShowCallToday(!showCallToday)}
                            size="sm"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call Today ({prospects.filter(p => {
                              const today = new Date().toDateString();
                              return p.prochaineAction && 
                              new Date(p.prochaineAction).toDateString() === today &&
                              !["Gagné", "Perdu", "Pas de réponse"].includes(p.statut || "");
                          }).length})
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Advanced Filters - Hidden on mobile since they're in the drawer */}
                    <div className="hidden sm:grid grid-cols-2 md:grid-cols-6 gap-4">
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tous">Tous types</SelectItem>
                          <SelectItem value="Vendeur">Vendeurs</SelectItem>
                          <SelectItem value="Acheteur">Acheteurs</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tous">Tous statuts</SelectItem>
                          <SelectItem value="Nouveau">Nouveau</SelectItem>
                          <SelectItem value="Contacté">Contacté</SelectItem>
                          <SelectItem value="Qualifié">Qualifié</SelectItem>
                          <SelectItem value="RDV fixé">RDV fixé</SelectItem>
                          <SelectItem value="Mandate Pending">Mandat en attente</SelectItem>
                          <SelectItem value="Mandat signé">Mandat signé</SelectItem>
                          <SelectItem value="En négociation">En négociation</SelectItem>
                          <SelectItem value="Gagné">Gagné</SelectItem>
                          <SelectItem value="Perdu">Perdu</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        placeholder="Budget min"
                        value={minBudget}
                        onChange={(e) => setMinBudget(e.target.value)}
                      />

                      <Input
                        type="number"
                        placeholder="Budget max"
                        value={maxBudget}
                        onChange={(e) => setMaxBudget(e.target.value)}
                      />

                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Par date</SelectItem>
                          <SelectItem value="hot-first">Hot First</SelectItem>
                          <SelectItem value="value">Par valeur (€)</SelectItem>
                          <SelectItem value="score">Par score</SelectItem>
                          <SelectItem value="name">Par nom</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Décroissant</SelectItem>
                          <SelectItem value="asc">Croissant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filter Results Summary */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        {filteredProspects.length} prospect{filteredProspects.length !== 1 ? 's' : ''} 
                        {searchQuery || typeFilter !== "Tous" || statusFilter !== "Tous" || minBudget || maxBudget || showCallToday 
                          ? ` (filtré${filteredProspects.length !== 1 ? 's' : ''} sur ${prospects.length})`
                          : ''
                        }
                      </span>
                      
                      {(searchQuery || typeFilter !== "Tous" || statusFilter !== "Tous" || minBudget || maxBudget || showCallToday) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("");
                            setTypeFilter("Tous");
                            setStatusFilter("Tous");
                            setMinBudget("");
                            setMaxBudget("");
                            setShowCallToday(false);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Réinitialiser filtres
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Duplicates Panel */}
              {showDuplicates && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Duplicates Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {findDuplicates().length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No duplicates found</p>
                    ) : (
                      <div className="space-y-4">
                        {findDuplicates().map((group, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">Duplicate Group {index + 1}</h4>
                            <div className="space-y-2">
                              {group.map((prospect, pIndex) => (
                                <div key={prospect.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <span className="font-medium">{prospect.nomComplet}</span> - {prospect.telephone}
                                    <span className="text-sm text-gray-500 ml-2">Score: {prospect.score}</span>
                                  </div>
                                  {pIndex === 0 && (
                                    <Button
                                      size="sm"
                                      onClick={() => mergeDuplicates(prospect, group.slice(1))}
                                    >
                                      Set as Primary & Merge
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Mobile Call Mode */}
              {isMobileCallMode && (
                <Card className="mb-6 md:hidden">
                  <CardHeader>
                    <CardTitle>Mobile Call Mode</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedProspect ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="text-xl font-bold">{selectedProspect.nomComplet}</h3>
                          <p className="text-lg">{selectedProspect.telephone}</p>
                          <p className="text-sm text-gray-500">{selectedProspect.ville} • {selectedProspect.type}</p>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          {Object.entries(OUTCOMES).map(([key, label]) => (
                            <Button
                              key={key}
                              variant="outline"
                              size="sm"
                              onClick={() => handleOutcome(selectedProspect.id!, key)}
                              className="text-xs"
                            >
                              {key}. {label}
                            </Button>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {TIME_SLOTS.map((slot) => (
                            <Button
                              key={slot.value}
                              variant="outline"
                              size="sm"
                              onClick={() => bookAppointment(selectedProspect.id!, slot.value)}
                            >
                              {slot.label}
                            </Button>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => exportProspectPDF(selectedProspect)}
                          >
                            Export PDF
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(`${selectedProspect.nomComplet} - ${selectedProspect.telephone}`);
                              toast({ title: "Copied to clipboard" });
                            }}
                          >
                            Copy Info
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500">Select a prospect to start calling</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ROI Calculator */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ROICalculator prospects={filteredProspects} />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Estimation de clôture
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredProspects.filter(p => p.estimatedClosingDays && !["Gagné", "Perdu"].includes(p.statut || "")).slice(0, 5).map(prospect => (
                        <div key={prospect.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">
                                {prospect.nomComplet?.charAt(0) || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{prospect.nomComplet}</p>
                              <p className="text-sm text-gray-500">{prospect.ville}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{prospect.estimatedClosingDays || 30} jours</p>
                            <p className="text-sm text-gray-500">estimé</p>
                          </div>
                        </div>
                      ))}
                      
                      {filteredProspects.filter(p => !["Gagné", "Perdu"].includes(p.statut || "")).length === 0 && (
                        <p className="text-center text-gray-500 py-4">Aucun prospect en cours</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile Cards (< sm) and Desktop Table (>= sm) */}
              <div className="block sm:hidden">
                <MobileProspectCards
                  prospects={filteredProspects}
                  onEdit={(prospect) => {
                    setSelectedProspect(prospect);
                    setShowProspectForm(true);
                  }}
                  onDelete={(id) => deleteProspectMutation.mutate(id)}
                />
              </div>
              <div className="hidden sm:block">
                <Card>
                  <CardHeader>
                    <CardTitle>Liste des prospects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProspectTable 
                      prospects={filteredProspects}
                      onEdit={(prospect) => {
                        setSelectedProspect(prospect);
                        setShowProspectForm(true);
                      }}
                      onDelete={(id) => deleteProspectMutation.mutate(id)}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scripts">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Premier Contact Vendeur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2">
                    <p>"Bonjour [Nom], c'est [Votre nom] de l'agence Redweyne."</p>
                    <p>"Vous avez récemment fait une demande d'estimation pour votre [type de bien] à [ville]."</p>
                    <p>"Je vous appelle car nous avons actuellement une forte demande sur ce secteur..."</p>
                    <p className="text-gray-600 italic">→ Objectif: Fixer un RDV d'estimation</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Premier Contact Acheteur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2">
                    <p>"Bonjour [Nom], c'est [Votre nom] de l'agence Redweyne."</p>
                    <p>"Vous recherchez un [type de bien] secteur [zone] dans un budget de [budget]€."</p>
                    <p>"J'ai peut-être quelque chose qui va vous intéresser..."</p>
                    <p className="text-gray-600 italic">→ Objectif: Qualifier le besoin et fixer une visite</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="parametres">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profil Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nom complet</label>
                      <p className="text-gray-600">{user?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-gray-600">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Identifiant</label>
                      <p className="text-gray-600">{user?.username}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conformité RGPD</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Données sécurisées</p>
                        <p className="text-sm text-green-700">Hébergement français, chiffrement SSL</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Prospect Form Modal */}
      {showProspectForm && (
        <ProspectForm
          prospect={selectedProspect}
          onSave={(data) => {
            if (selectedProspect) {
              updateProspectMutation.mutate({ ...data, id: selectedProspect.id });
            } else {
              createProspectMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowProspectForm(false);
            setSelectedProspect(null);
          }}
          isLoading={createProspectMutation.isPending || updateProspectMutation.isPending}
        />
      )}
    </div>
  );
}
