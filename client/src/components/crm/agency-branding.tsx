import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload, Save } from "lucide-react";

interface AgencyBrandingProps {
  onSave: (branding: AgencyBranding) => void;
}

interface AgencyBranding {
  agencyName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  customFont?: string;
}

export default function AgencyBranding({ onSave }: AgencyBrandingProps) {
  const [branding, setBranding] = useState<AgencyBranding>({
    agencyName: "Redweyne Immobilier",
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b",
  });

  useEffect(() => {
    // Apply branding to document root
    document.documentElement.style.setProperty('--primary', `hsl(${hexToHsl(branding.primaryColor)})`);
    document.documentElement.style.setProperty('--secondary', `hsl(${hexToHsl(branding.secondaryColor)})`);
  }, [branding.primaryColor, branding.secondaryColor]);

  const hexToHsl = (hex: string): string => {
    // Convert hex to HSL for CSS variables
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBranding(prev => ({ ...prev, logo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(branding);
  };

  const presetColors = [
    { name: "Bleu", primary: "#3b82f6", secondary: "#64748b" },
    { name: "Vert", primary: "#10b981", secondary: "#6b7280" },
    { name: "Rouge", primary: "#ef4444", secondary: "#6b7280" },
    { name: "Violet", primary: "#8b5cf6", secondary: "#6b7280" },
    { name: "Orange", primary: "#f97316", secondary: "#6b7280" },
    { name: "Rose", primary: "#ec4899", secondary: "#6b7280" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Personnalisation de l'agence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agency Name */}
        <div className="space-y-2">
          <Label htmlFor="agencyName">Nom de l'agence</Label>
          <Input
            id="agencyName"
            value={branding.agencyName}
            onChange={(e) => setBranding(prev => ({ ...prev, agencyName: e.target.value }))}
            placeholder="Nom de votre agence"
          />
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label htmlFor="logo">Logo</Label>
          <div className="flex items-center gap-4">
            {branding.logo && (
              <img src={branding.logo} alt="Logo" className="w-12 h-12 object-contain rounded border" />
            )}
            <div className="flex-1">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('logo')?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Choisir un logo
              </Button>
            </div>
          </div>
        </div>

        {/* Color Presets */}
        <div className="space-y-2">
          <Label>Thèmes prédéfinis</Label>
          <div className="grid grid-cols-3 gap-2">
            {presetColors.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                onClick={() => setBranding(prev => ({ 
                  ...prev, 
                  primaryColor: preset.primary, 
                  secondaryColor: preset.secondary 
                }))}
                className="h-12 flex flex-col gap-1"
              >
                <div className="flex gap-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: preset.primary }}
                  ></div>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: preset.secondary }}
                  ></div>
                </div>
                <span className="text-xs">{preset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Couleur principale</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={branding.primaryColor}
                onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-12 h-10 p-1 rounded border"
              />
              <Input
                value={branding.primaryColor}
                onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Couleur secondaire</Label>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                type="color"
                value={branding.secondaryColor}
                onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="w-12 h-10 p-1 rounded border"
              />
              <Input
                value={branding.secondaryColor}
                onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                placeholder="#64748b"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Custom Font */}
        <div className="space-y-2">
          <Label htmlFor="customFont">Police personnalisée (Google Fonts)</Label>
          <Input
            id="customFont"
            value={branding.customFont || ""}
            onChange={(e) => setBranding(prev => ({ ...prev, customFont: e.target.value }))}
            placeholder="ex: Inter, Roboto, Open Sans"
          />
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Aperçu</Label>
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: branding.primaryColor + '10',
              borderColor: branding.primaryColor,
              fontFamily: branding.customFont || 'inherit'
            }}
          >
            <div className="flex items-center gap-3">
              {branding.logo && (
                <img src={branding.logo} alt="Logo" className="w-8 h-8 object-contain" />
              )}
              <div>
                <h3 
                  className="font-semibold"
                  style={{ color: branding.primaryColor }}
                >
                  {branding.agencyName}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: branding.secondaryColor }}
                >
                  CRM Immobilier
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full gap-2">
          <Save className="w-4 h-4" />
          Sauvegarder la personnalisation
        </Button>
      </CardContent>
    </Card>
  );
}