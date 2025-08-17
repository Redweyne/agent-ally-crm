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
      "Nouveau": "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
      "Contacté": "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
      "Qualifié": "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
      "RDV fixé": "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
      "Mandate Pending": "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
      "Mandat signé": "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
      "En négociation": "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200",
      "Gagné": "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200",
      "Perdu": "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    };
    return colors[status] || "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
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
          {/* Header with name and value */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate mb-1">
                  {prospect.nomComplet || "Sans nom"}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="truncate">{prospect.telephone}</span>
                  {prospect.ville && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="truncate">{prospect.ville}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(calculateExpectedValue(prospect))}
              </div>
              <div className="text-xs text-gray-500">Valeur</div>
              <ChevronRight className="w-4 h-4 text-gray-400 mx-auto mt-1" />
            </div>
          </div>
          
          {/* Organized badges and info */}
          <div className="space-y-2">
            {/* Primary status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn(getStatusColor(prospect.statut!), "font-medium")}>
                {prospect.statut}
              </Badge>
              
              <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                {prospect.type}
              </Badge>
              
              {prospect.typeBien && (
                <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                  {prospect.typeBien}
                </Badge>
              )}
            </div>
            
            {/* Secondary indicators */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isHotLead(prospect) && <HotLeadBadge prospect={prospect} />}
                {isReadyToSell(prospect) && (
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs font-medium">
                    ✓ Ready
                  </Badge>
                )}
                {prospect.exclusif && (
                  <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Exclusif
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Score: <span className="text-gray-900 dark:text-white">{prospect.score}</span>
              </div>
            </div>
          </div>

          {/* Swipe hint */}
          {!isRevealed && prospect.telephone && (
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3 py-1">
              ← Glissez pour actions rapides
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}