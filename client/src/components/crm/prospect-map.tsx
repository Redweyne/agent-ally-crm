import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  MessageSquare, 
  MapPin, 
  User,
  Crown,
  Loader2 
} from "lucide-react";
import HotLeadBadge from "./hot-lead-badge";
import type { Prospect } from "@shared/schema";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface ProspectMapProps {
  prospects: Prospect[];
  onEdit: (prospect: Prospect) => void;
  onCall?: (prospect: Prospect) => void;
  onSMS?: (prospect: Prospect) => void;
}

interface GeocodedProspect extends Prospect {
  lat?: number;
  lng?: number;
}

export default function ProspectMap({ prospects, onEdit, onCall, onSMS }: ProspectMapProps) {
  const [geocodedProspects, setGeocodedProspects] = useState<GeocodedProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom marker icons based on prospect status
  const createCustomIcon = (prospect: Prospect) => {
    const isHot = isHotLead(prospect);
    const color = isHot ? "#ef4444" : getStatusColor(prospect.statut!);
    
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 19.4 12.5 41 12.5 41S25 19.4 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="${color}"/>
          <circle cx="12.5" cy="12.5" r="8" fill="white"/>
          <circle cx="12.5" cy="12.5" r="5" fill="${color}"/>
        </svg>
      `)}`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  };

  const isHotLead = (prospect: Prospect): boolean => {
    const score = prospect.score || 0;
    const timeline = prospect.timeline || "";
    const timelineMonths = parseInt(timeline.split(' ')[0]) || 12;
    return score > 80 && timelineMonths < 3;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      "Nouveau": "#6b7280",
      "Contacté": "#3b82f6",
      "Qualifié": "#10b981",
      "RDV fixé": "#f59e0b",
      "Mandate Pending": "#eab308",
      "Mandat signé": "#8b5cf6",
      "En négociation": "#f59e0b",
      "Gagné": "#059669",
      "Perdu": "#dc2626",
    };
    return colors[status] || "#6b7280";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(value);
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
    };
    return probabilities[status] || 0;
  };

  // Cache for geocoded locations
  const geocodeCache = new Map<string, {lat: number, lng: number}>();

  // Fallback coordinates for common French cities/postal codes
  const getCoordinatesFromPostalCode = (codePostal: string, ville: string): {lat: number, lng: number} | null => {
    const postalPrefix = codePostal.substring(0, 2);
    const fallbackCoordinates: Record<string, {lat: number, lng: number}> = {
      '75': { lat: 48.8566, lng: 2.3522 }, // Paris
      '69': { lat: 45.7640, lng: 4.8357 }, // Lyon
      '13': { lat: 43.2965, lng: 5.3698 }, // Marseille
      '33': { lat: 44.8378, lng: -0.5792 }, // Bordeaux
      '06': { lat: 43.7102, lng: 7.2620 }, // Nice
      '31': { lat: 43.6047, lng: 1.4442 }, // Toulouse
      '67': { lat: 48.5734, lng: 7.7521 }, // Strasbourg
      '59': { lat: 50.6292, lng: 3.0573 }, // Lille
      '44': { lat: 47.2184, lng: -1.5536 }, // Nantes
      '35': { lat: 48.1173, lng: -1.6778 }, // Rennes
      '34': { lat: 43.6110, lng: 3.8767 }, // Montpellier
      '78': { lat: 48.8014, lng: 2.1301 }, // Yvelines
      '92': { lat: 48.8909, lng: 2.2368 }, // Hauts-de-Seine
      '94': { lat: 48.7901, lng: 2.4555 }, // Val-de-Marne
    };

    return fallbackCoordinates[postalPrefix] || null;
  };

  // Geocoding function using fallback first, then API
  const geocodePostalCode = async (codePostal: string, ville: string): Promise<{lat: number, lng: number} | null> => {
    const cacheKey = `${codePostal}-${ville}`;
    
    // Check cache first
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey)!;
    }

    // Try fallback coordinates first
    const fallbackCoords = getCoordinatesFromPostalCode(codePostal, ville);
    if (fallbackCoords) {
      geocodeCache.set(cacheKey, fallbackCoords);
      return fallbackCoords;
    }

    try {
      const query = `${codePostal} ${ville}, France`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=fr&limit=1`,
        {
          headers: {
            'User-Agent': 'RedweyneCRM/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const results = await response.json();
      if (results.length > 0) {
        const coords = {
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon)
        };
        geocodeCache.set(cacheKey, coords);
        return coords;
      }
      return null;
    } catch (error) {
      console.warn(`Failed to geocode ${codePostal} ${ville}:`, error);
      return null;
    }
  };

  // Geocode all prospects with postal codes
  useEffect(() => {
    const geocodeProspects = async () => {
      setLoading(true);
      setError(null);

      const prospectsWithLocation: GeocodedProspect[] = [];
      
      // Process prospects in batches to speed up loading
      const batchSize = 5;
      for (let i = 0; i < prospects.length; i += batchSize) {
        const batch = prospects.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (prospect) => {
          if (prospect.codePostal && prospect.ville) {
            const coordinates = await geocodePostalCode(prospect.codePostal, prospect.ville);
            if (coordinates) {
              return {
                ...prospect,
                lat: coordinates.lat,
                lng: coordinates.lng
              };
            }
          }
          return prospect;
        });

        const batchResults = await Promise.all(batchPromises);
        prospectsWithLocation.push(...batchResults);
        
        // Short delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setGeocodedProspects(prospectsWithLocation);
      setLoading(false);
    };

    if (prospects.length > 0) {
      geocodeProspects();
    } else {
      setGeocodedProspects([]);
      setLoading(false);
    }
  }, [prospects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  const prospectsWithCoordinates = geocodedProspects.filter(p => p.lat && p.lng);
  const prospectsWithoutLocation = geocodedProspects.filter(p => !p.lat || !p.lng);

  // Center map on France
  const franceCenter: [number, number] = [46.603354, 1.888334];

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <div className="h-96 w-full rounded-lg overflow-hidden relative z-10">
            <MapContainer
              center={franceCenter}
              zoom={6}
              className="h-full w-full relative"
              style={{ height: "100%", width: "100%", position: "relative", zIndex: 10 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {prospectsWithCoordinates.map((prospect) => (
                <Marker
                  key={prospect.id}
                  position={[prospect.lat!, prospect.lng!]}
                  icon={createCustomIcon(prospect)}
                >
                  <Popup className="prospect-popup">
                    <div className="p-2 min-w-[250px]">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-sm">{prospect.nomComplet || "Sans nom"}</h3>
                        {isHotLead(prospect) && <HotLeadBadge prospect={prospect} />}
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-600 mb-3">
                        <p>{prospect.telephone}</p>
                        <p>{prospect.ville} {prospect.codePostal}</p>
                        <p className="font-medium text-green-600">
                          {formatCurrency(calculateExpectedValue(prospect))}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {prospect.statut}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {prospect.type}
                        </Badge>
                        {prospect.exclusif && (
                          <Badge variant="outline" className="text-xs text-purple-600">
                            <Crown className="w-3 h-3 mr-1" />
                            Exclusif
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(prospect);
                          }}
                          className="flex-1"
                        >
                          Voir
                        </Button>
                        {prospect.telephone && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onCall?.(prospect)}
                            >
                              <Phone className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSMS?.(prospect)}
                            >
                              <MessageSquare className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Sur la carte</p>
                <p className="text-2xl font-bold text-green-600">{prospectsWithCoordinates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Sans localisation</p>
                <p className="text-2xl font-bold text-orange-600">{prospectsWithoutLocation.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prospects without location */}
      {prospectsWithoutLocation.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-600" />
              Prospects sans code postal ({prospectsWithoutLocation.length})
            </h3>
            <div className="space-y-2">
              {prospectsWithoutLocation.slice(0, 5).map((prospect) => (
                <div
                  key={prospect.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => onEdit(prospect)}
                >
                  <div>
                    <p className="font-medium text-sm">{prospect.nomComplet || "Sans nom"}</p>
                    <p className="text-xs text-gray-600">{prospect.ville || "Ville manquante"}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {prospect.statut}
                  </Badge>
                </div>
              ))}
              {prospectsWithoutLocation.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  +{prospectsWithoutLocation.length - 5} autres prospects sans localisation
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}