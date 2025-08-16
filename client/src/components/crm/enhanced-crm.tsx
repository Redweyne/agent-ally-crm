import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, MessageSquare, Calendar, Search, Filter, Download, Upload,
  AlertCircle, Star, Clock, MapPin, Euro, Edit, Save, X, Check,
  PhoneOff, UserX, FileText, Merge, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

// Types
interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  area: string;
  budget: number;
  timeline: string;
  intention: string;
  consent: boolean;
  phoneValid: boolean;
  liveTouches: number;
  score: number;
  badNumber: boolean;
  dnc: boolean;
  outcome?: string;
  nextFollowUp?: string;
  fees: number;
  status: string;
  notes: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  leadId: string;
  date: string;
  time: string;
  type: string;
}

const OUTCOMES = {
  '1': 'Interested',
  '2': 'Not interested',
  '3': 'Callback',
  '4': 'Voicemail',
  '5': 'Wrong number',
  '6': 'Appointment booked',
  '7': 'Do not call'
};

const TIME_SLOTS = [
  { label: 'Today PM', value: 'today-pm' },
  { label: 'Tomorrow AM', value: 'tomorrow-am' },
  { label: 'Tomorrow PM', value: 'tomorrow-pm' }
];

export function EnhancedCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [isMobileCallMode, setIsMobileCallMode] = useState(false);
  const [editingFees, setEditingFees] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const { toast } = useToast();

  // Load data from localStorage
  useEffect(() => {
    const savedLeads = localStorage.getItem('crm-leads');
    const savedAppointments = localStorage.getItem('crm-appointments');
    
    if (savedLeads) {
      setLeads(JSON.parse(savedLeads));
    } else {
      // Initialize with sample data
      const sampleLeads: Lead[] = [
        {
          id: '1',
          name: 'Jean Dupont',
          phone: '+33612345678',
          email: 'jean@example.com',
          area: 'Paris 15ème',
          budget: 450000,
          timeline: '2 months',
          intention: 'Buy',
          consent: true,
          phoneValid: true,
          liveTouches: 2,
          score: 85,
          badNumber: false,
          dnc: false,
          fees: 3.5,
          status: 'Qualified',
          notes: 'Looking for 3BR apartment',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Marie Martin',
          phone: '+33687654321',
          email: 'marie@example.com',
          area: 'Lyon',
          budget: 320000,
          timeline: '6 months',
          intention: 'Sell',
          consent: true,
          phoneValid: true,
          liveTouches: 1,
          score: 65,
          badNumber: false,
          dnc: false,
          fees: 4.0,
          status: 'New',
          notes: 'Selling family home',
          createdAt: new Date().toISOString()
        }
      ];
      setLeads(sampleLeads);
      localStorage.setItem('crm-leads', JSON.stringify(sampleLeads));
    }

    if (savedAppointments) {
      setAppointments(JSON.parse(savedAppointments));
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('crm-leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('crm-appointments', JSON.stringify(appointments));
  }, [appointments]);

  // Check for ready-to-sell leads
  const isReadyToSell = (lead: Lead) => {
    return lead.phoneValid && 
           lead.consent && 
           lead.intention && 
           lead.timeline && 
           lead.area && 
           lead.budget > 0 && 
           lead.liveTouches >= 1;
  };

  // Check for hot leads
  const isHotLead = (lead: Lead) => {
    const timelineMonths = parseInt(lead.timeline.split(' ')[0]) || 12;
    return lead.score > 80 && timelineMonths < 3;
  };

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let filtered = leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead.phone.includes(searchTerm) ||
                           lead.area.toLowerCase().includes(searchTerm.toLowerCase());
      
      switch (filterType) {
        case 'ready-to-sell':
          return matchesSearch && isReadyToSell(lead);
        case 'hot':
          return matchesSearch && isHotLead(lead);
        case 'due-today':
          return matchesSearch && lead.nextFollowUp === new Date().toISOString().split('T')[0];
        default:
          return matchesSearch;
      }
    });

    // Sort leads
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'hot-first':
          const aHot = isHotLead(a) ? 1 : 0;
          const bHot = isHotLead(b) ? 1 : 0;
          return bHot - aHot;
        case 'score':
          return b.score - a.score;
        case 'budget':
          return b.budget - a.budget;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [leads, searchTerm, filterType, sortBy]);

  // Handle keyboard shortcuts for outcomes
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedLead && e.key >= '1' && e.key <= '7') {
        handleOutcome(selectedLead.id, e.key);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedLead]);

  // Handle outcome selection
  const handleOutcome = (leadId: string, outcomeKey: string) => {
    const outcome = OUTCOMES[outcomeKey as keyof typeof OUTCOMES];
    const followUpDays = outcomeKey === '3' ? 2 : 1; // Callback = J+2, others = J+1
    const nextFollowUp = new Date();
    nextFollowUp.setDate(nextFollowUp.getDate() + followUpDays);

    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { 
            ...lead, 
            outcome, 
            nextFollowUp: nextFollowUp.toISOString().split('T')[0],
            liveTouches: lead.liveTouches + 1
          }
        : lead
    ));

    toast({
      title: "Outcome recorded",
      description: `${outcome} - Follow up scheduled for ${nextFollowUp.toLocaleDateString()}`
    });
  };

  // Calculate expected revenue
  const calculateExpectedRevenue = (lead: Lead) => {
    return (lead.budget * lead.fees / 100).toLocaleString('fr-FR');
  };

  // Generate appointment ICS file
  const generateICSFile = (appointment: Appointment, lead: Lead) => {
    const startDate = new Date(`${appointment.date}T${appointment.time}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RedLead2Guide//EN
BEGIN:VEVENT
UID:${appointment.id}@redlead2guide.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Appointment with ${lead.name}
DESCRIPTION:Real estate appointment\\nPhone: ${lead.phone}\\nArea: ${lead.area}\\nBudget: €${lead.budget.toLocaleString()}
LOCATION:${lead.area}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment-${lead.name.replace(/\s/g, '-')}.ics`;
    a.click();
  };

  // Book appointment with quick slots
  const bookAppointment = (leadId: string, slot: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const now = new Date();
    let appointmentDate = new Date();
    let time = '';

    switch (slot) {
      case 'today-pm':
        time = '14:00';
        break;
      case 'tomorrow-am':
        appointmentDate.setDate(now.getDate() + 1);
        time = '10:00';
        break;
      case 'tomorrow-pm':
        appointmentDate.setDate(now.getDate() + 1);
        time = '14:00';
        break;
    }

    const appointment: Appointment = {
      id: `apt-${Date.now()}`,
      leadId,
      date: appointmentDate.toISOString().split('T')[0],
      time,
      type: 'consultation'
    };

    setAppointments(prev => [...prev, appointment]);
    generateICSFile(appointment, lead);
    
    toast({
      title: "Appointment booked",
      description: `${slot.replace('-', ' ')} with ${lead.name}`
    });
  };

  // Export lead as PDF
  const exportLeadPDF = (lead: Lead) => {
    // Simple PDF generation using browser print
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lead Package - ${lead.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
            .content { margin: 20px 0; }
            .section { margin: 15px 0; }
            .label { font-weight: bold; }
            .badge { background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RedLead2Guide CRM</h1>
            <h2>Lead Package</h2>
          </div>
          <div class="content">
            <div class="section">
              <div class="label">Name:</div> ${lead.name}
              ${isReadyToSell(lead) ? '<span class="badge">Ready to Sell</span>' : ''}
              ${isHotLead(lead) ? '<span class="badge">Hot Lead</span>' : ''}
            </div>
            <div class="section"><div class="label">Phone:</div> ${lead.phone}</div>
            <div class="section"><div class="label">Email:</div> ${lead.email}</div>
            <div class="section"><div class="label">Area:</div> ${lead.area}</div>
            <div class="section"><div class="label">Budget:</div> €${lead.budget.toLocaleString()}</div>
            <div class="section"><div class="label">Expected Revenue:</div> €${calculateExpectedRevenue(lead)}</div>
            <div class="section"><div class="label">Timeline:</div> ${lead.timeline}</div>
            <div class="section"><div class="label">Score:</div> ${lead.score}/100</div>
            <div class="section"><div class="label">Status:</div> ${lead.status}</div>
            <div class="section"><div class="label">Notes:</div> ${lead.notes}</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Export/Import JSON
  const exportJSON = () => {
    const data = { leads, appointments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.leads) setLeads(data.leads);
        if (data.appointments) setAppointments(data.appointments);
        toast({ title: "Data imported successfully" });
      } catch (error) {
        toast({ title: "Import failed", description: "Invalid file format" });
      }
    };
    reader.readAsText(file);
  };

  // Find potential duplicates
  const findDuplicates = () => {
    const duplicates: Lead[][] = [];
    const processed = new Set();

    leads.forEach((lead, index) => {
      if (processed.has(index)) return;
      
      const matches = leads.filter((other, otherIndex) => {
        if (otherIndex <= index) return false;
        return other.phone === lead.phone || 
               (other.name.toLowerCase() === lead.name.toLowerCase() && other.email === lead.email);
      });

      if (matches.length > 0) {
        duplicates.push([lead, ...matches]);
        matches.forEach(match => {
          const matchIndex = leads.findIndex(l => l.id === match.id);
          processed.add(matchIndex);
        });
      }
    });

    return duplicates;
  };

  const mergeDuplicates = (primaryLead: Lead, duplicates: Lead[]) => {
    // Merge data from duplicates into primary
    const merged = {
      ...primaryLead,
      liveTouches: Math.max(primaryLead.liveTouches, ...duplicates.map(d => d.liveTouches)),
      score: Math.max(primaryLead.score, ...duplicates.map(d => d.score)),
      notes: [primaryLead.notes, ...duplicates.map(d => d.notes)].filter(n => n).join('\n\n')
    };

    // Remove duplicates and update primary
    setLeads(prev => prev.filter(lead => !duplicates.some(d => d.id === lead.id))
                        .map(lead => lead.id === primaryLead.id ? merged : lead));
    
    toast({ title: "Leads merged successfully" });
  };

  if (isMobileCallMode) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Call Mode</h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsMobileCallMode(false)}
            >
              Exit
            </Button>
          </div>
          
          {selectedLead && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">{selectedLead.name}</CardTitle>
                <div className="flex gap-2">
                  {isReadyToSell(selectedLead) && (
                    <Badge className="bg-green-100 text-green-800">Ready to Sell</Badge>
                  )}
                  {isHotLead(selectedLead) && (
                    <Badge className="bg-red-100 text-red-800">Hot Lead</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Phone:</strong> {selectedLead.phone}</div>
                  <div><strong>Area:</strong> {selectedLead.area}</div>
                  <div><strong>Budget:</strong> €{selectedLead.budget.toLocaleString()}</div>
                  <div><strong>Expected:</strong> €{calculateExpectedRevenue(selectedLead)}</div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 mt-4">
                  <Button 
                    className="h-16 text-lg bg-green-600 hover:bg-green-700"
                    disabled={selectedLead.badNumber || selectedLead.dnc}
                    onClick={() => window.open(`tel:${selectedLead.phone}`)}
                  >
                    <Phone className="mr-2 h-6 w-6" />
                    Call
                  </Button>
                  
                  <Button 
                    className="h-16 text-lg bg-blue-600 hover:bg-blue-700"
                    disabled={selectedLead.badNumber || selectedLead.dnc}
                    onClick={() => window.open(`sms:${selectedLead.phone}`)}
                  >
                    <MessageSquare className="mr-2 h-6 w-6" />
                    SMS
                  </Button>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map(slot => (
                      <Button
                        key={slot.value}
                        variant="outline"
                        size="sm"
                        onClick={() => bookAppointment(selectedLead.id, slot.value)}
                      >
                        {slot.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Quick Outcomes (1-7):</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(OUTCOMES).map(([key, value]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        onClick={() => handleOutcome(selectedLead.id, key)}
                      >
                        {key}. {value}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-2">
            {filteredLeads.map(lead => (
              <Card 
                key={lead.id}
                className={`cursor-pointer transition-colors ${
                  selectedLead?.id === lead.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedLead(lead)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-sm text-gray-600">{lead.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">€{calculateExpectedRevenue(lead)}</div>
                      <div className="text-xs text-gray-500">Score: {lead.score}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Enhanced CRM</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileCallMode(true)}
              className="md:hidden"
            >
              Call Mode
            </Button>
            <Button variant="outline" size="sm" onClick={exportJSON}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={importJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{leads.length}</div>
              <div className="text-sm text-gray-600">Total Leads</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {leads.filter(isReadyToSell).length}
              </div>
              <div className="text-sm text-gray-600">Ready to Sell</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {leads.filter(isHotLead).length}
              </div>
              <div className="text-sm text-gray-600">Hot Leads</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                €{leads.reduce((sum, lead) => sum + (lead.budget * lead.fees / 100), 0).toLocaleString('fr-FR')}
              </div>
              <div className="text-sm text-gray-600">Expected Revenue</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="ready-to-sell">Ready to Sell</SelectItem>
              <SelectItem value="hot">Hot Leads</SelectItem>
              <SelectItem value="due-today">Due Today</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Latest First</SelectItem>
              <SelectItem value="hot-first">Hot First</SelectItem>
              <SelectItem value="score">Highest Score</SelectItem>
              <SelectItem value="budget">Highest Budget</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowDuplicates(!showDuplicates)}
          >
            <Merge className="h-4 w-4 mr-2" />
            Duplicates ({findDuplicates().length})
          </Button>
        </div>

        {/* Duplicates Panel */}
        {showDuplicates && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Potential Duplicates</CardTitle>
            </CardHeader>
            <CardContent>
              {findDuplicates().map((group, index) => (
                <div key={index} className="border-b pb-4 mb-4 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Group {index + 1}</h4>
                    <Button
                      size="sm"
                      onClick={() => mergeDuplicates(group[0], group.slice(1))}
                    >
                      Merge into first
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {group.map(lead => (
                      <div key={lead.id} className="text-sm bg-gray-50 p-2 rounded">
                        {lead.name} - {lead.phone} - {lead.email}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {findDuplicates().length === 0 && (
                <div className="text-center text-gray-500">No duplicates found</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Leads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map(lead => (
            <Card key={lead.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{lead.name}</CardTitle>
                  <div className="flex gap-1">
                    {isReadyToSell(lead) && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Ready to Sell
                      </Badge>
                    )}
                    {isHotLead(lead) && (
                      <Badge className="bg-red-100 text-red-800 text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Hot
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Switch
                    checked={lead.badNumber}
                    onCheckedChange={(checked) => 
                      setLeads(prev => prev.map(l => 
                        l.id === lead.id ? {...l, badNumber: checked} : l
                      ))
                    }
                  />
                  <span className="text-xs text-gray-500">Bad #</span>
                  
                  <Switch
                    checked={lead.dnc}
                    onCheckedChange={(checked) => 
                      setLeads(prev => prev.map(l => 
                        l.id === lead.id ? {...l, dnc: checked} : l
                      ))
                    }
                  />
                  <span className="text-xs text-gray-500">DNC</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {lead.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {lead.area}
                  </div>
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-gray-400" />
                    {lead.budget.toLocaleString()} 
                    <span className="text-xs text-gray-500">
                      (€{calculateExpectedRevenue(lead)} expected)
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-xs">
                    Score: {lead.score}
                  </Badge>
                  
                  {editingStatus === lead.id ? (
                    <div className="flex gap-1">
                      <Input
                        value={lead.status}
                        onChange={(e) => 
                          setLeads(prev => prev.map(l => 
                            l.id === lead.id ? {...l, status: e.target.value} : l
                          ))
                        }
                        className="h-6 text-xs w-20"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingStatus(null)}
                        className="h-6 w-6 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Badge 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => setEditingStatus(lead.id)}
                    >
                      {lead.status}
                      <Edit className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={lead.badNumber || lead.dnc}
                    onClick={() => window.open(`tel:${lead.phone}`)}
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={lead.badNumber || lead.dnc}
                    onClick={() => window.open(`sms:${lead.phone}`)}
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedLead(lead)}
                    className="flex-1"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportLeadPDF(lead)}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick appointment slots */}
                <div className="grid grid-cols-3 gap-1">
                  {TIME_SLOTS.map(slot => (
                    <Button
                      key={slot.value}
                      size="sm"
                      variant="ghost"
                      onClick={() => bookAppointment(lead.id, slot.value)}
                      className="text-xs p-1 h-6"
                    >
                      {slot.label}
                    </Button>
                  ))}
                </div>

                {lead.nextFollowUp && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Follow up: {new Date(lead.nextFollowUp).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lead Details Dialog */}
        {selectedLead && (
          <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedLead.name}
                  {isReadyToSell(selectedLead) && (
                    <Badge className="bg-green-100 text-green-800">Ready to Sell</Badge>
                  )}
                  {isHotLead(selectedLead) && (
                    <Badge className="bg-red-100 text-red-800">Hot Lead</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Phone:</strong> {selectedLead.phone}</div>
                  <div><strong>Email:</strong> {selectedLead.email}</div>
                  <div><strong>Area:</strong> {selectedLead.area}</div>
                  <div><strong>Budget:</strong> €{selectedLead.budget.toLocaleString()}</div>
                  <div><strong>Timeline:</strong> {selectedLead.timeline}</div>
                  <div><strong>Score:</strong> {selectedLead.score}/100</div>
                  
                  <div className="flex items-center gap-2">
                    <strong>Fees:</strong>
                    {editingFees === selectedLead.id ? (
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={selectedLead.fees}
                          onChange={(e) => 
                            setLeads(prev => prev.map(l => 
                              l.id === selectedLead.id 
                                ? {...l, fees: parseFloat(e.target.value) || 0} 
                                : l
                            ))
                          }
                          className="h-6 w-16 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingFees(null)}
                          className="h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span 
                        className="cursor-pointer underline"
                        onClick={() => setEditingFees(selectedLead.id)}
                      >
                        {selectedLead.fees}%
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <strong>Expected Revenue:</strong> €{calculateExpectedRevenue(selectedLead)}
                  </div>
                </div>

                <div>
                  <strong>Quick Outcomes (Keyboard 1-7):</strong>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(OUTCOMES).map(([key, value]) => (
                      <Button
                        key={key}
                        size="sm"
                        variant="outline"
                        onClick={() => handleOutcome(selectedLead.id, key)}
                      >
                        {key}. {value}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <strong>Quick Appointments:</strong>
                  <div className="flex gap-2 mt-2">
                    {TIME_SLOTS.map(slot => (
                      <Button
                        key={slot.value}
                        size="sm"
                        onClick={() => bookAppointment(selectedLead.id, slot.value)}
                      >
                        {slot.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <strong>Notes:</strong>
                  <Textarea
                    value={selectedLead.notes}
                    onChange={(e) => 
                      setLeads(prev => prev.map(l => 
                        l.id === selectedLead.id ? {...l, notes: e.target.value} : l
                      ))
                    }
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(`tel:${selectedLead.phone}`)}
                    disabled={selectedLead.badNumber || selectedLead.dnc}
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  
                  <Button
                    onClick={() => window.open(`sms:${selectedLead.phone}`)}
                    disabled={selectedLead.badNumber || selectedLead.dnc}
                    variant="outline"
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    SMS
                  </Button>
                  
                  <Button
                    onClick={() => exportLeadPDF(selectedLead)}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}