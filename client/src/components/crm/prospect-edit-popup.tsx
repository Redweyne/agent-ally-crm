import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Save, Phone, Mail, MapPin } from 'lucide-react';
import type { Prospect } from '@shared/schema';

interface ProspectEditPopupProps {
  prospect: Prospect | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProspect: any) => void;
}

export default function ProspectEditPopup({ prospect, isOpen, onClose, onSave }: ProspectEditPopupProps) {
  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (prospect) {
      setFormData({
        nomComplet: prospect.nomComplet || '',
        email: prospect.email || '',
        telephone: prospect.telephone || '',
        ville: prospect.ville || '',
        codePostal: prospect.codePostal || '',
        type: prospect.type || 'Acheteur',
        statut: prospect.statut || 'Nouveau',
        budget: prospect.budget || '',
        prixEstime: prospect.prixEstime || '',
        timeline: prospect.timeline || '',
        source: prospect.source || '',
        exactSource: prospect.exactSource || '',
        notes: prospect.notes || ''
      });
    }
  }, [prospect]);

  const handleSave = () => {
    if (!prospect) return;
    
    const updatedProspect = {
      ...prospect,
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      prixEstime: formData.prixEstime ? parseFloat(formData.prixEstime) : null,
      // Ensure date fields are properly handled
      creeLe: prospect.creeLe,
      prochaineAction: prospect.prochaineAction
    };
    
    onSave(updatedProspect);
    onClose();
  };

  if (!prospect) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold">
            Modifier le prospect
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Informations de contact
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="nomComplet" className="text-xs">Nom complet</Label>
                <Input
                  id="nomComplet"
                  value={formData.nomComplet}
                  onChange={(e) => setFormData({...formData, nomComplet: e.target.value})}
                  placeholder="Nom et prénom"
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemple.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="telephone" className="text-xs">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    placeholder="06 12 34 56 78"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="ville" className="text-xs">Ville</Label>
                  <Input
                    id="ville"
                    value={formData.ville}
                    onChange={(e) => setFormData({...formData, ville: e.target.value})}
                    placeholder="Ville"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="codePostal" className="text-xs">Code postal</Label>
                  <Input
                    id="codePostal"
                    value={formData.codePostal}
                    onChange={(e) => setFormData({...formData, codePostal: e.target.value})}
                    placeholder="75001"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Détails du projet
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="type" className="text-xs">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acheteur">Acheteur</SelectItem>
                    <SelectItem value="Vendeur">Vendeur</SelectItem>
                    <SelectItem value="Locataire">Locataire</SelectItem>
                    <SelectItem value="Bailleur">Bailleur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="statut" className="text-xs">Statut</Label>
                <Select value={formData.statut} onValueChange={(value) => setFormData({...formData, statut: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nouveau">Nouveau</SelectItem>
                    <SelectItem value="Contact">Contact</SelectItem>
                    <SelectItem value="RDV fixé">RDV fixé</SelectItem>
                    <SelectItem value="Négociation">Négociation</SelectItem>
                    <SelectItem value="Gagné">Gagné</SelectItem>
                    <SelectItem value="Perdu">Perdu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="budget" className="text-xs">
                  {formData.type === 'Vendeur' ? 'Prix estimé' : 'Budget'}
                </Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.type === 'Vendeur' ? formData.prixEstime : formData.budget}
                  onChange={(e) => {
                    if (formData.type === 'Vendeur') {
                      setFormData({...formData, prixEstime: e.target.value});
                    } else {
                      setFormData({...formData, budget: e.target.value});
                    }
                  }}
                  placeholder="€"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="timeline" className="text-xs">Timeline</Label>
                <Select value={formData.timeline} onValueChange={(value) => setFormData({...formData, timeline: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immédiat">Immédiat</SelectItem>
                    <SelectItem value="Cette semaine">Cette semaine</SelectItem>
                    <SelectItem value="Ce mois">Ce mois</SelectItem>
                    <SelectItem value="Dans 3 mois">Dans 3 mois</SelectItem>
                    <SelectItem value="Dans 6 mois">Dans 6 mois</SelectItem>
                    <SelectItem value="Plus tard">Plus tard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Source */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="source" className="text-xs">Source</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                  placeholder="Source principale"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="exactSource" className="text-xs">Source exacte</Label>
                <Input
                  id="exactSource"
                  value={formData.exactSource}
                  onChange={(e) => setFormData({...formData, exactSource: e.target.value})}
                  placeholder="Détail source"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-xs">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Notes et commentaires..."
              className="mt-1 h-20"
            />
          </div>

          {/* Current Score */}
          {prospect.score && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Score actuel</span>
              <Badge variant="outline" className="font-medium">
                {prospect.score}/100
              </Badge>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}