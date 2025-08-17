import { useState, useRef, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  MessageSquare, 
  Calendar, 
  User, 
  Crown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import HotLeadBadge from "./hot-lead-badge";
import type { Prospect } from "@shared/schema";

interface SwipeProspectCardProps {
  prospect: Prospect;
  onEdit: (prospect: Prospect) => void;
  onCall?: (prospect: Prospect) => void;
  onSMS?: (prospect: Prospect) => void;
  onScheduleRDV?: (prospect: Prospect) => void;
}

export default function SwipeProspectCard({ 
  prospect, 
  onEdit, 
  onCall, 
  onSMS, 
  onScheduleRDV 
}: SwipeProspectCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaX = currentX - startX;
    const threshold = 80;
    
    if (deltaX < -threshold) {
      setIsRevealed(true);
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    } else if (deltaX > threshold && isRevealed) {
      setIsRevealed(false);
    }
    
    setIsDragging(false);
    setCurrentX(0);
    setStartX(0);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsRevealed(false);
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  const swipeOffset = isDragging ? Math.min(0, currentX - startX) : 0;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action Buttons Background */}
      <div className="absolute right-0 top-0 h-full flex items-center bg-gradient-to-l from-blue-500 to-green-500 px-4">
        <div className="flex gap-2">
          {prospect.telephone && (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 text-blue-600 hover:bg-white min-h-[40px] min-w-[40px]"
                onClick={() => handleAction(() => onCall?.(prospect))}
              >
                <Phone className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 text-green-600 hover:bg-white min-h-[40px] min-w-[40px]"
                onClick={() => handleAction(() => onSMS?.(prospect))}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 text-orange-600 hover:bg-white min-h-[40px] min-w-[40px]"
                onClick={() => handleAction(() => onScheduleRDV?.(prospect))}
              >
                <Calendar className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Card */}
      <Card 
        ref={cardRef}
        className={cn(
          "transition-transform duration-200 cursor-pointer relative z-10",
          isDragging ? "transition-none" : ""
        )}
        style={{
          transform: `translateX(${isRevealed ? -120 : swipeOffset}px)`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => !isDragging && onEdit(prospect)}
      >
        <CardContent className="p-4">
          {/* Header with name, badges and value */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-gray-900 text-base truncate">
                    {prospect.nomComplet || "Sans nom"}
                  </h3>
                  {isHotLead(prospect) && <HotLeadBadge prospect={prospect} />}
                  {isReadyToSell(prospect) && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      ✓ Ready
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="truncate">{prospect.telephone}</p>
                  <p className="truncate">{prospect.ville}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {prospect.type}
                    </Badge>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">{prospect.typeBien}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(calculateExpectedValue(prospect))}
              </div>
              <div className="text-xs text-gray-500">Valeur attendue</div>
              <ChevronRight className="w-4 h-4 text-gray-400 mx-auto mt-1" />
            </div>
          </div>
          
          {/* Status and Score */}
          <div className="flex items-center justify-between mb-2">
            <Badge className={getStatusColor(prospect.statut!)}>
              {prospect.statut}
            </Badge>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {prospect.exclusif && (
                <span className="flex items-center text-purple-600">
                  <Crown className="w-3 h-3 mr-1" />
                  Exclusif
                </span>
              )}
              <span className="font-medium">
                Score: {prospect.score}
              </span>
            </div>
          </div>

          {/* Swipe hint */}
          {!isRevealed && prospect.telephone && (
            <div className="text-xs text-gray-400 text-center mt-2">
              ← Glissez pour actions rapides
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}