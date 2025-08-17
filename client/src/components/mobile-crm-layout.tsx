import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, MessageSquare, Calendar, User, TrendingUp, 
  Plus, Search, Filter, LogOut, Menu, X, Home
} from 'lucide-react';
import MobileExpressMode from '@/components/crm/mobile-express-mode';
import QuickActionsFAB from '@/components/crm/quick-actions-fab';
import VoiceNotes from '@/components/crm/voice-notes';
import MobileProspectForm from '@/components/crm/mobile-prospect-form';

import type { Prospect } from '@shared/schema';

interface MobileCRMLayoutProps {
  user: any;
  prospects: Prospect[];
  kpis: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onCall: (prospect: Prospect) => void;
  onWhatsApp: (prospect: Prospect) => void;
  onScheduleRDV: (prospect: Prospect) => void;
  onCreateProspect: () => void;
  onEditProspect?: (prospect: Prospect) => void;
  onSaveProspect?: (prospect: any) => void;
}

export default function MobileCRMLayout({
  user,
  prospects,
  kpis,
  activeTab,
  setActiveTab,
  onLogout,
  onCall,
  onWhatsApp,
  onScheduleRDV,
  onCreateProspect,
  onEditProspect,
  onSaveProspect
}: MobileCRMLayoutProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'express' | 'list'>(() => {
    return (sessionStorage.getItem('mobile-view') as 'dashboard' | 'express' | 'list') || 'dashboard';
  });
  const [showMenu, setShowMenu] = useState(false);
  const [showVoiceNotes, setShowVoiceNotes] = useState(false);
  const [showProspectForm, setShowProspectForm] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);

  // Persist view state
  React.useEffect(() => {
    sessionStorage.setItem('mobile-view', activeView);
  }, [activeView]);

  const priorityProspects = prospects.filter(p => {
    const today = new Date().toDateString();
    const needsCall = p.prochaineAction && 
      new Date(p.prochaineAction).toDateString() === today &&
      !["Gagné", "Perdu", "Pas de réponse"].includes(p.statut || "");
    
    const isHotLead = (p.score && p.score > 80) || p.isHotLead;
    const isNewToday = p.creeLe && new Date(p.creeLe).toDateString() === today;
    
    return needsCall || isHotLead || isNewToday;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RL</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white">RedLead2Guide</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost" 
              size="sm" 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 mobile-button"
              title={showMenu ? "Fermer menu" : "Ouvrir menu"}
            >
              {showMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Tabs - Only visible when in Accueil (dashboard) view */}
        {activeView === 'dashboard' && (
          <div className="px-4 pb-2">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide mobile-scroll">
              {[
                { id: 'tableau', label: 'Tableau' },
                { id: 'prospects', label: 'Prospects' },
                { id: 'pipeline', label: 'Pipeline' },
                { id: 'opportunites', label: 'Opps' }
              ].map(tab => (
                <Button
                  key={tab.id}
                  size="sm"
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-shrink-0 text-xs px-3 py-1 mobile-button"
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {showMenu && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg z-40">
            <div className="p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={onCreateProspect}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau prospect
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left text-red-600"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20">
        {activeView === 'dashboard' && activeTab === 'tableau' && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Nouveaux</p>
                      <p className="text-lg font-semibold">{kpis.newToday}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">RDV</p>
                      <p className="text-lg font-semibold">{kpis.upcomingRdv}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Priority Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                  Actions prioritaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Prospects à appeler aujourd'hui</span>
                  <Badge variant="secondary">{priorityProspects.length}</Badge>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    className="flex-1 mobile-button" 
                    size="sm"
                    onClick={() => setActiveView('express')}
                    disabled={priorityProspects.length === 0}
                    title="Mode appel rapide"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Mode Express
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveView('list')}
                    className="mobile-button"
                    title="Voir tous les prospects"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Liste
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prospects.slice(0, 3).map((prospect) => (
                    <div key={prospect.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{prospect.nomComplet}</p>
                        <p className="text-xs text-gray-500">{prospect.ville}</p>
                      </div>
                      <div className="ml-2">
                        <Badge variant="outline" className="text-xs">
                          {prospect.statut}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'dashboard' && activeTab === 'prospects' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Tous les prospects</h2>
            </div>
            
            <div className="space-y-3">
              {prospects.map((prospect) => (
                <Card key={prospect.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{prospect.nomComplet}</h3>
                      <p className="text-xs text-gray-500 mt-1">{prospect.ville}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {prospect.type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {prospect.statut}
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-medium">
                        {((prospect.budget || prospect.prixEstime || 0) / 1000).toFixed(0)}k€
                      </p>
                      {prospect.score && (
                        <p className="text-xs text-gray-500">Score: {prospect.score}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onCall(prospect)} 
                      className="btn-with-icon mobile-button flex-1"
                      title="Appeler"
                    >
                      <Phone className="w-3 h-3" />
                      <span className="text-xs">Appel</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onWhatsApp(prospect)} 
                      className="btn-with-icon mobile-button flex-1"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span className="text-xs">WhatsApp</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onScheduleRDV(prospect)} 
                      className="btn-with-icon mobile-button flex-1"
                      title="Programmer RDV"
                    >
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">RDV</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeView === 'dashboard' && activeTab === 'pipeline' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Pipeline</h2>
            </div>
            
            <div className="space-y-4">
              {['Nouveau', 'Contact', 'RDV fixé', 'Négociation', 'Gagné'].map(status => {
                const statusProspects = prospects.filter(p => p.statut === status);
                return (
                  <Card key={status}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        {status}
                        <Badge variant="secondary">{statusProspects.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {statusProspects.slice(0, 3).map((prospect) => (
                          <div key={prospect.id} className="flex items-center justify-between text-sm">
                            <span className="truncate">{prospect.nomComplet}</span>
                            <span className="text-gray-500">
                              {((prospect.budget || prospect.prixEstime || 0) / 1000).toFixed(0)}k€
                            </span>
                          </div>
                        ))}
                        {statusProspects.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{statusProspects.length - 3} autres
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'dashboard' && activeTab === 'opportunites' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Opportunités</h2>
            </div>
            
            <div className="space-y-3">
              {prospects
                .filter(p => ['RDV fixé', 'Négociation'].includes(p.statut || ''))
                .sort((a, b) => (b.budget || b.prixEstime || 0) - (a.budget || a.prixEstime || 0))
                .map((prospect) => (
                <Card key={prospect.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{prospect.nomComplet}</h3>
                      <p className="text-xs text-gray-500 mt-1">{prospect.ville}</p>
                      <Badge variant="outline" className="text-xs mt-2">
                        {prospect.statut}
                      </Badge>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-semibold text-green-600">
                        {((prospect.budget || prospect.prixEstime || 0) / 1000).toFixed(0)}k€
                      </p>
                      <p className="text-xs text-gray-500">
                        Revenue: {(((prospect.budget || prospect.prixEstime || 0) * (prospect.tauxHonoraires || 0.04)) / 1000).toFixed(1)}k€
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onCall(prospect)} 
                      className="btn-with-icon mobile-button flex-1"
                      title="Appeler"
                    >
                      <Phone className="w-3 h-3" />
                      <span className="text-xs">Appel</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onScheduleRDV(prospect)} 
                      className="btn-with-icon mobile-button flex-1"
                      title="Programmer RDV"
                    >
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">RDV</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeView === 'express' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Mode Express</h2>
              <Button variant="outline" size="sm" onClick={() => setActiveView('dashboard')}>
                <Home className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
            <MobileExpressMode
              prospects={priorityProspects}
              onCall={onCall}
              onWhatsApp={onWhatsApp}
              onScheduleRDV={onScheduleRDV}
            />
          </div>
        )}

        {activeView === 'list' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Tous les prospects</h2>
              <Button variant="outline" size="sm" onClick={() => setActiveView('dashboard')}>
                <Home className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
            
            <div className="space-y-3">
              {prospects.map((prospect) => (
                <Card key={prospect.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{prospect.nomComplet}</h3>
                      <p className="text-xs text-gray-500 mt-1">{prospect.ville}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {prospect.type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {prospect.statut}
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-medium">
                        {((prospect.budget || prospect.prixEstime || 0) / 1000).toFixed(0)}k€
                      </p>
                      {prospect.score && (
                        <p className="text-xs text-gray-500">Score: {prospect.score}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onCall(prospect)} 
                      className="btn-with-icon mobile-button flex-1"
                      title="Appeler"
                    >
                      <Phone className="w-3 h-3" />
                      <span className="text-xs">Appel</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onWhatsApp(prospect)} 
                      className="btn-with-icon mobile-button flex-1"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span className="text-xs">WhatsApp</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onScheduleRDV(prospect)} 
                      className="btn-with-icon mobile-button flex-1"
                      title="Programmer RDV"
                    >
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">RDV</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          <Button
            variant={activeView === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('dashboard')}
            className="flex-1 max-w-none mx-1 flex-col h-auto py-2"
          >
            <Home className="h-4 w-4 mb-1" />
            <span className="text-xs">Accueil</span>
          </Button>
          
          <Button
            variant={activeView === 'express' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('express')}
            className="flex-1 max-w-none mx-1 flex-col h-auto py-2"
            disabled={priorityProspects.length === 0}
          >
            <Phone className="h-4 w-4 mb-1" />
            <span className="text-xs">Express</span>
            {priorityProspects.length > 0 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                {priorityProspects.length}
              </div>
            )}
          </Button>

          <Button
            variant={activeView === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('list')}
            className="flex-1 max-w-none mx-1 flex-col h-auto py-2"
          >
            <User className="h-4 w-4 mb-1" />
            <span className="text-xs">Liste</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingProspect(null);
              setShowProspectForm(true);
            }}
            className="flex-1 max-w-none mx-1 flex-col h-auto py-2"
            title="Créer un nouveau prospect"
          >
            <User className="h-4 w-4 mb-1" />
            <span className="text-xs">Nouveau</span>
          </Button>
        </div>
      </nav>



      {/* Voice Notes Modal */}
      {showVoiceNotes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <VoiceNotes
            onSave={(note) => {
              console.log('Voice note saved:', note);
              setShowVoiceNotes(false);
              // Here you could add the note to the current prospect or create a general note
            }}
            onCancel={() => setShowVoiceNotes(false)}
            placeholder="Dictez vos notes de prospection..."
          />
        </div>
      )}

      {/* Prospect Form Modal */}
      {showProspectForm && (
        <MobileProspectForm
          prospect={editingProspect}
          mode={editingProspect ? 'edit' : 'create'}
          onSave={(prospectData) => {
            if (onSaveProspect) {
              onSaveProspect(prospectData);
            }
            setShowProspectForm(false);
            setEditingProspect(null);
          }}
          onCancel={() => {
            setShowProspectForm(false);
            setEditingProspect(null);
          }}
        />
      )}
    </div>
  );
}