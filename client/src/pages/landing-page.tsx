import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { 
  Users, TrendingUp, Calendar, ShieldCheck, Zap, Smartphone, 
  Phone, Mail, BarChart3, Check, ArrowRight, Star, Download,
  Menu, X, MapPin, MessageSquare, Crown, Mic, RefreshCw,
  Globe, Gauge, Eye, PieChart, Target, Headphones, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DownloadDialog } from "@/components/download-dialog";

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
      {/* Modern Revolutionary Navigation */}
      <nav className="fixed top-0 w-full bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-xl border-b border-white/10 z-50 shadow-2xl" data-testid="navigation">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-20">
            {/* Revolutionary Logo */}
            <div className="flex items-center group">
              <div className="flex-shrink-0 relative">
                {/* Glowing background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                
                <div className="relative bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                  <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent tracking-tight" data-testid="logo">
                    <span className="relative">
                      RedLead2Guide
                      {/* Subtle animated underline */}
                      <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </span>
                  </h1>
                </div>
              </div>
              
              {/* New badge */}
              <div className="hidden sm:block ml-3">
                <Badge className="bg-gradient-to-r from-green-400/20 to-emerald-400/20 text-green-100 border border-green-400/30 text-xs font-medium animate-pulse">
                  ✨ Mobile-First
                </Badge>
              </div>
            </div>
            
            {/* Modern Mobile Icons - Visible on small screens */}
            <div className="flex md:hidden space-x-1">
              <div className="flex items-center space-x-1 bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection("services")}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 text-white hover:text-blue-200"
                  title="Services"
                  data-testid="mobile-icon-services"
                >
                  <Users className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection("avantages")}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 text-white hover:text-green-200"
                  title="Avantages"
                  data-testid="mobile-icon-avantages"
                >
                  <TrendingUp className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection("contact")}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 text-white hover:text-purple-200"
                  title="Contact"
                  data-testid="mobile-icon-contact"
                >
                  <Phone className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Futuristic Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-3 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 hover:from-white/20 hover:to-white/10 transition-all duration-300 text-white"
                data-testid="mobile-menu-toggle"
                title={isMobileMenuOpen ? "Fermer" : "Menu"}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
            
            {/* Futuristic Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10 mr-6">
                <button 
                  onClick={() => scrollToSection("services")} 
                  className="text-white/90 hover:text-white hover:bg-white/10 px-6 py-3 text-sm font-medium transition-all duration-200 rounded-xl"
                  data-testid="link-services"
                >
                  Services
                </button>
                <button 
                  onClick={() => scrollToSection("avantages")} 
                  className="text-white/90 hover:text-white hover:bg-white/10 px-6 py-3 text-sm font-medium transition-all duration-200 rounded-xl"
                  data-testid="link-avantages"
                >
                  Avantages
                </button>
                <button 
                  onClick={() => scrollToSection("contact")} 
                  className="text-white/90 hover:text-white hover:bg-white/10 px-6 py-3 text-sm font-medium transition-all duration-200 rounded-xl"
                  data-testid="link-contact"
                >
                  Contact
                </button>
              </div>
              
              <DownloadDialog>
                <Button 
                  variant="outline"
                  className="border-2 border-white/30 text-white bg-transparent hover:bg-white hover:text-gray-900 transition-all duration-300 rounded-2xl px-6 py-3 font-medium backdrop-blur-sm"
                  data-testid="button-download"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </DownloadDialog>
              
              <Button 
                onClick={() => navigate("/auth")} 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-8 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border border-white/20"
                data-testid="button-login"
              >
                <span className="flex items-center">
                  🚀 Connexion Agent
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Button>
            </div>
          </div>
          
          {/* Futuristic Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 bg-gradient-to-b from-slate-900/98 to-purple-900/98 backdrop-blur-xl">
              <div className="px-4 pt-4 pb-6 space-y-3 relative">
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 rounded-b-2xl"></div>
                
                <div className="relative space-y-2">
                  <button
                    onClick={() => {
                      scrollToSection("services");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center px-4 py-3 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-2xl w-full text-left transition-all duration-200 backdrop-blur-sm"
                    data-testid="mobile-link-services"
                  >
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mr-4">
                      <Users className="h-5 w-5 text-blue-300" />
                    </div>
                    Services
                    <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                  </button>
                  
                  <button
                    onClick={() => {
                      scrollToSection("avantages");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center px-4 py-3 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-2xl w-full text-left transition-all duration-200 backdrop-blur-sm"
                    data-testid="mobile-link-avantages"
                  >
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mr-4">
                      <TrendingUp className="h-5 w-5 text-green-300" />
                    </div>
                    Avantages
                    <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                  </button>
                  
                  <button
                    onClick={() => {
                      scrollToSection("contact");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center px-4 py-3 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-2xl w-full text-left transition-all duration-200 backdrop-blur-sm"
                    data-testid="mobile-link-contact"
                  >
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mr-4">
                      <Phone className="h-5 w-5 text-purple-300" />
                    </div>
                    Contact
                    <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                  </button>
                  
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <DownloadDialog>
                      <Button 
                        variant="outline"
                        className="flex items-center w-full justify-start border-2 border-white/30 text-white bg-transparent hover:bg-white hover:text-gray-900 rounded-2xl py-3 px-4 font-medium transition-all duration-300 backdrop-blur-sm"
                        data-testid="mobile-button-download"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mr-4">
                          <Download className="h-5 w-5" />
                        </div>
                        Télécharger
                        <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                      </Button>
                    </DownloadDialog>
                    
                    <Button 
                      onClick={() => {
                        navigate("/auth");
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl py-3 px-4 font-bold transition-all duration-300 shadow-xl"
                      data-testid="mobile-button-login"
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                        <span className="text-lg">🚀</span>
                      </div>
                      Connexion Agent
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white relative overflow-hidden" data-testid="hero-section">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJtIDQwIDAgaCAtNDAgdiA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 relative">
          <div className="text-center">
            {/* Main headline */}
            <div className="mb-6">
              <Badge className="bg-white/20 text-white border-white/30 mb-4 px-4 py-2 text-sm font-medium">
                🚀 CRM Mobile-First • Nouvelle Génération
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" data-testid="hero-title">
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  RedLead2Guide
                </span>
                <span className="block text-3xl md:text-4xl font-medium text-blue-200 mt-2">
                  Le CRM immobilier qui révolutionne votre métier
                </span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto text-blue-100 leading-relaxed" data-testid="hero-description">
              <strong className="text-white">One-handed mobile experience</strong> • Carte interactive • Voice notes • Swipe actions • 
              Pipeline intelligent • ROI tracking • Automation complète
            </p>
            
            {/* Key features highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <Smartphone className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <h3 className="font-semibold text-white">Mobile-First</h3>
                <p className="text-blue-200 text-sm">Usage une main optimisé</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <MapPin className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <h3 className="font-semibold text-white">Carte Interactive</h3>
                <p className="text-blue-200 text-sm">Géolocalisation prospects</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <Bot className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <h3 className="font-semibold text-white">IA Intégrée</h3>
                <p className="text-blue-200 text-sm">Scoring & automation</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                onClick={() => navigate("/auth")} 
                className="bg-white text-blue-900 px-10 py-6 rounded-2xl text-lg font-bold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                size="lg"
                data-testid="button-dashboard"
              >
                🎯 Accès CRM Agents
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>

              <Button 
                onClick={() => scrollToSection("features")} 
                variant="outline"
                className="border-2 border-white/60 text-white bg-transparent px-10 py-6 rounded-2xl text-lg font-bold hover:bg-white hover:text-blue-900 transition-all duration-300 backdrop-blur-sm"
                size="lg"
                data-testid="button-features"
              >
                <Eye className="mr-2 h-6 w-6" />
                Découvrir les fonctionnalités
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary Mobile Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="bg-blue-100 text-blue-800 mb-4 px-4 py-2 text-sm font-medium">
              🏆 #1 CRM Mobile France
            </Badge>
            <h2 className="text-5xl font-bold text-gray-900 mb-6" data-testid="features-title">
              Fonctionnalités Révolutionnaires
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed" data-testid="features-description">
              Conçu par des agents immobiliers, pour des agents immobiliers. 
              Chaque fonctionnalité est pensée pour <strong>maximiser votre productivité</strong> et vos revenus.
            </p>
          </div>

          {/* Mobile-First Features Grid */}
          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            {/* Mobile Experience Card */}
            <Card className="p-8 border-2 border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-0">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4">
                    <Smartphone className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Mobile-First Experience</h3>
                    <Badge className="bg-green-100 text-green-800 text-xs">RÉVOLUTIONNAIRE</Badge>
                  </div>
                </div>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  Première interface CRM immobilier conçue pour l'usage <strong>une main</strong> sur smartphone.
                  Swipez, tapez, gérez vos prospects en déplacement comme jamais.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <ArrowRight className="w-5 h-5 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 text-sm">Swipe Actions</h4>
                    <p className="text-gray-600 text-xs">Appel/SMS/RDV en un geste</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-green-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 text-sm">Pull-to-Refresh</h4>
                    <p className="text-gray-600 text-xs">Rafraîchir d'un geste</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <Mic className="w-5 h-5 text-purple-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 text-sm">Voice Notes</h4>
                    <p className="text-gray-600 text-xs">Prise de notes vocale en français</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <Target className="w-5 h-5 text-orange-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 text-sm">Touch Targets</h4>
                    <p className="text-gray-600 text-xs">44px minimum, feedback haptique</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Map Card */}
            <Card className="p-8 border-2 border-green-100 hover:border-green-200 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-0">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mr-4">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Carte Interactive</h3>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">NOUVEAUTÉ</Badge>
                  </div>
                </div>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  Visualisez tous vos prospects sur une <strong>carte de France interactive</strong>. 
                  Géolocalisation automatique, clustering intelligent, optimisation des tournées.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Géolocalisation automatique par code postal</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Markers colorés selon le statut prospect</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Pop-ups détaillées avec actions rapides</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Statistiques en temps réel</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Intelligence Row */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-6 border border-purple-100 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Business Intelligence</h3>
                <p className="text-gray-600 mb-4">
                  ROI calculator, mandate tracking, lead scoring automatique, hot leads detection
                </p>
                <ul className="text-sm text-gray-600 space-y-2 text-left">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Calcul ROI automatique
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Hot leads auto-détection
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Status "Mandate Pending"
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="p-6 border border-blue-100 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Gauge className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics Avancés</h3>
                <p className="text-gray-600 mb-4">
                  Pipeline visualization, KPIs métier, reporting automatique, dashboard temps-réel
                </p>
                <ul className="text-sm text-gray-600 space-y-2 text-left">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Valeur pipeline temps-réel
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Taux conversion par source
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Call-to-action tracking
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6 border border-orange-100 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Automation Complète</h3>
                <p className="text-gray-600 mb-4">
                  SMS templates, WhatsApp intégration, notifications intelligentes, workflow automation
                </p>
                <ul className="text-sm text-gray-600 space-y-2 text-left">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Templates SMS personnalisés
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Intégration WhatsApp
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Notifications push intelligentes
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Prêt à révolutionner votre activité immobilière ?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Rejoignez les centaines d'agents qui ont déjà boosté leur CA avec RedLead2Guide
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button 
              onClick={() => navigate("/auth")} 
              className="bg-white text-blue-600 px-10 py-6 rounded-2xl text-lg font-bold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-2xl"
              size="lg"
            >
              🚀 Démarrer maintenant
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">+47%</div>
              <div className="text-blue-200 text-sm">Augmentation CA moyen</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">2.3h</div>
              <div className="text-blue-200 text-sm">Temps gagné par jour</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">94%</div>
              <div className="text-blue-200 text-sm">Agents satisfaits</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">RedLead2Guide</h3>
              <p className="text-gray-300 mb-6 max-w-md">
                Le CRM immobilier mobile-first qui révolutionne la façon dont les agents gèrent leurs prospects et maximisent leurs revenus.
              </p>
              <div className="flex items-center gap-4">
                <Badge className="bg-green-100 text-green-800">✓ 100% Français</Badge>
                <Badge className="bg-blue-100 text-blue-800">✓ RGPD</Badge>
                <Badge className="bg-purple-100 text-purple-800">✓ Mobile-First</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Fonctionnalités</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Mobile-first design</li>
                <li>Carte interactive</li>
                <li>Voice notes français</li>
                <li>Swipe actions</li>
                <li>ROI tracking</li>
                <li>Hot leads detection</li>
                <li>Templates SMS</li>
                <li>Automation complète</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  support@redlead2guide.fr
                </p>
                <p className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  +33 1 23 45 67 89
                </p>
                <p className="text-sm text-gray-400 mt-4">
                  Support technique disponible<br />
                  Lun-Ven 9h-18h
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 RedLead2Guide. Tous droits réservés. Conforme RGPD.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Fièrement développé en France 🇫🇷</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
