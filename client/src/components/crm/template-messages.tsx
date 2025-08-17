import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageSquare, 
  Copy, 
  ExternalLink,
  Clock,
  Calendar,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateMessagesProps {
  prospectName: string;
  prospectPhone: string;
  onSendMessage?: (message: string) => void;
}

const templates = [
  {
    id: "first_contact",
    title: "Premier contact",
    category: "initial",
    message: "Bonjour {name}, je suis {agent} de votre agence immobilière. Avez-vous 5 minutes pour discuter de votre projet immobilier ?",
    tags: ["nouveau", "introduction"]
  },
  {
    id: "follow_up",
    title: "Relance après appel",
    category: "follow_up", 
    message: "Bonjour {name}, suite à notre conversation, je vous envoie les informations dont nous avons parlé. N'hésitez pas si vous avez des questions !",
    tags: ["relance", "suivi"]
  },
  {
    id: "rdv_confirmation",
    title: "Confirmation RDV",
    category: "appointment",
    message: "Bonjour {name}, je vous confirme notre rendez-vous demain à {time}. À très bientôt !",
    tags: ["rdv", "confirmation"]
  },
  {
    id: "property_match",
    title: "Bien trouvé",
    category: "property",
    message: "Bonjour {name}, j'ai trouvé un bien qui pourrait vous intéresser ! Voulez-vous que je vous envoie les détails ?",
    tags: ["bien", "match"]
  },
  {
    id: "market_update",
    title: "Point marché", 
    category: "market",
    message: "Bonjour {name}, je voulais faire un point sur l'évolution du marché dans votre secteur. Avez-vous quelques minutes ?",
    tags: ["marché", "actualité"]
  },
  {
    id: "price_estimate",
    title: "Estimation prix",
    category: "valuation",
    message: "Bonjour {name}, votre estimation est prête ! Je peux vous l'envoyer par email ou nous pouvons en discuter au téléphone. Que préférez-vous ?",
    tags: ["estimation", "prix"]
  }
];

export default function TemplateMessages({ prospectName, prospectPhone, onSendMessage }: TemplateMessagesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const personalizeMessage = (template: string, name: string) => {
    return template
      .replace('{name}', name || 'Bonjour')
      .replace('{agent}', 'votre conseiller')
      .replace('{time}', '14h30'); // Could be dynamic
  };

  const handleCopyMessage = async (templateId: string, message: string) => {
    const personalizedMessage = personalizeMessage(message, prospectName);
    
    try {
      await navigator.clipboard.writeText(personalizedMessage);
      setCopiedId(templateId);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }
      
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleSendSMS = (message: string) => {
    const personalizedMessage = personalizeMessage(message, prospectName);
    const smsUrl = `sms:${prospectPhone?.replace(/\s+/g, "")}?body=${encodeURIComponent(personalizedMessage)}`;
    window.open(smsUrl, "_self");
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleSendWhatsApp = (message: string) => {
    const personalizedMessage = personalizeMessage(message, prospectName);
    const whatsappUrl = `https://wa.me/${prospectPhone?.replace(/\s+/g, "")}?text=${encodeURIComponent(personalizedMessage)}`;
    window.open(whatsappUrl, "_blank");
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      initial: "bg-blue-100 text-blue-800",
      follow_up: "bg-green-100 text-green-800", 
      appointment: "bg-orange-100 text-orange-800",
      property: "bg-purple-100 text-purple-800",
      market: "bg-yellow-100 text-yellow-800",
      valuation: "bg-pink-100 text-pink-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="lg"
          className="min-h-[44px] gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Messages types
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages types pour {prospectName || "ce prospect"}
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4 max-h-[calc(80vh-120px)] overflow-y-auto">
          {templates.map((template) => {
            const personalizedMessage = personalizeMessage(template.message, prospectName);
            
            return (
              <Card 
                key={template.id}
                className={cn(
                  "transition-all duration-200 cursor-pointer",
                  selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                )}
                onClick={() => setSelectedTemplate(
                  selectedTemplate === template.id ? null : template.id
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-base">{template.title}</h3>
                      <Badge className={getCategoryColor(template.category)} variant="outline">
                        {template.category}
                      </Badge>
                    </div>
                    {copiedId === template.id && (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="w-3 h-3 mr-1" />
                        Copié
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    {personalizedMessage}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {selectedTemplate === template.id && (
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyMessage(template.id, template.message);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copier
                      </Button>
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendSMS(template.message);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        SMS
                      </Button>
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendWhatsApp(template.message);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-green-600"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="text-xs text-gray-500 text-center mt-4 p-3 bg-gray-50 rounded-lg">
          <p>💡 Astuce: Les messages sont personnalisés automatiquement avec le nom du prospect</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}