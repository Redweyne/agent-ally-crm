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
      }
      setDeferredPrompt(null);
      setOpen(false);
    } else {
      // Fallback for browsers that don't support PWA installation
      toast({
        title: "Installation PWA",
        description: "Pour installer l'application, utilisez le menu de votre navigateur et sélectionnez 'Installer l'application' ou 'Ajouter à l'écran d'accueil'",
      });
    }
  };

  const handleDownload = (platform: string) => {
    if (platform === 'pwa') {
      handlePWAInstall();
      return;
    }

    // For Windows, Android, iOS - trigger PWA installation or show instructions
    toast({
      title: `Installation ${platform}`,
      description: platform === 'Windows' 
        ? "Sur Windows, utilisez Chrome ou Edge et cliquez sur l'icône d'installation dans la barre d'adresse"
        : platform === 'Android'
        ? "Sur Android, utilisez Chrome et sélectionnez 'Ajouter à l'écran d'accueil' dans le menu"
        : "Sur iOS, utilisez Safari et sélectionnez 'Ajouter à l'écran d'accueil' dans le menu de partage",
    });
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