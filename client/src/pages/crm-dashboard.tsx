import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Plus, Download, Upload, FileText, User, 
  Clock, Euro, Crown, Calendar, Phone, MessageSquare,
  BarChart3, Users, TrendingUp, Star, Home, LogOut,
  Search, Filter, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { Prospect } from "@shared/schema";

import KpiCard from "@/components/crm/kpi-card";
import ProspectTable from "@/components/crm/prospect-table";
import PipelineBoard from "@/components/crm/pipeline-board";
import ProspectForm from "@/components/crm/prospect-form";
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

export default function CrmDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
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

  // Filtered and sorted prospects
  const filteredProspects = useMemo(() => {
    let filtered = prospects.filter(prospect => {
      const matchesSearch = !searchQuery || 
        [prospect.nomComplet, prospect.telephone, prospect.email, prospect.ville, prospect.exactSource]
          .filter(Boolean)
          .some(field => field?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = typeFilter === "Tous" || prospect.type === typeFilter;
      const matchesStatus = statusFilter === "Tous" || prospect.statut === statusFilter;
      
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

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
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
  }, [prospects, searchQuery, typeFilter, statusFilter, minBudget, maxBudget, showCallToday, sortBy, sortOrder]);

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

  return (
    <div className="min-h-screen bg-gray-50" data-testid="crm-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-primary text-white grid place-items-center font-bold">
              RL
            </div>
            <div>
              <div className="font-semibold leading-tight" data-testid="header-title">
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
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Leads aujourd'hui"
            value={kpis.newToday}
            subtitle="nouveaux"
            icon={Plus}
            trend={kpis.newToday > 0 ? "up" : "neutral"}
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
                <CardTitle>Opportunités Prioritaires</CardTitle>
                <CardDescription>
                  Prospects avec forte valeur attendue ou RDV imminent
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredProspects.length === 0 ? (
                  <div className="text-center py-8">
                    <Info className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Aucune opportunité selon les critères</p>
                  </div>
                ) : (
                  <ProspectTable 
                    prospects={filteredProspects}
                    onEdit={(prospect) => {
                      setSelectedProspect(prospect);
                      setShowProspectForm(true);
                    }}
                    onDelete={(id) => deleteProspectMutation.mutate(id)}
                    compact
                  />
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
              {/* Enhanced Search and Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
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
                      
                      <Button
                        variant={showCallToday ? "default" : "outline"}
                        onClick={() => setShowCallToday(!showCallToday)}
                        className="gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Appels du jour ({prospects.filter(p => {
                          const today = new Date().toDateString();
                          return p.prochaineAction && 
                            new Date(p.prochaineAction).toDateString() === today &&
                            !["Gagné", "Perdu", "Pas de réponse"].includes(p.statut || "");
                        }).length})
                      </Button>
                    </div>

                    {/* Advanced Filters */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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

              {/* Prospects Table */}
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
