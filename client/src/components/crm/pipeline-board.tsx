import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  MapPin, 
  Building2, 
  Euro, 
  Crown, 
  Phone, 
  MessageSquare, 
  Calendar, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import type { Prospect } from "@shared/schema";

interface PipelineBoardProps {
  prospects: Prospect[];
  onUpdateStatus: (id: string, status: string) => void;
}

const STATUSES = [
  "Nouveau",
  "Contacté", 
  "Qualifié",
  "RDV fixé",
  "Mandat signé",
  "Gagné"
];

const STATUS_COLORS: Record<string, string> = {
  "Nouveau": "bg-gray-100 border-gray-200",
  "Contacté": "bg-blue-50 border-blue-200",
  "Qualifié": "bg-green-50 border-green-200",
  "RDV fixé": "bg-orange-50 border-orange-200",
  "Mandat signé": "bg-purple-50 border-purple-200",
  "Gagné": "bg-emerald-50 border-emerald-200",
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  "Nouveau": "bg-gray-200 text-gray-700",
  "Contacté": "bg-blue-200 text-blue-700",
  "Qualifié": "bg-green-200 text-green-700", 
  "RDV fixé": "bg-orange-200 text-orange-700",
  "Mandat signé": "bg-purple-200 text-purple-700",
  "Gagné": "bg-emerald-200 text-emerald-700",
};

export default function PipelineBoard({ prospects, onUpdateStatus }: PipelineBoardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", { 
      style: "currency", 
      currency: "EUR",
      minimumFractionDigits: 0 
    }).format(value);
  };

  const columns = useMemo(() => {
    const cols: Record<string, Prospect[]> = {};
    STATUSES.forEach(status => {
      cols[status] = prospects.filter(p => p.statut === status);
    });
    return cols;
  }, [prospects]);

  const moveProspect = (prospect: Prospect, direction: 1 | -1) => {
    const currentIndex = STATUSES.indexOf(prospect.statut!);
    const newIndex = currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < STATUSES.length) {
      onUpdateStatus(prospect.id, STATUSES[newIndex]);
    }
  };

  const createPhoneLink = (phone: string) => `tel:${phone?.replace(/\s+/g, "")}`;
  const createSMSLink = (phone: string) => `sms:${phone?.replace(/\s+/g, "")}`;

  return (
    <div className="flex flex-col space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:gap-3 lg:gap-4 md:space-y-0" data-testid="pipeline-board">
      {STATUSES.map((status) => (
        <div key={status} className={`rounded-xl p-3 sm:p-4 min-h-[400px] sm:min-h-[500px] ${STATUS_COLORS[status]}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900" data-testid={`column-title-${status}`}>
              {status}
            </h3>
            <Badge 
              className={STATUS_BADGE_COLORS[status]} 
              data-testid={`column-count-${status}`}
            >
              {columns[status]?.length || 0}
            </Badge>
          </div>
          
          <div className="space-y-2 sm:space-y-3" data-testid={`column-prospects-${status}`}>
            {columns[status]?.map((prospect) => (
              <Card 
                key={prospect.id} 
                className="cursor-pointer transition-all duration-200 hover:shadow-md border-gray-200 bg-white"
                data-testid={`prospect-card-${prospect.id}`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-1" data-testid={`prospect-name-${prospect.id}`}>
                      {prospect.nomComplet || "Sans nom"}
                    </h4>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveProspect(prospect, -1)}
                        disabled={STATUSES.indexOf(prospect.statut!) === 0}
                        className="min-h-[32px] min-w-[32px] p-0 sm:h-6 sm:w-6"
                        data-testid={`button-move-back-${prospect.id}`}
                        aria-label={`Déplacer ${prospect.nomComplet} vers l'étape précédente`}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveProspect(prospect, 1)}
                        disabled={STATUSES.indexOf(prospect.statut!) === STATUSES.length - 1}
                        className="min-h-[32px] min-w-[32px] p-0 sm:h-6 sm:w-6"
                        data-testid={`button-move-forward-${prospect.id}`}
                        aria-label={`Déplacer ${prospect.nomComplet} vers l'étape suivante`}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2" data-testid={`prospect-motivation-${prospect.id}`}>
                    {prospect.motivation || "Aucune motivation renseignée"}
                  </p>
                  
                  <div className="text-xs text-gray-500 mb-3 space-y-1">
                    <div className="flex items-center" data-testid={`prospect-location-${prospect.id}`}>
                      <MapPin className="w-3 h-3 mr-1" />
                      {prospect.ville || "—"}
                    </div>
                    <div className="flex items-center" data-testid={`prospect-property-${prospect.id}`}>
                      <Building2 className="w-3 h-3 mr-1" />
                      {prospect.typeBien || "—"}
                    </div>
                    <div className="flex items-center" data-testid={`prospect-price-${prospect.id}`}>
                      <Euro className="w-3 h-3 mr-1" />
                      {formatCurrency(prospect.prixEstime || prospect.budget || 0)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {prospect.exclusif && (
                        <Badge 
                          variant="outline" 
                          className="text-purple-600 border-purple-200 bg-purple-50 text-xs"
                          data-testid={`prospect-exclusive-${prospect.id}`}
                        >
                          <Crown className="w-3 h-3 mr-1" />
                          Excl.
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        data-testid={`prospect-score-${prospect.id}`}
                      >
                        {prospect.score}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-1">
                      {prospect.telephone && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(createPhoneLink(prospect.telephone!), "_self")}
                            title="Appeler"
                            className="min-h-[32px] min-w-[32px] p-0 sm:h-6 sm:w-6"
                            data-testid={`button-call-${prospect.id}`}
                            aria-label={`Appeler ${prospect.nomComplet}`}
                          >
                            <Phone className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(createSMSLink(prospect.telephone!), "_self")}
                            title="SMS"
                            className="min-h-[32px] min-w-[32px] p-0 sm:h-6 sm:w-6"
                            data-testid={`button-sms-${prospect.id}`}
                            aria-label={`Envoyer SMS à ${prospect.nomComplet}`}
                          >
                            <MessageSquare className="w-3 h-3 text-blue-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {prospect.prochaineAction && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center text-xs text-gray-500" data-testid={`prospect-next-action-${prospect.id}`}>
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(prospect.prochaineAction).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {columns[status]?.length === 0 && (
              <div className="text-center text-gray-400 py-8" data-testid={`empty-column-${status}`}>
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun prospect</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
