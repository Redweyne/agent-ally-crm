import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  MessageSquare, 
  Calendar, 
  User, 
  Crown,
  Edit
} from "lucide-react";
import HotLeadBadge from "./hot-lead-badge";
import SwipeProspectCard from "./swipe-prospect-card";
import TemplateMessages from "./template-messages";
import PullToRefresh from "./pull-to-refresh";
import type { Prospect } from "@shared/schema";

interface MobileProspectCardsProps {
  prospects: Prospect[];
  onEdit: (prospect: Prospect) => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

// Helper functions
const isReadyToSell = (prospect: any): boolean => {
  return !!(prospect.telephone && 
           prospect.consentement &&
           prospect.intention &&
           prospect.timeline &&
           prospect.ville &&
           (prospect.budget || prospect.prixEstime));
};

const isHotLead = (prospect: any): boolean => {
  const score = prospect.score || 0;
  const timeline = prospect.timeline || "";
  const timelineMonths = parseInt(timeline.split(' ')[0]) || 12;
  return score > 80 && timelineMonths < 3;
};

export default function MobileProspectCards({ 
  prospects, 
  onEdit, 
  onRefresh,
  isRefreshing = false 
}: MobileProspectCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Nouveau": "bg-gray-100 text-gray-800",
      "Contacté": "bg-blue-100 text-blue-800",
      "Qualifié": "bg-green-100 text-green-800",
      "RDV fixé": "bg-orange-100 text-orange-800",
      "Mandate Pending": "bg-yellow-100 text-yellow-800",
      "Mandat signé": "bg-purple-100 text-purple-800",
      "En négociation": "bg-amber-100 text-amber-800",
      "Gagné": "bg-emerald-100 text-emerald-800",
      "Perdu": "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const calculateExpectedValue = (prospect: Prospect) => {
    const price = prospect.prixEstime || prospect.budget || 0;
    const rate = prospect.tauxHonoraires || 0.04;
    const probability = getStatusProbability(prospect.statut!);
    const exclusiveBonus = prospect.exclusif ? 1.1 : 1;
    return price * rate * probability * exclusiveBonus;
  };

  const getStatusProbability = (status: string): number => {
    const probabilities: Record<string, number> = {
      "Nouveau": 0.05,
      "Contacté": 0.1,
      "Qualifié": 0.25,
      "RDV fixé": 0.5,
      "Mandat signé": 0.9,
      "Gagné": 1,
      "Perdu": 0,
      "Pas de réponse": 0.02,
    };
    return probabilities[status] || 0;
  };

  const createPhoneLink = (phone: string) => `tel:${phone?.replace(/\s+/g, "")}`;
  const createSMSLink = (phone: string) => `sms:${phone?.replace(/\s+/g, "")}`;

  const handleCall = (prospect: Prospect) => {
    if (prospect.telephone) {
      window.open(createPhoneLink(prospect.telephone), "_self");
    }
  };

  const handleSMS = (prospect: Prospect) => {
    if (prospect.telephone) {
      window.open(createSMSLink(prospect.telephone), "_self");
    }
  };

  const handleScheduleRDV = (prospect: Prospect) => {
    onEdit(prospect); // For now, redirect to edit form
  };

  if (prospects.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Aucun prospect trouvé</p>
      </div>
    );
  }

  const content = (
    <div className="space-y-4" data-testid="mobile-prospect-cards">
      {prospects.map((prospect) => (
        <SwipeProspectCard
          key={prospect.id}
          prospect={prospect}
          onEdit={onEdit}
          onCall={handleCall}
          onSMS={handleSMS}
          onScheduleRDV={handleScheduleRDV}
        />
      ))}
    </div>
  );

  if (onRefresh) {
    return (
      <PullToRefresh onRefresh={onRefresh} isRefreshing={isRefreshing}>
        {content}
      </PullToRefresh>
    );
  }

  return content;
}