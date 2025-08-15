import { Button } from "@/components/ui/button";
import { 
  Phone, 
  MessageSquare, 
  MessageCircle, 
  Calendar,
  FileDown,
  ExternalLink,
  Mail
} from "lucide-react";
import type { Prospect } from "@shared/schema";

interface QuickActionsProps {
  prospect: Prospect;
  onEdit?: () => void;
  compact?: boolean;
}

export default function QuickActions({ prospect, onEdit, compact = false }: QuickActionsProps) {
  const generateWhatsAppLink = (prospect: Prospect) => {
    const message = `Bonjour ${prospect.nomComplet}, je suis votre agent immobilier concernant votre projet ${prospect.type?.toLowerCase()} à ${prospect.ville}. Budget: ${formatCurrency(prospect.budget || 0)}. Pouvons-nous discuter de votre projet ?`;
    const phoneNumber = prospect.telephone?.replace(/\s/g, '').replace(/\+33/, '33');
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const generateEmailLink = (prospect: Prospect) => {
    const subject = `Votre projet immobilier à ${prospect.ville}`;
    const body = `Bonjour ${prospect.nomComplet},\n\nJe vous contacte concernant votre projet ${prospect.type?.toLowerCase()} à ${prospect.ville}.\n\nCordialement,\nVotre agent immobilier`;
    return `mailto:${prospect.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCall = () => {
    if (prospect.telephone) {
      window.open(`tel:${prospect.telephone}`, '_self');
    }
  };

  const handleWhatsApp = () => {
    window.open(generateWhatsAppLink(prospect), '_blank');
  };

  const handleEmail = () => {
    if (prospect.email) {
      window.open(generateEmailLink(prospect), '_self');
    }
  };

  const handleCalendar = () => {
    // Google Calendar integration would go here
    const eventTitle = `RDV avec ${prospect.nomComplet}`;
    const eventDetails = `Projet ${prospect.type} à ${prospect.ville} - Budget: ${formatCurrency(prospect.budget || 0)}`;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Tomorrow
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1); // 1 hour meeting
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&details=${encodeURIComponent(eventDetails)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const exportPDF = () => {
    // PDF export would go here
    console.log("Exporting PDF for prospect:", prospect.id);
  };

  if (compact) {
    return (
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={handleCall} title="Appeler">
          <Phone className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleWhatsApp} title="WhatsApp">
          <MessageCircle className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleEmail} title="Email">
          <Mail className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button size="sm" variant="outline" onClick={handleCall} className="gap-1">
        <Phone className="w-4 h-4" />
        Appeler
      </Button>
      <Button size="sm" variant="outline" onClick={handleWhatsApp} className="gap-1">
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </Button>
      <Button size="sm" variant="outline" onClick={handleEmail} className="gap-1">
        <Mail className="w-4 h-4" />
        Email
      </Button>
      <Button size="sm" variant="outline" onClick={handleCalendar} className="gap-1">
        <Calendar className="w-4 h-4" />
        RDV
      </Button>
      <Button size="sm" variant="outline" onClick={exportPDF} className="gap-1">
        <FileDown className="w-4 h-4" />
        PDF
      </Button>
    </div>
  );
}