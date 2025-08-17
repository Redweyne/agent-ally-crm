import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Phone, 
  MessageSquare, 
  Calendar,
  Users,
  Mic,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsFABProps {
  onAddProspect: () => void;
  onQuickCall?: () => void;
  onVoiceNote?: () => void;
  onQuickSchedule?: () => void;
  className?: string;
}

export default function QuickActionsFAB({ 
  onAddProspect,
  onQuickCall,
  onVoiceNote,
  onQuickSchedule,
  className 
}: QuickActionsFABProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsExpanded(false);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      {/* Quick Actions */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-in slide-in-from-bottom-4 duration-200">
          {onVoiceNote && (
            <Button
              onClick={() => handleAction(onVoiceNote)}
              className="h-12 w-12 rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg"
              title="Note vocale"
            >
              <Mic className="w-5 h-5 text-white" />
            </Button>
          )}
          
          {onQuickSchedule && (
            <Button
              onClick={() => handleAction(onQuickSchedule)}
              className="h-12 w-12 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg"
              title="Planning rapide"
            >
              <Calendar className="w-5 h-5 text-white" />
            </Button>
          )}
          
          {onQuickCall && (
            <Button
              onClick={() => handleAction(onQuickCall)}
              className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 shadow-lg"
              title="Appel rapide"
            >
              <Phone className="w-5 h-5 text-white" />
            </Button>
          )}
          
          <Button
            onClick={() => handleAction(onAddProspect)}
            className="h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg"
            title="Nouveau prospect"
          >
            <Users className="w-5 h-5 text-white" />
          </Button>
        </div>
      )}
      
      {/* Main FAB */}
      <Button
        onClick={toggleExpanded}
        className={cn(
          "h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg transition-all duration-200",
          isExpanded ? "rotate-45" : ""
        )}
      >
        {isExpanded ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Users className="w-6 h-6 text-white" />
        )}
      </Button>
    </div>
  );
}