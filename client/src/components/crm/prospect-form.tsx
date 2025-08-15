import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, X } from "lucide-react";
import type { Prospect } from "@shared/schema";

interface ProspectFormProps {
  prospect: Prospect | null;
  onSave: (data: Partial<Prospect>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const prospectSchema = z.object({
  id: z.string().optional(),
  nomComplet: z.string().min(1, "Le nom est requis"),
  telephone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  type: z.enum(["Vendeur", "Acheteur"]),
  ville: z.string().optional(),
  typeBien: z.string().optional(),
  budget: z.number().min(0).optional(),
  prixEstime: z.number().min(0).optional(),
  tauxHonoraires: z.number().min(0).max(1).optional(),
  exclusif: z.boolean().optional(),
  motivation: z.string().optional(),
  timeline: z.string().optional(),
  intention: z.string().optional(),
  source: z.string().optional(),
  consentement: z.boolean().optional(),
  statut: z.string().optional(),
  adresse: z.string().optional(),
  notes: z.string().optional(),
});

type ProspectFormData = z.infer<typeof prospectSchema>;

const STATUSES = [
  "Nouveau",
  "Contacté",
  "Qualifié", 
  "RDV fixé",
  "Mandat signé",
  "Gagné",
  "Perdu",
  "Pas de réponse"
];

const TIMELINES = [
  "< 1 mois",
  "1-3 mois",
  "3-6 mois",
  "6-12 mois",
  "> 12 mois"
];

export default function ProspectForm({ prospect, onSave, onCancel, isLoading = false }: ProspectFormProps) {
  const isEdit = !!prospect;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProspectFormData>({
    resolver: zodResolver(prospectSchema),
    defaultValues: {
      nomComplet: "",
      telephone: "",
      email: "",
      type: "Vendeur",
      ville: "",
      typeBien: "Appartement",
      budget: 0,
      prixEstime: 0,
      tauxHonoraires: 0.04,
      exclusif: false,
      motivation: "",
      timeline: "3-6 mois",
      intention: "",
      source: "Ajout manuel",
      consentement: false,
      statut: "Nouveau",
      adresse: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (prospect) {
      // Reset form with prospect data
      reset({
        ...prospect,
        budget: prospect.budget || 0,
        prixEstime: prospect.prixEstime || 0,
        tauxHonoraires: prospect.tauxHonoraires || 0.04,
        exclusif: prospect.exclusif || false,
        consentement: prospect.consentement || false,
        nomComplet: prospect.nomComplet || "",
        telephone: prospect.telephone || "",
        email: prospect.email || "",
        ville: prospect.ville || "",
        typeBien: prospect.typeBien || "",
        motivation: prospect.motivation || "",
        timeline: prospect.timeline || "",
        intention: prospect.intention || "",
        source: prospect.source || "",
        statut: prospect.statut || "Nouveau",
        adresse: prospect.adresse || "",
        notes: prospect.notes || "",
      });
    }
  }, [prospect, reset]);

  const onSubmit = (data: ProspectFormData) => {
    // Generate ID for new prospects
    const prospectData = {
      ...data,
      id: isEdit ? prospect.id : `P-${Math.floor(Math.random() * 9000 + 1000)}`,
      creeLe: isEdit ? prospect.creeLe : new Date().toISOString(),
    };

    onSave(prospectData);
  };

  const typeValue = watch("type");

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="prospect-form">
        <DialogHeader>
          <DialogTitle data-testid="form-title">
            {isEdit ? "Modifier le prospect" : "Nouveau prospect"}
          </DialogTitle>
          <DialogDescription data-testid="form-description">
            {isEdit ? "Modifiez les informations du prospect" : "Ajoutez un nouveau prospect à votre pipeline"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informations de base</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomComplet">Nom complet *</Label>
                <Input
                  id="nomComplet"
                  {...register("nomComplet")}
                  placeholder="Prénom Nom"
                  data-testid="input-nom-complet"
                />
                {errors.nomComplet && (
                  <p className="text-sm text-red-600" data-testid="error-nom-complet">
                    {errors.nomComplet.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={typeValue}
                  onValueChange={(value) => setValue("type", value as "Vendeur" | "Acheteur")}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vendeur">Vendeur</SelectItem>
                    <SelectItem value="Acheteur">Acheteur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  {...register("telephone")}
                  placeholder="+33 6 12 34 56 78"
                  data-testid="input-telephone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="contact@example.com"
                  data-testid="input-email"
                />
                {errors.email && (
                  <p className="text-sm text-red-600" data-testid="error-email">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Bien immobilier</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  {...register("ville")}
                  placeholder="Nantes"
                  data-testid="input-ville"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="typeBien">Type de bien</Label>
                <Select
                  value={watch("typeBien")}
                  onValueChange={(value) => setValue("typeBien", value)}
                >
                  <SelectTrigger data-testid="select-type-bien">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Appartement">Appartement</SelectItem>
                    <SelectItem value="Maison">Maison</SelectItem>
                    <SelectItem value="Terrain">Terrain</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Immeuble">Immeuble</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Délai</Label>
                <Select
                  value={watch("timeline")}
                  onValueChange={(value) => setValue("timeline", value)}
                >
                  <SelectTrigger data-testid="select-timeline">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMELINES.map((timeline) => (
                      <SelectItem key={timeline} value={timeline}>
                        {timeline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {typeValue === "Acheteur" ? (
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (€)</Label>
                  <Input
                    id="budget"
                    type="number"
                    {...register("budget", { valueAsNumber: true })}
                    placeholder="450000"
                    data-testid="input-budget"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="prixEstime">Prix estimé (€)</Label>
                  <Input
                    id="prixEstime"
                    type="number"
                    {...register("prixEstime", { valueAsNumber: true })}
                    placeholder="320000"
                    data-testid="input-prix-estime"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="tauxHonoraires">Taux honoraires</Label>
                <Input
                  id="tauxHonoraires"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  {...register("tauxHonoraires", { valueAsNumber: true })}
                  placeholder="0.04"
                  data-testid="input-taux-honoraires"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={watch("statut")}
                  onValueChange={(value) => setValue("statut", value)}
                >
                  <SelectTrigger data-testid="select-statut">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informations complémentaires</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  {...register("source")}
                  placeholder="Google Ads - Landing"
                  data-testid="input-source"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intention">Intention</Label>
                <Input
                  id="intention"
                  {...register("intention")}
                  placeholder="Estimation + mise en vente"
                  data-testid="input-intention"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                {...register("adresse")}
                placeholder="Rue, quartier..."
                data-testid="input-adresse"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation">Motivation</Label>
              <Textarea
                id="motivation"
                {...register("motivation")}
                placeholder="Déménagement professionnel en septembre..."
                rows={3}
                data-testid="textarea-motivation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Très réactif, préfère appel le midi..."
                rows={2}
                data-testid="textarea-notes"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="exclusif"
                  checked={watch("exclusif")}
                  onCheckedChange={(checked) => setValue("exclusif", checked)}
                  data-testid="switch-exclusif"
                />
                <Label htmlFor="exclusif">Mandat exclusif</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="consentement"
                  checked={watch("consentement")}
                  onCheckedChange={(checked) => setValue("consentement", checked)}
                  data-testid="switch-consentement"
                />
                <Label htmlFor="consentement">Consentement RGPD</Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="button-cancel"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              data-testid="button-save"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? "Sauvegarder" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
