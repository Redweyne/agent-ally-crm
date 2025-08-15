import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";
import type { Prospect } from "@shared/schema";

interface HotLeadBadgeProps {
  prospect: Prospect;
}

export default function HotLeadBadge({ prospect }: HotLeadBadgeProps) {
  // Auto Hot Lead logic: score > 80 and timeline < 3 months
  const isHotLead = prospect.score && prospect.score > 80 && 
    prospect.timeline && 
    ["1 mois", "2 mois", "moins de 3 mois", "urgent"].includes(prospect.timeline.toLowerCase());

  if (!isHotLead && !prospect.isHotLead) return null;

  return (
    <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white animate-pulse">
      <Flame className="w-3 h-3 mr-1" />
      Hot Lead
    </Badge>
  );
}