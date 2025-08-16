import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageCircle, Calendar, MapPin, Euro, User, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Prospect } from "@shared/schema";

interface MobileExpressModeProps {
  prospects: Prospect[];
  onCall: (prospect: Prospect) => void;
  onWhatsApp: (prospect: Prospect) => void;
  onScheduleRDV: (prospect: Prospect) => void;
}

export default function MobileExpressMode({ prospects, onCall, onWhatsApp, onScheduleRDV }: MobileExpressModeProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    return parseInt(sessionStorage.getItem('mobile-express-index') || '0');
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const isDragging = useRef(false);

  // Persist current index
  useEffect(() => {
    sessionStorage.setItem('mobile-express-index', currentIndex.toString());
  }, [currentIndex]);
  
  // Filter prospects that need immediate attention
  const priorityProspects = prospects.filter(p => {
    const today = new Date().toDateString();
    const needsCall = p.prochaineAction && 
      new Date(p.prochaineAction).toDateString() === today &&
      !["Gagné", "Perdu", "Pas de réponse"].includes(p.statut || "");
    
    const isHotLead = (p.score && p.score > 80) || p.isHotLead;
    const isNewToday = p.creeLe && new Date(p.creeLe).toDateString() === today;
    
    return needsCall || isHotLead || isNewToday;
  }).sort((a, b) => (b.score || 0) - (a.score || 0));

  const currentProspect = priorityProspects[currentIndex];

  const nextProspect = () => {
    setCurrentIndex((prev) => (prev + 1) % priorityProspects.length);
  };

  const prevProspect = () => {
    setCurrentIndex((prev) => (prev - 1 + priorityProspects.length) % priorityProspects.length);
  };

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = startX.current - endX;
    const minSwipeDistance = 50;

    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        // Swiped left - next prospect
        nextProspect();
      } else {
        // Swiped right - previous prospect
        prevProspect();
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getUrgencyColor = (prospect: Prospect) => {
    if (prospect.score && prospect.score > 90) return "bg-red-500";
    if (prospect.score && prospect.score > 80) return "bg-orange-500";
    if (prospect.prochaineAction && new Date(prospect.prochaineAction).toDateString() === new Date().toDateString()) {
      return "bg-blue-500";
    }
    return "bg-green-500";
  };

  if (priorityProspects.length === 0) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun prospect prioritaire</h3>
            <p className="text-gray-500">Tous vos prospects sont à jour !</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Prospect {currentIndex + 1} sur {priorityProspects.length}</span>
        <div className="flex gap-1">
          {priorityProspects.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentIndex ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Prospect Card */}
      <Card 
        ref={cardRef}
        className="relative overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`absolute top-0 left-0 w-1 h-full ${getUrgencyColor(currentProspect)}`}></div>
        
        {/* Swipe indicators */}
        <div className="absolute top-4 right-4 flex items-center space-x-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={prevProspect}
            disabled={priorityProspects.length <= 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={nextProspect}
            disabled={priorityProspects.length <= 1}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{currentProspect.nomComplet}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{currentProspect.ville}</span>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-1">
                {currentProspect.type}
              </Badge>
              {currentProspect.score && (
                <div className="text-sm text-gray-500">
                  Score: {currentProspect.score}/100
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Key Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Budget:</span>
              <p className="font-medium">
                {formatCurrency(currentProspect.budget || currentProspect.prixEstime || 0)}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Statut:</span>
              <p className="font-medium">{currentProspect.statut}</p>
            </div>
            <div>
              <span className="text-gray-500">Source:</span>
              <p className="font-medium">{currentProspect.exactSource || currentProspect.source || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500">Timeline:</span>
              <p className="font-medium">{currentProspect.timeline || "—"}</p>
            </div>
          </div>

          {/* Notes */}
          {currentProspect.notes && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <span className="text-gray-500 text-sm">Notes:</span>
              <p className="text-sm mt-1">{currentProspect.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => onCall(currentProspect)}
              className="flex flex-col gap-1 h-16"
              variant="outline"
            >
              <Phone className="w-5 h-5" />
              <span className="text-xs">Appeler</span>
            </Button>
            
            <Button
              onClick={() => onWhatsApp(currentProspect)}
              className="flex flex-col gap-1 h-16"
              variant="outline"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            
            <Button
              onClick={() => onScheduleRDV(currentProspect)}
              className="flex flex-col gap-1 h-16"
              variant="outline"
            >
              <Calendar className="w-5 h-5" />
              <span className="text-xs">RDV</span>
            </Button>
          </div>

          {/* Navigation hint */}
          <div className="text-center text-xs text-gray-400 mt-2">
            Glissez ← → pour naviguer
          </div>
        </CardContent>
      </Card>
    </div>
  );
}