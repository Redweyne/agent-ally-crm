import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Save, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Home,
  Euro,
  Clock,
  Star,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Prospect } from "@shared/schema";

interface MobileProspectFormProps {
  prospect?: Prospect | null;
  onSave: (prospect: any) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

export default function MobileProspectForm({ 
  prospect, 
  onSave, 
  onCancel, 
  mode 
}: MobileProspectFormProps) {
  const [formData, setFormData] = useState({
    nomComplet: prospect?.nomComplet || "",
    telephone: prospect?.telephone || "",
    email: prospect?.email || "",
    ville: prospect?.ville || "",
    type: prospect?.type || "Vendeur",
    typeBien: prospect?.typeBien || "Appartement",
    budget: prospect?.budget || 0,
    prixEstime: prospect?.prixEstime || 0,
    timeline: prospect?.timeline || "3-6 mois",
    intention: prospect?.intention || "Vendre",
    statut: prospect?.statut || "Nouveau",
    source: prospect?.source || "Site web",
    consentement: prospect?.consentement || false,
    exclusif: prospect?.exclusif || false,
    notes: prospect?.notes || "",
    tauxHonoraires: prospect?.tauxHonoraires || 0.04,
  });

  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Contact",
      icon: User,
      fields: ["nomComplet", "telephone", "email"]
    },
    {
      title: "Localisation", 
      icon: MapPin,
      fields: ["ville"]
    },
    {
      title: "Bien",
      icon: Home,
      fields: ["type", "typeBien"]
    },
    {
      title: "Budget",
      icon: Euro,
      fields: ["budget", "prixEstime", "tauxHonoraires"]
    },
    {
      title: "Détails",
      icon: Clock,
      fields: ["timeline", "intention", "statut", "source"]
    },
    {
      title: "Options",
      icon: Star,
      fields: ["consentement", "exclusif", "notes"]
    }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (stepIndex: number) => {
    const step = steps[stepIndex];
    return step.fields.every(field => {
      if (field === "consentement") return true; // Optional
      if (field === "notes") return true; // Optional
      const value = formData[field as keyof typeof formData];
      return value !== "" && value !== 0;
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    // Calculate score based on completeness and quality
    let score = 30; // Base score
    
    if (formData.telephone && formData.telephone.length >= 10) score += 20;
    if (formData.email && formData.email.includes('@')) score += 15;
    if (formData.budget > 0 || formData.prixEstime > 0) score += 20;
    if (formData.consentement) score += 15;
    
    const prospectData = {
      ...formData,
      score,
      id: prospect?.id || undefined,
      creeLe: prospect?.creeLe || new Date().toISOString(),
      modifieLe: new Date().toISOString()
    };

    onSave(prospectData);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = validateStep(currentStep);

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">
                {mode === 'create' ? 'Nouveau prospect' : 'Modifier prospect'}
              </h1>
              <p className="text-sm text-gray-500">
                Étape {currentStep + 1} sur {steps.length}: {currentStepData.title}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex space-x-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 h-2 rounded-full transition-colors",
                  index <= currentStep ? "bg-blue-500" : "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Form Content */}
      <main className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Step 0: Contact */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nomComplet">Nom complet *</Label>
                  <Input
                    id="nomComplet"
                    value={formData.nomComplet}
                    onChange={(e) => handleInputChange("nomComplet", e.target.value)}
                    placeholder="Jean Dupont"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="telephone">Téléphone *</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => handleInputChange("telephone", e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="jean.dupont@email.com"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Localisation */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ville">Ville *</Label>
                  <Input
                    id="ville"
                    value={formData.ville}
                    onChange={(e) => handleInputChange("ville", e.target.value)}
                    placeholder="Lyon"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Bien */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="type">Type de prospect *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vendeur">Vendeur</SelectItem>
                      <SelectItem value="Acheteur">Acheteur</SelectItem>
                      <SelectItem value="Investisseur">Investisseur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="typeBien">Type de bien *</Label>
                  <Select
                    value={formData.typeBien}
                    onValueChange={(value) => handleInputChange("typeBien", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Appartement">Appartement</SelectItem>
                      <SelectItem value="Maison">Maison</SelectItem>
                      <SelectItem value="Studio">Studio</SelectItem>
                      <SelectItem value="Local commercial">Local commercial</SelectItem>
                      <SelectItem value="Terrain">Terrain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Budget */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget">Budget/Prix souhaité (€)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange("budget", parseInt(e.target.value) || 0)}
                    placeholder="300000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="prixEstime">Prix estimé (€)</Label>
                  <Input
                    id="prixEstime"
                    type="number"
                    value={formData.prixEstime}
                    onChange={(e) => handleInputChange("prixEstime", parseInt(e.target.value) || 0)}
                    placeholder="320000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="tauxHonoraires">Taux honoraires (%)</Label>
                  <Input
                    id="tauxHonoraires"
                    type="number"
                    step="0.01"
                    value={formData.tauxHonoraires}
                    onChange={(e) => handleInputChange("tauxHonoraires", parseFloat(e.target.value) || 0.04)}
                    placeholder="4"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Défaut: 4%</p>
                </div>
              </div>
            )}

            {/* Step 4: Détails */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="timeline">Délai souhaité *</Label>
                  <Select
                    value={formData.timeline}
                    onValueChange={(value) => handleInputChange("timeline", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Immédiat">Immédiat</SelectItem>
                      <SelectItem value="1 mois">1 mois</SelectItem>
                      <SelectItem value="3 mois">3 mois</SelectItem>
                      <SelectItem value="3-6 mois">3-6 mois</SelectItem>
                      <SelectItem value="6-12 mois">6-12 mois</SelectItem>
                      <SelectItem value="Plus d'un an">Plus d'un an</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="intention">Intention *</Label>
                  <Select
                    value={formData.intention}
                    onValueChange={(value) => handleInputChange("intention", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vendre">Vendre</SelectItem>
                      <SelectItem value="Acheter">Acheter</SelectItem>
                      <SelectItem value="Louer">Louer</SelectItem>
                      <SelectItem value="Investir">Investir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="statut">Statut *</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => handleInputChange("statut", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nouveau">Nouveau</SelectItem>
                      <SelectItem value="Contacté">Contacté</SelectItem>
                      <SelectItem value="Qualifié">Qualifié</SelectItem>
                      <SelectItem value="RDV fixé">RDV fixé</SelectItem>
                      <SelectItem value="Mandate Pending">Mandate Pending</SelectItem>
                      <SelectItem value="Mandat signé">Mandat signé</SelectItem>
                      <SelectItem value="En négociation">En négociation</SelectItem>
                      <SelectItem value="Gagné">Gagné</SelectItem>
                      <SelectItem value="Perdu">Perdu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Source *</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => handleInputChange("source", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Site web">Site web</SelectItem>
                      <SelectItem value="Téléphone">Téléphone</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Référence">Référence</SelectItem>
                      <SelectItem value="Publicité">Publicité</SelectItem>
                      <SelectItem value="Réseaux sociaux">Réseaux sociaux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 5: Options */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="consentement">Consentement RGPD</Label>
                    <p className="text-sm text-gray-500">Autorisation de traitement des données</p>
                  </div>
                  <Switch
                    id="consentement"
                    checked={formData.consentement}
                    onCheckedChange={(checked) => handleInputChange("consentement", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="exclusif">Mandat exclusif</Label>
                    <p className="text-sm text-gray-500">Le prospect nous donne l'exclusivité</p>
                  </div>
                  <Switch
                    id="exclusif"
                    checked={formData.exclusif}
                    onCheckedChange={(checked) => handleInputChange("exclusif", checked)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Notes sur le prospect..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              Précédent
            </Button>
          )}
          
          {!isLastStep ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex-1"
            >
              Suivant
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? 'Créer' : 'Modifier'}
            </Button>
          )}
        </div>

        {/* Validation hints */}
        {!canProceed && (
          <p className="text-sm text-red-500 text-center mt-2">
            Veuillez remplir tous les champs obligatoires (*)
          </p>
        )}
      </footer>
    </div>
  );
}