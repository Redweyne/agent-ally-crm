import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, 
  Search, 
  Check, 
  Star, 
  Clock, 
  Phone, 
  X 
} from "lucide-react";

interface MobileFilterDrawerProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  minBudget: string;
  setMinBudget: (budget: string) => void;
  maxBudget: string;
  setMaxBudget: (budget: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  showReadyToSell: boolean;
  setShowReadyToSell: (show: boolean) => void;
  showHotLeads: boolean;
  setShowHotLeads: (show: boolean) => void;
  showDueToday: boolean;
  setShowDueToday: (show: boolean) => void;
  showCallToday: boolean;
  setShowCallToday: (show: boolean) => void;
  callTodayCount: number;
  activeFiltersCount: number;
}

export default function MobileFilterDrawer({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  minBudget,
  setMinBudget,
  maxBudget,
  setMaxBudget,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  showReadyToSell,
  setShowReadyToSell,
  showHotLeads,
  setShowHotLeads,
  showDueToday,
  setShowDueToday,
  showCallToday,
  setShowCallToday,
  callTodayCount,
  activeFiltersCount
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const clearAllFilters = () => {
    setSearchQuery("");
    setTypeFilter("Tous");
    setStatusFilter("Tous");
    setMinBudget("");
    setMaxBudget("");
    setSortBy("date");
    setSortOrder("desc");
    setShowReadyToSell(false);
    setShowHotLeads(false);
    setShowDueToday(false);
    setShowCallToday(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="lg"
          className="relative min-h-[44px] gap-2"
          data-testid="mobile-filters-button"
          aria-label="Ouvrir les filtres"
        >
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center justify-between">
            <SheetTitle>Filtres et recherche</SheetTitle>
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Tout effacer
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <div className="space-y-6 py-6">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Nom, téléphone, email, ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-[44px]"
                data-testid="mobile-search-input"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900">Filtres rapides</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={showReadyToSell ? "default" : "outline"}
                onClick={() => setShowReadyToSell(!showReadyToSell)}
                className="min-h-[44px] justify-start gap-2"
                data-testid="mobile-filter-ready"
              >
                <Check className="h-4 w-4" />
                <span className="text-sm">Ready to Sell</span>
              </Button>
              
              <Button
                variant={showHotLeads ? "default" : "outline"}
                onClick={() => setShowHotLeads(!showHotLeads)}
                className="min-h-[44px] justify-start gap-2"
                data-testid="mobile-filter-hot"
              >
                <Star className="h-4 w-4" />
                <span className="text-sm">Hot Leads</span>
              </Button>
              
              <Button
                variant={showDueToday ? "default" : "outline"}
                onClick={() => setShowDueToday(!showDueToday)}
                className="min-h-[44px] justify-start gap-2"
                data-testid="mobile-filter-due"
              >
                <Clock className="h-4 w-4" />
                <span className="text-sm">Échéance aujourd'hui</span>
              </Button>
              
              <Button
                variant={showCallToday ? "default" : "outline"}
                onClick={() => setShowCallToday(!showCallToday)}
                className="min-h-[44px] justify-start gap-2"
                data-testid="mobile-filter-call"
              >
                <Phone className="h-4 w-4" />
                <span className="text-sm">À appeler ({callTodayCount})</span>
              </Button>
            </div>
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous">Tous types</SelectItem>
                  <SelectItem value="Vendeur">Vendeurs</SelectItem>
                  <SelectItem value="Acheteur">Acheteurs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="min-h-[44px]">
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
            </div>
          </div>

          {/* Budget Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Budget (€)</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Minimum"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="min-h-[44px]"
                data-testid="mobile-budget-min"
              />
              <Input
                type="number"
                placeholder="Maximum"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="min-h-[44px]"
                data-testid="mobile-budget-max"
              />
            </div>
          </div>

          {/* Sorting */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Trier par</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="hot-first">Hot First</SelectItem>
                  <SelectItem value="value">Valeur (€)</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="name">Nom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Ordre</label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Décroissant</SelectItem>
                  <SelectItem value="asc">Croissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={() => setIsOpen(false)}
              className="w-full min-h-[48px] text-base font-medium"
              data-testid="mobile-apply-filters"
            >
              Appliquer les filtres
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}