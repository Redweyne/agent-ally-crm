import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Phone, 
  MessageSquare, 
  MessageCircle, 
  Calendar, 
  Edit, 
  Trash2, 
  User, 
  Crown,
  AlertTriangle 
} from "lucide-react";
import type { Prospect } from "@shared/schema";

interface ProspectTableProps {
  prospects: Prospect[];
  onEdit: (prospect: Prospect) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export default function ProspectTable({ prospects, onEdit, onDelete, compact = false }: ProspectTableProps) {
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
      "Mandat signé": "bg-purple-100 text-purple-800",
      "Gagné": "bg-emerald-100 text-emerald-800",
      "Perdu": "bg-red-100 text-red-800",
      "Pas de réponse": "bg-gray-100 text-gray-600",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTypeColor = (type: string) => {
    return type === "Vendeur" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800";
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
  const createWhatsAppLink = (phone: string) => 
    `https://wa.me/${phone?.replace(/[\s+\-]/g, "")}`;

  if (prospects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Aucun prospect trouvé</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="grid gap-4" data-testid="prospect-cards">
        {prospects.map((prospect) => (
          <Card key={prospect.id} className="transition-all duration-200 hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900" data-testid={`prospect-name-${prospect.id}`}>
                      {prospect.nomComplet || "Sans nom"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {prospect.type} • {prospect.typeBien} • {prospect.ville}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600" data-testid={`prospect-value-${prospect.id}`}>
                    {formatCurrency(calculateExpectedValue(prospect))}
                  </div>
                  <div className="text-sm text-gray-500">Valeur attendue</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <Badge className={getStatusColor(prospect.statut!)} data-testid={`prospect-status-${prospect.id}`}>
                  {prospect.statut}
                </Badge>
                {prospect.exclusif && (
                  <span className="flex items-center text-purple-600">
                    <Crown className="w-4 h-4 mr-1" />
                    Exclusif
                  </span>
                )}
                <span data-testid={`prospect-score-${prospect.id}`}>Score: {prospect.score}</span>
              </div>
              
              {prospect.motivation && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2" data-testid={`prospect-motivation-${prospect.id}`}>
                  {prospect.motivation}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {prospect.prochaineAction ? (
                    <span data-testid={`prospect-next-action-${prospect.id}`}>
                      Prochaine action: {new Date(prospect.prochaineAction).toLocaleDateString("fr-FR")}
                    </span>
                  ) : (
                    "Aucune action planifiée"
                  )}
                </div>
                <div className="flex space-x-1">
                  {prospect.telephone && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(createPhoneLink(prospect.telephone!), "_self")}
                        data-testid={`button-call-${prospect.id}`}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(createSMSLink(prospect.telephone!), "_self")}
                        data-testid={`button-sms-${prospect.id}`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(createWhatsAppLink(prospect.telephone!), "_blank")}
                        data-testid={`button-whatsapp-${prospect.id}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(prospect)}
                    data-testid={`button-edit-${prospect.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card data-testid="prospect-table">
      <CardHeader>
        <CardTitle>Liste des Prospects ({prospects.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prospects.map((prospect) => (
                <TableRow key={prospect.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900" data-testid={`prospect-name-${prospect.id}`}>
                          {prospect.nomComplet || "Sans nom"}
                        </div>
                        <div className="text-sm text-gray-500" data-testid={`prospect-contact-${prospect.id}`}>
                          {prospect.email && <div>{prospect.email}</div>}
                          {prospect.telephone && <div>{prospect.telephone}</div>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(prospect.type!)} data-testid={`prospect-type-${prospect.id}`}>
                      {prospect.type}
                    </Badge>
                    <div className="text-sm text-gray-500 mt-1">
                      {prospect.typeBien} • {prospect.ville}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(prospect.statut!)} data-testid={`prospect-status-${prospect.id}`}>
                      {prospect.statut}
                    </Badge>
                    {prospect.exclusif && (
                      <div className="flex items-center text-purple-600 text-xs mt-1">
                        <Crown className="w-3 h-3 mr-1" />
                        Exclusif
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900" data-testid={`prospect-value-${prospect.id}`}>
                      {formatCurrency(calculateExpectedValue(prospect))}
                    </div>
                    <div className="text-sm text-gray-500">
                      Prix: {formatCurrency(prospect.prixEstime || prospect.budget || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium" data-testid={`prospect-score-${prospect.id}`}>
                        {prospect.score}
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            prospect.score! >= 80 ? 'bg-green-500' : 
                            prospect.score! >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(prospect.score!, 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {prospect.telephone ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(createPhoneLink(prospect.telephone!), "_self")}
                            title="Appeler"
                            data-testid={`button-call-${prospect.id}`}
                          >
                            <Phone className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(createSMSLink(prospect.telephone!), "_self")}
                            title="SMS"
                            data-testid={`button-sms-${prospect.id}`}
                          >
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(createWhatsAppLink(prospect.telephone!), "_blank")}
                            title="WhatsApp"
                            data-testid={`button-whatsapp-${prospect.id}`}
                          >
                            <MessageCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled
                          title="Pas de téléphone"
                        >
                          <AlertTriangle className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(prospect)}
                        title="Modifier"
                        data-testid={`button-edit-${prospect.id}`}
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(prospect.id)}
                        title="Supprimer"
                        data-testid={`button-delete-${prospect.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
