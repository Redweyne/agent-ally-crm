import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Sparkles } from "lucide-react";

export default function DemoBanner() {
  return (
    <Alert className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <Info className="h-4 w-4 text-blue-600" />
      </div>
      <AlertDescription className="text-blue-800 font-medium">
        <strong>Mode Démonstration</strong> - Vous utilisez une version de test du CRM Redweyne. 
        Toutes les données sont fictives et destinées à l'évaluation des fonctionnalités.
      </AlertDescription>
    </Alert>
  );
}