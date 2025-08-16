import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Monitor, Apple } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DownloadDialogProps {
  children: React.ReactNode;
}

export function DownloadDialog({ children }: DownloadDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handlePWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({
          title: "Application installée",
          description: "L'application a été installée avec succès sur votre appareil",
        });
        setOpen(false);
      } else {
        showInstallInstructions('pwa');
      }
      setDeferredPrompt(null);
    } else {
      showInstallInstructions('pwa');
    }
  };

  const showInstallInstructions = (platform: string) => {
    const instructions = {
      Windows: {
        title: "Installation sur Windows",
        steps: [
          "1. Utilisez Chrome, Edge ou Firefox",
          "2. Cliquez sur l'icône d'installation dans la barre d'adresse",
          "3. Ou allez dans Menu > Installer RedLead2Guide",
          "4. L'application apparaîtra dans votre menu Démarrer"
        ]
      },
      Android: {
        title: "Installation sur Android",
        steps: [
          "1. Ouvrez cette page dans Chrome",
          "2. Appuyez sur le menu (3 points)",
          "3. Sélectionnez 'Ajouter à l'écran d'accueil'",
          "4. Confirmez l'installation",
          "5. L'icône apparaîtra sur votre écran d'accueil"
        ]
      },
      iOS: {
        title: "Installation sur iPhone/iPad",
        steps: [
          "1. Ouvrez cette page dans Safari",
          "2. Appuyez sur le bouton de partage (carré avec flèche)",
          "3. Faites défiler et appuyez sur 'Sur l'écran d'accueil'",
          "4. Personnalisez le nom si souhaité",
          "5. Appuyez sur 'Ajouter'"
        ]
      },
      pwa: {
        title: "Installation de l'application",
        steps: [
          "1. Utilisez un navigateur moderne (Chrome, Safari, Edge)",
          "2. Recherchez l'icône d'installation dans la barre d'adresse",
          "3. Ou utilisez le menu du navigateur",
          "4. Sélectionnez 'Installer l'application' ou 'Ajouter à l'écran d'accueil'"
        ]
      }
    };

    const instruction = instructions[platform as keyof typeof instructions];
    
    toast({
      title: instruction.title,
      description: (
        <div className="space-y-2">
          <p className="text-sm font-medium mb-2">Suivez ces étapes:</p>
          {instruction.steps.map((step, index) => (
            <p key={index} className="text-sm">{step}</p>
          ))}
        </div>
      ),
      duration: 8000,
    });
  };

  const handleDownload = async (platform: string) => {
    if (platform === 'pwa') {
      await handlePWAInstall();
      return;
    }

    // Try PWA installation first
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({
          title: "Application installée",
          description: "L'application a été installée avec succès sur votre appareil",
        });
        setOpen(false);
        return;
      }
    }

    // Show specific instructions for the platform
    showInstallInstructions(platform);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="download-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Télécharger l'application
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choisissez votre plateforme pour installer l'application CRM:
          </p>
          <div className="grid gap-3">
            <Button
              onClick={() => handleDownload('Windows')}
              className="flex items-center justify-start gap-3 h-12"
              variant="outline"
              data-testid="download-windows"
            >
              <Monitor className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Windows</div>
                <div className="text-xs text-gray-500">Application de bureau</div>
              </div>
            </Button>
            <Button
              onClick={() => handleDownload('Android')}
              className="flex items-center justify-start gap-3 h-12"
              variant="outline"
              data-testid="download-android"
            >
              <Smartphone className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Android</div>
                <div className="text-xs text-gray-500">Application mobile</div>
              </div>
            </Button>
            <Button
              onClick={() => handleDownload('iOS')}
              className="flex items-center justify-start gap-3 h-12"
              variant="outline"
              data-testid="download-ios"
            >
              <Apple className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">iOS</div>
                <div className="text-xs text-gray-500">Application iPhone/iPad</div>
              </div>
            </Button>
            {deferredPrompt && (
              <Button
                onClick={() => handleDownload('pwa')}
                className="flex items-center justify-start gap-3 h-12 bg-primary-600 hover:bg-primary-700 text-white"
                data-testid="download-pwa"
              >
                <Download className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Installation rapide</div>
                  <div className="text-xs text-primary-100">Installer maintenant</div>
                </div>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}