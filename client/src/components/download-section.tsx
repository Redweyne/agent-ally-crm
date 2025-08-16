import { Download, Smartphone, Monitor, Apple, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DownloadDialog } from "@/components/download-dialog";

export function DownloadSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50" data-testid="download-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" data-testid="download-title">
            Téléchargez l'application
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="download-description">
            Accédez à votre CRM partout, même hors ligne. Installation simple et rapide sur tous vos appareils.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Windows */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Windows</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Application de bureau complète avec toutes les fonctionnalités
              </p>
              <DownloadDialog>
                <Button 
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white group"
                  data-testid="download-card-windows"
                >
                  <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                  Télécharger
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </DownloadDialog>
              <div className="mt-4 text-xs text-gray-500">
                Compatible Chrome, Edge, Firefox
              </div>
            </CardContent>
          </Card>

          {/* Android */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-green-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Android</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Application mobile optimisée pour smartphone et tablette
              </p>
              <DownloadDialog>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white group"
                  data-testid="download-card-android"
                >
                  <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                  Télécharger
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </DownloadDialog>
              <div className="mt-4 text-xs text-gray-500">
                Via Chrome ou navigateur
              </div>
            </CardContent>
          </Card>

          {/* iOS */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-gray-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Apple className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">iPhone & iPad</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Experience native iOS avec toutes les fonctionnalités
              </p>
              <DownloadDialog>
                <Button 
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white group"
                  data-testid="download-card-ios"
                >
                  <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                  Télécharger
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </DownloadDialog>
              <div className="mt-4 text-xs text-gray-500">
                Via Safari uniquement
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center justify-center space-x-6 bg-white rounded-2xl px-8 py-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Mode hors ligne</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Synchronisation automatique</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Notifications push</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}