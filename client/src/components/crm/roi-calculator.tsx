import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import type { Prospect } from "@shared/schema";

interface ROICalculatorProps {
  prospects: Prospect[];
  agentId?: string;
}

export default function ROICalculator({ prospects, agentId }: ROICalculatorProps) {
  const roiData = useMemo(() => {
    const filteredProspects = agentId 
      ? prospects.filter(p => p.agentId === agentId)
      : prospects;

    const totalLeadCost = filteredProspects.reduce((sum, p) => sum + (p.leadCost || 0), 0);
    const wonProspects = filteredProspects.filter(p => p.statut === "Gagné");
    
    const totalRevenue = wonProspects.reduce((sum, p) => {
      const commission = (p.prixEstime || p.budget || 0) * (p.tauxHonoraires || 0.04);
      return sum + commission;
    }, 0);

    const roi = totalLeadCost > 0 ? ((totalRevenue - totalLeadCost) / totalLeadCost) * 100 : 0;
    const conversionRate = filteredProspects.length > 0 ? (wonProspects.length / filteredProspects.length) * 100 : 0;
    
    const avgDealValue = wonProspects.length > 0 
      ? totalRevenue / wonProspects.length 
      : 0;

    const avgClosingTime = wonProspects.length > 0
      ? wonProspects.reduce((sum, p) => sum + (p.estimatedClosingDays || 30), 0) / wonProspects.length
      : 30;

    return {
      totalLeadCost,
      totalRevenue,
      roi,
      conversionRate,
      avgDealValue,
      avgClosingTime,
      totalProspects: filteredProspects.length,
      wonDeals: wonProspects.length
    };
  }, [prospects, agentId]);

  const formatEuro = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          ROI Agent {agentId ? "" : "(Global)"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Revenus générés</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-lg font-bold text-green-800">
              {formatEuro(roiData.totalRevenue)}
            </p>
          </div>

          <div className="p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-700">Coût des leads</span>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-lg font-bold text-red-800">
              {formatEuro(roiData.totalLeadCost)}
            </p>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-700">ROI</span>
          </div>
          <p className="text-2xl font-bold text-blue-800">
            {roiData.roi > 0 ? "+" : ""}{formatPercent(roiData.roi)}
          </p>
          <Badge variant={roiData.roi > 0 ? "default" : "destructive"} className="mt-2">
            {roiData.roi > 0 ? "Rentable" : "Non rentable"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Taux de conversion:</span>
            <p className="font-medium">{formatPercent(roiData.conversionRate)}</p>
          </div>
          <div>
            <span className="text-gray-600">Valeur moyenne:</span>
            <p className="font-medium">{formatEuro(roiData.avgDealValue)}</p>
          </div>
          <div>
            <span className="text-gray-600">Temps moyen de clôture:</span>
            <p className="font-medium">{Math.round(roiData.avgClosingTime)} jours</p>
          </div>
          <div>
            <span className="text-gray-600">Affaires gagnées:</span>
            <p className="font-medium">{roiData.wonDeals}/{roiData.totalProspects}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}