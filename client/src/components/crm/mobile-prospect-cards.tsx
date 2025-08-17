import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  MessageSquare, 
  Calendar, 
  User, 
  Crown
} from "lucide-react";
import HotLeadBadge from "./hot-lead-badge";
import type { Prospect } from "@shared/schema";

interface MobileProspectCardsProps {
  prospects: Prospect[];
  onEdit: (prospect: Prospect) => void;
  onDelete?: (id: string) => void;
}

// Helper functions
const isReadyToSell = (prospect: any): boolean => {
  return !!(prospect.telephone && 
           prospect.consentement &&
           prospect.intention &&
           prospect.timeline &&
           prospect.ville &&
           (prospect.budget || prospect.prixEstime) &&
           (prospect.liveTouches || 0) >= 1);
};

const isHotLead = (prospect: any): boolean => {
  const score = prospect.score || 0;
  const timeline = prospect.timeline || "";
  const timelineMonths = parseInt(timeline.split(' ')[0]) || 12;
  return score > 80 && timelineMonths < 3;
};

export default function MobileProspectCards({ prospects, onEdit }: MobileProspectCardsProps) {
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

  if (prospects.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Aucun prospect trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="mobile-prospect-cards">
      {prospects.map((prospect) => (
        <Card 
          key={prospect.id} 
          className="transition-all duration-200 hover:shadow-md card-hover"
          data-testid={`mobile-prospect-card-${prospect.id}`}
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
                    <h3 className="font-semibold text-gray-900 text-base truncate" data-testid={`prospect-name-${prospect.id}`}>
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
                    <p className="truncate">{prospect.type} • {prospect.typeBien}</p>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-lg font-bold text-green-600" data-testid={`prospect-value-${prospect.id}`}>
                  {formatCurrency(calculateExpectedValue(prospect))}
                </div>
                <div className="text-xs text-gray-500">Valeur attendue</div>
              </div>
            </div>
            
            {/* Status and Score */}
            <div className="flex items-center justify-between mb-4">
              <Badge className={getStatusColor(prospect.statut!)} data-testid={`prospect-status-${prospect.id}`}>
                {prospect.statut}
              </Badge>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {prospect.exclusif && (
                  <span className="flex items-center text-purple-600">
                    <Crown className="w-3 h-3 mr-1" />
                    Exclusif
                  </span>
                )}
                <span className="font-medium" data-testid={`prospect-score-${prospect.id}`}>
                  Score: {prospect.score}
                </span>
              </div>
            </div>
            
            {/* Price/Budget */}
            <div className="text-sm text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>Budget:</span>
                <span className="font-medium">{formatCurrency(prospect.budget || 0)}</span>
              </div>
              {prospect.prixEstime && prospect.prixEstime !== prospect.budget && (
                <div className="flex justify-between">
                  <span>Prix estimé:</span>
                  <span className="font-medium">{formatCurrency(prospect.prixEstime)}</span>
                </div>
              )}
            </div>
            
            {/* Action Buttons - Three prominent buttons with 44px+ touch targets */}
            <div className="grid grid-cols-3 gap-3">
              {prospect.telephone ? (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="min-h-[44px] text-sm font-medium mobile-touch"
                    onClick={() => window.open(createPhoneLink(prospect.telephone!), "_self")}
                    data-testid={`mobile-button-call-${prospect.id}`}
                    aria-label={`Appeler ${prospect.nomComplet}`}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Appel
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="min-h-[44px] text-sm font-medium mobile-touch"
                    onClick={() => window.open(createSMSLink(prospect.telephone!), "_self")}
                    data-testid={`mobile-button-sms-${prospect.id}`}
                    aria-label={`Envoyer SMS à ${prospect.nomComplet}`}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="min-h-[44px] text-sm font-medium mobile-touch"
                    onClick={() => onEdit(prospect)}
                    data-testid={`mobile-button-rdv-${prospect.id}`}
                    aria-label={`Planifier RDV avec ${prospect.nomComplet}`}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    RDV
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    disabled
                    className="min-h-[44px] text-sm font-medium opacity-50"
                    aria-label="Pas de téléphone disponible"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Appel
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    disabled
                    className="min-h-[44px] text-sm font-medium opacity-50"
                    aria-label="Pas de téléphone disponible"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="min-h-[44px] text-sm font-medium mobile-touch"
                    onClick={() => onEdit(prospect)}
                    data-testid={`mobile-button-edit-${prospect.id}`}
                    aria-label={`Modifier ${prospect.nomComplet}`}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}