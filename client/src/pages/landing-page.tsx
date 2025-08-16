import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { 
  Users, TrendingUp, Calendar, ShieldCheck, Zap, Smartphone, 
  Phone, Mail, BarChart3, Check, ArrowRight, Star, Download,
  Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadDialog } from "@/components/download-dialog";
import { DownloadSection } from "@/components/download-section";

export default function LandingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/crm");
    }
  }, [user, navigate]);

  // Close mobile menu on scroll or outside click
  useEffect(() => {
    const handleScroll = () => setIsMobileMenuOpen(false);
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && !(event.target as Element).closest('nav')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      window.addEventListener('scroll', handleScroll);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="landing-page">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50" data-testid="navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-700" data-testid="logo">RedLead2Guide</h1>
              
              {/* Mobile quick icons */}
              <div className="md:hidden flex items-center ml-4 space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection("services")}
                  className="p-2 mobile-button"
                  title="Services"
                  data-testid="mobile-icon-services"
                >
                  <Users className="h-5 w-5 text-primary-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection("avantages")}
                  className="p-2 mobile-button"
                  title="Avantages"
                  data-testid="mobile-icon-avantages"
                >
                  <TrendingUp className="h-5 w-5 text-primary-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection("contact")}
                  className="p-2 mobile-button"
                  title="Contact"
                  data-testid="mobile-icon-contact"
                >
                  <Phone className="h-5 w-5 text-primary-600" />
                </Button>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
                data-testid="mobile-menu-toggle"
                title={isMobileMenuOpen ? "Plus d'options" : "Menu"}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <button 
                  onClick={() => scrollToSection("services")} 
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                  data-testid="link-services"
                >
                  Services
                </button>
                <button 
                  onClick={() => scrollToSection("avantages")} 
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                  data-testid="link-avantages"
                >
                  Avantages
                </button>
                <button 
                  onClick={() => scrollToSection("contact")} 
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                  data-testid="link-contact"
                >
                  Contact
                </button>
                <DownloadDialog>
                  <Button 
                    variant="outline"
                    className="border-primary-600 text-primary-600 hover:bg-primary-50"
                    data-testid="button-download"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </DownloadDialog>
                <Button 
                  onClick={() => navigate("/auth")} 
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                  data-testid="button-login"
                >
                  Connexion Agent
                </Button>
              </div>
            </div>
          </div>
          
          {/* Mobile navigation menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button
                  onClick={() => {
                    scrollToSection("services");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md w-full text-left"
                  data-testid="mobile-link-services"
                >
                  <Users className="h-5 w-5 mr-3" />
                  Services
                </button>
                
                <button
                  onClick={() => {
                    scrollToSection("avantages");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md w-full text-left"
                  data-testid="mobile-link-avantages"
                >
                  <TrendingUp className="h-5 w-5 mr-3" />
                  Avantages
                </button>
                
                <button
                  onClick={() => {
                    scrollToSection("contact");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md w-full text-left"
                  data-testid="mobile-link-contact"
                >
                  <Phone className="h-5 w-5 mr-3" />
                  Contact
                </button>
                
                <div className="pt-2 border-t border-gray-200">
                  <DownloadDialog>
                    <Button 
                      variant="outline"
                      className="flex items-center w-full justify-start border-primary-600 text-primary-600 hover:bg-primary-50 mb-2"
                      data-testid="mobile-button-download"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Download className="h-5 w-5 mr-3" />
                      Télécharger
                    </Button>
                  </DownloadDialog>
                  
                  <Button 
                    onClick={() => {
                      navigate("/auth");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full justify-start bg-primary-600 hover:bg-primary-700 text-white"
                    data-testid="mobile-button-login"
                  >
                    <ArrowRight className="h-5 w-5 mr-3" />
                    Connexion Agent
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 bg-gradient-to-br from-primary-700 to-primary-500 text-white" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in" data-testid="hero-title">
              CRM Immobilier
              <span className="block text-blue-200">Nouvelle Génération</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100" data-testid="hero-description">
              Gérez vos prospects, optimisez vos mandats et boostez vos performances commerciales avec notre solution 100% française
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate("/auth")} 
                className="bg-white text-primary-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-colors"
                size="lg"
                data-testid="button-dashboard"
              >
                Voir mon tableau de bord
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button 
                onClick={() => scrollToSection("services")} 
                variant="outline"
                className="border-2 border-white/80 text-white bg-transparent px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-primary-700 transition-all duration-300 backdrop-blur-sm"
                size="lg"
                data-testid="button-services"
              >
                Découvrir nos services
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <DownloadSection />

      {/* Services Section */}
      <section id="services" className="py-20 bg-white" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" data-testid="services-title">Nos Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="services-description">
              Des outils professionnels pour optimiser votre activité immobilière
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" data-testid="service-prospects">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Gestion des Prospects</h3>
              <p className="text-gray-600 mb-6">
                Centralisez tous vos contacts et suivez leur progression dans votre pipeline commercial avec notre système de scoring automatique.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Scoring automatique
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Suivi des interactions
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Alertes de relance
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" data-testid="service-analytics">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">KPI & Analytics</h3>
              <p className="text-gray-600 mb-6">
                Suivez vos performances en temps réel avec des indicateurs métier adaptés à l'immobilier français.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Valeur du pipeline
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Taux de conversion
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  SLA de réponse
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" data-testid="service-automation">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Automatisation</h3>
              <p className="text-gray-600 mb-6">
                Automatisez vos tâches répétitives et ne ratez plus aucune opportunité commerciale.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Relances automatiques
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Export PDF/CSV
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Création RDV (.ics)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section id="avantages" className="py-20 bg-gray-50" data-testid="advantages-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6" data-testid="advantages-title">Pourquoi choisir Redweyne ?</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-4 mt-1">
                    <ShieldCheck className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Français & RGPD</h3>
                    <p className="text-gray-600">
                      Solution développée en France, conforme RGPD avec hébergement sécurisé de vos données clients.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-4 mt-1">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Interface Intuitive</h3>
                    <p className="text-gray-600">
                      Design moderne et ergonomique pensé pour les professionnels de l'immobilier en France.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-4 mt-1">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile-First</h3>
                    <p className="text-gray-600">
                      Accédez à vos prospects et KPI depuis n'importe quel appareil, même en déplacement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-2">
                <div className="bg-gray-100 rounded-lg h-48 mb-4 flex items-center justify-center">
                  <BarChart3 className="w-16 h-16 text-gray-400" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-primary-100 rounded flex-1"></div>
                    <div className="h-8 bg-green-100 rounded flex-1"></div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-white rounded-2xl shadow-xl p-6 transform -rotate-1 -z-10">
                <div className="bg-gray-100 rounded-lg h-48 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white" data-testid="contact-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6" data-testid="contact-title">Prêt à booster vos ventes ?</h2>
          <p className="text-xl text-gray-600 mb-8" data-testid="contact-description">
            Rejoignez les agents immobiliers qui nous font confiance
          </p>
          <Button 
            onClick={() => navigate("/auth")} 
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            size="lg"
            data-testid="button-crm-access"
          >
            Accéder à mon CRM
            <Star className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4" data-testid="footer-brand">RedLead2Guide</h3>
              <p className="text-gray-300" data-testid="footer-tagline">
                CRM immobilier français pour les professionnels exigeants.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4" data-testid="footer-features-title">Fonctionnalités</h4>
              <ul className="space-y-2 text-gray-300">
                <li data-testid="footer-feature-1">Gestion des prospects</li>
                <li data-testid="footer-feature-2">Pipeline commercial</li>
                <li data-testid="footer-feature-3">KPI & Analytics</li>
                <li data-testid="footer-feature-4">Export & Automatisation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" data-testid="footer-contact-title">Contact</h4>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-center" data-testid="footer-email">
                  <Mail className="w-4 h-4 mr-2" />
                  support@redweyne.fr
                </p>
                <p className="flex items-center" data-testid="footer-phone">
                  <Phone className="w-4 h-4 mr-2" />
                  +33 1 23 45 67 89
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p data-testid="footer-copyright">&copy; 2024 RedLead2Guide. Tous droits réservés. Conforme RGPD.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
