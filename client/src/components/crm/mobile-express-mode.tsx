import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageCircle, Calendar, MapPin, Euro, User, ArrowRight, ChevronLeft, ChevronRight, Edit } from "lucide-react";
import type { Prospect } from "@shared/schema";

interface MobileExpressModeProps {
  prospects: Prospect[];
  onCall: (prospect: Prospect) => void;
  onWhatsApp: (prospect: Prospect) => void;
  onScheduleRDV: (prospect: Prospect) => void;
  onEdit?: (prospect: Prospect) => void;
}

export default function MobileExpressMode({ prospects, onCall, onWhatsApp, onScheduleRDV, onEdit }: MobileExpressModeProps) {
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
      <div className="max-w-md mx-auto space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-green-700">Mode Express - Prêt!</h3>
              <p className="text-gray-600 text-sm mb-4">Aucune action urgente pour le moment</p>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg space-y-1">
                <p className="font-medium">Express mode affiche automatiquement:</p>
                <p>🔥 Hot leads (score &gt; 80)</p>
                <p>📞 Rappels programmés aujourd'hui</p>
                <p>⚡ Nouveaux prospects urgents</p>
                <p>💰 Prospects haute valeur (&gt;500k€)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <h4 className="font-medium mb-2">💡 Prochaines actions:</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 rounded bg-blue-50 flex items-center justify-between">
                <span>📊 Vérifier la liste complète</span>
                <span className="text-xs text-blue-600">→ Liste</span>
              </div>
              <div className="p-2 rounded bg-green-50 flex items-center justify-between">
                <span>📱 Appeler prospects récents</span>
                <span className="text-xs text-green-600">→ Contact</span>
              </div>
              <div className="p-2 rounded bg-orange-50 flex items-center justify-between">
                <span>⚡ Programmer des rappels</span>
                <span className="text-xs text-orange-600">→ RDV</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Progress Indicator & Filter Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Action {currentIndex + 1} sur {priorityProspects.length}</span>
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
        <div className="flex items-center justify-center">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            🎯 Actions prioritaires détectées
          </span>
        </div>
        <div className="text-center text-xs text-gray-500">
          👈 Glissez pour naviguer • Tapez pour éditer
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
        
        {/* Navigation - only if multiple prospects */}
        {priorityProspects.length > 1 && (
          <div className="absolute top-4 left-4">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={nextProspect}
              className="h-8 w-8 p-0 mobile-button bg-white/80 backdrop-blur-sm"
              title="Prospect suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl truncate">{currentProspect.nomComplet}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{currentProspect.ville}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                  {currentProspect.type}
                </Badge>
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(currentProspect)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    title="Modifier les informations"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>
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
              className="flex flex-col gap-1 h-16 mobile-button"
              variant="outline"
              title={`Appeler ${currentProspect.nomComplet}`}
            >
              <Phone className="w-5 h-5" />
              <span className="text-xs">Appeler</span>
            </Button>
            
            <Button
              onClick={() => onWhatsApp(currentProspect)}
              className="flex flex-col gap-1 h-16 mobile-button"
              variant="outline"
              title={`Contacter ${currentProspect.nomComplet} par WhatsApp`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            
            <Button
              onClick={() => onScheduleRDV(currentProspect)}
              className="flex flex-col gap-1 h-16 mobile-button"
              variant="outline"
              title={`Programmer RDV avec ${currentProspect.nomComplet}`}
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