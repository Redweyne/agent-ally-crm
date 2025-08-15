import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, Mail, MessageSquare, User, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Prospect, ContactInteraction } from "@shared/schema";

interface ContactTimelineProps {
  prospect: Prospect;
  interactions: ContactInteraction[];
  onAddInteraction: (interaction: Partial<ContactInteraction>) => void;
}

export default function ContactTimeline({ prospect, interactions, onAddInteraction }: ContactTimelineProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: "call",
    description: "",
    outcome: "neutral"
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      case "sms": return <MessageSquare className="w-4 h-4" />;
      case "meeting": return <Calendar className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "positive": return "bg-green-100 text-green-800 border-green-200";
      case "negative": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleSubmit = () => {
    onAddInteraction({
      ...newInteraction,
      prospectId: prospect.id,
    });
    setNewInteraction({ type: "call", description: "", outcome: "neutral" });
    setShowAddForm(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Historique des contacts</CardTitle>
        <Button 
          size="sm" 
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select value={newInteraction.type} onValueChange={(value) => 
                setNewInteraction(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Appel</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="meeting">Rendez-vous</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newInteraction.outcome} onValueChange={(value) => 
                setNewInteraction(prev => ({ ...prev, outcome: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positif</SelectItem>
                  <SelectItem value="neutral">Neutre</SelectItem>
                  <SelectItem value="negative">Négatif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea 
              placeholder="Description de l'interaction..."
              value={newInteraction.description}
              onChange={(e) => setNewInteraction(prev => ({ ...prev, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} size="sm">Enregistrer</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} size="sm">Annuler</Button>
            </div>
          </div>
        )}

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {interactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun contact enregistré</p>
          ) : (
            interactions.map((interaction) => (
              <div key={interaction.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
                  {getIcon(interaction.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium capitalize">{interaction.type}</span>
                    <Badge className={getOutcomeColor(interaction.outcome || "neutral")}>
                      {interaction.outcome === "positive" ? "Positif" : 
                       interaction.outcome === "negative" ? "Négatif" : "Neutre"}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {format(new Date(interaction.timestamp!), "dd MMM à HH:mm", { locale: fr })}
                    </span>
                  </div>
                  <p className="text-gray-700">{interaction.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}