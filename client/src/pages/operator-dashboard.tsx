import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, Phone, Calendar, DollarSign, Settings, 
  MessageSquare, Mail, CheckCircle, 
  Clock, Plus, Download, Activity, Eye,
  AlertCircle, Star, Zap, TrendingUp
} from "lucide-react";

export default function OperatorDashboard() {
  const [activeTab, setActiveTab] = useState("leads");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [queueMode, setQueueMode] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [interactionsDialogOpen, setInteractionsDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch data
  const { data: leads = [] } = useQuery({
    queryKey: queueMode ? ["/api/operator/queue"] : ["/api/leads"],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ["/api/operator/interactions", selectedLead?.id],
    enabled: !!selectedLead?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/operator/stats", "7"],
  });

  // Mutations
  const assignLeadMutation = useMutation({
    mutationFn: async ({ leadId, agentId }: { leadId: string; agentId: string }) => {
      const response = await fetch(`/api/leads/${leadId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (!response.ok) throw new Error("Failed to assign lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operator/queue"] });
    },
  });

  const outcomeMutation = useMutation({
    mutationFn: async ({ leadId, outcome }: { leadId: string; outcome: string }) => {
      const response = await fetch(`/api/operator/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, outcome }),
      });
      if (!response.ok) throw new Error("Failed to process outcome");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operator/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operator/interactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operator/stats"] });
    },
  });

  const interactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/operator/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create interaction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operator/interactions"] });
    },
  });

  const appointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/operator/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create appointment");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/operator/appointments"] });
      // Download .ics file
      if (data.icsUrl) {
        window.open(data.icsUrl, '_blank');
      }
    },
  });

  const deliveryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/operator/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create delivery");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to logout");
      return response;
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/");
    },
  });

  // Filter leads
  const filteredLeads = leads.filter((lead: any) => {
    if (statusFilter === "all") return true;
    return lead.statut === statusFilter;
  });

  // Keyboard shortcuts for outcomes
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!queueMode || !selectedLead) return;
    
    const outcomes: Record<string, string> = {
      '1': 'answered',
      '2': 'no_answer', 
      '3': 'voicemail',
      '4': 'bad_number',
      '5': 'not_seller',
      '6': 'booked',
      '7': 'dnc'
    };
    
    const outcome = outcomes[event.key];
    if (outcome) {
      event.preventDefault();
      outcomeMutation.mutate({ leadId: selectedLead.id, outcome });
    }
  }, [queueMode, selectedLead, outcomeMutation]);

  useEffect(() => {
    if (queueMode) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [queueMode, handleKeyPress]);

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Contacted": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Qualified": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Booked": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Sent to Agent": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "Sold": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
      case "Refunded/Bad": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Follow-up": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case "Bad Contact": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Disqualified": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "Do Not Contact": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Quick action handlers
  const handleQuickAction = (lead: any, action: string) => {
    setSelectedLead(lead);
    
    // Optimistic interaction creation
    interactionMutation.mutate({
      leadId: lead.id,
      kind: action,
      direction: "outbound",
      summary: `${action.toUpperCase()} action initiated`
    });
    
    if (action === 'call') {
      // Open interactions dialog to show timeline
      setInteractionsDialogOpen(true);
    }
  };

  const LeadsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Booked">Booked</SelectItem>
              <SelectItem value="Sent to Agent">Sent to Agent</SelectItem>
              <SelectItem value="Sold">Sold</SelectItem>
              <SelectItem value="Refunded/Bad">Refunded/Bad</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={queueMode ? "default" : "outline"}
            onClick={() => setQueueMode(!queueMode)}
            className={queueMode ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            <Zap className="h-4 w-4 mr-2" />
            {queueMode ? "Exit Queue" : "Queue Mode"}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Import Leads
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today?.calls || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connects</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today?.connects || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booked</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today?.booked || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today?.deliveries || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">€ Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.today?.collected || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      {queueMode && (
        <Card className="mb-6 border-purple-200 bg-purple-50 dark:bg-purple-950">
          <CardHeader>
            <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Queue Mode Active - Keyboard Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-sm">
              <Badge variant="outline">1 - Answered</Badge>
              <Badge variant="outline">2 - No answer</Badge>
              <Badge variant="outline">3 - Voicemail</Badge>
              <Badge variant="outline">4 - Bad number</Badge>
              <Badge variant="outline">5 - Not seller</Badge>
              <Badge variant="outline">6 - Booked</Badge>
              <Badge variant="outline">7 - DNC</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{queueMode ? "Lead Queue" : "Leads Management"}</CardTitle>
          <CardDescription>{queueMode ? "Process leads with keyboard shortcuts" : "Manage and track all your leads"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                {queueMode && <TableHead>Score</TableHead>}
                <TableHead>Assigned Agent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead: any, index) => (
                <TableRow 
                  key={lead.id} 
                  className={queueMode && selectedLead?.id === lead.id ? "bg-purple-50 dark:bg-purple-950" : ""}
                  onClick={() => queueMode && setSelectedLead(lead)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {lead.isHotLead && <Star className="h-4 w-4 text-yellow-500" />}
                      <span>{lead.nomComplet}</span>
                      {lead.badNumber && <AlertCircle className="h-4 w-4 text-red-500" />}
                      {lead.dnc && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </div>
                  </TableCell>
                  <TableCell>{lead.telephone}</TableCell>
                  <TableCell>{lead.type}</TableCell>
                  <TableCell>{lead.budget ? `€${lead.budget.toLocaleString()}` : "-"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lead.statut || "New")}>
                      {lead.statut || "New"}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.source}</TableCell>
                  {queueMode && (
                    <TableCell>
                      <Badge variant="outline">{lead.score || 50}</Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    {lead.assignedAgentId ? (
                      <span className="text-green-600">
                        {agents.find((a: any) => a.id === lead.assignedAgentId)?.name || "Assigned"}
                      </span>
                    ) : (
                      <Select
                        onValueChange={(agentId) => 
                          assignLeadMutation.mutate({ leadId: lead.id, agentId })
                        }
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Assign agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent: any) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleQuickAction(lead, 'call')}
                        disabled={lead.badNumber || lead.dnc}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleQuickAction(lead, 'sms')}
                        disabled={lead.badNumber || lead.dnc}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleQuickAction(lead, 'email')}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedLead(lead);
                          setInteractionsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Interactions Dialog */}
      <Dialog open={interactionsDialogOpen} onOpenChange={setInteractionsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Interactions Timeline - {selectedLead?.nomComplet}</DialogTitle>
            <DialogDescription>All interactions with this lead</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {interactions.map((interaction: any) => (
              <Card key={interaction.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <Badge>{interaction.kind}</Badge>
                      <Badge variant="outline">{interaction.direction}</Badge>
                      {interaction.outcome && <Badge variant="secondary">{interaction.outcome}</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(interaction.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{interaction.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Operator CRM
              </h1>
              <Badge className="ml-3 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                Operator
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Export leads data as CSV
                  const csvData = leads.map(lead => ({
                    Name: lead.nomComplet,
                    Phone: lead.telephone,
                    Email: lead.email,
                    Type: lead.type,
                    City: lead.ville,
                    Status: lead.statut,
                    Source: lead.source,
                    Score: lead.score,
                  }));
                  const csv = [Object.keys(csvData[0] || {}), ...csvData.map(row => Object.values(row))]
                    .map(row => row.join(','))
                    .join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Simple alert for settings - could be expanded to open a settings dialog
                  alert('Settings functionality would open a configuration panel here.');
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4">
            <LeadsTab />
          </TabsContent>

          <TabsContent value="interactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Call Center Activity</CardTitle>
                <CardDescription>Track all interactions with leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Today's Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Calls Made</span>
                          <span className="font-bold">{stats?.today?.calls || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Connected</span>
                          <span className="font-bold">{stats?.today?.connects || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Voicemails</span>
                          <span className="font-bold">0</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Outcomes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Answered</span>
                          <span className="font-bold">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">No Answer</span>
                          <span className="font-bold">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Booked</span>
                          <span className="font-bold">{stats?.today?.booked || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button className="w-full" size="sm">
                          <Phone className="h-4 w-4 mr-2" />
                          Start Calling
                        </Button>
                        <Button className="w-full" size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send SMS
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Booking</CardTitle>
                <CardDescription>Manage appointments between leads and agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Button onClick={() => setAppointmentDialogOpen(true)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <Clock className="h-6 w-6 mb-2" />
                      <span>Today PM</span>
                      <span className="text-xs text-muted-foreground">14:00 - 18:00</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Clock className="h-6 w-6 mb-2" />
                      <span>Tomorrow AM</span>
                      <span className="text-xs text-muted-foreground">09:00 - 12:00</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Clock className="h-6 w-6 mb-2" />
                      <span>Tomorrow PM</span>
                      <span className="text-xs text-muted-foreground">14:00 - 18:00</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Appointment Dialog */}
            <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Book Appointment</DialogTitle>
                  <DialogDescription>Schedule an appointment with the lead</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const startTime = new Date(`${formData.get('date')}T${formData.get('time')}:00`);
                  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
                  
                  appointmentMutation.mutate({
                    leadId: selectedLead?.id,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    location: formData.get('location'),
                    withAgentId: formData.get('agentId'),
                  });
                  setAppointmentDialogOpen(false);
                }}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input type="date" name="date" required />
                    </div>
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input type="time" name="time" required />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input name="location" placeholder="Meeting location" />
                    </div>
                    <div>
                      <Label htmlFor="agentId">With Agent</Label>
                      <Select name="agentId">
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent: any) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">
                      Book & Download .ics
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Deliveries & Payments</CardTitle>
                <CardDescription>Track deliveries and payments from agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={() => setDeliveryDialogOpen(true)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Create Delivery
                  </Button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Delivery Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Total Sent</span>
                            <span className="font-bold">{stats?.today?.deliveries || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Opened</span>
                            <span className="font-bold">0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Accepted</span>
                            <span className="font-bold">0</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Today</span>
                            <span className="font-bold">€{stats?.today?.collected || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">This Week</span>
                            <span className="font-bold">€0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">This Month</span>
                            <span className="font-bold">€0</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Delivery Dialog */}
            <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Lead Delivery</DialogTitle>
                  <DialogDescription>Deliver lead to agent with pricing</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  
                  deliveryMutation.mutate({
                    leadId: formData.get('leadId'),
                    agentId: formData.get('agentId'),
                    price: parseFloat(formData.get('price') as string),
                    extras: {
                      booked: formData.get('booked') === 'on',
                      exclusive: formData.get('exclusive') === 'on'
                    }
                  });
                  setDeliveryDialogOpen(false);
                }}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="leadId">Lead</Label>
                      <Select name="leadId">
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead" />
                        </SelectTrigger>
                        <SelectContent>
                          {leads.map((lead: any) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.nomComplet} - {lead.telephone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="agentId">Agent</Label>
                      <Select name="agentId">
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent: any) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="price">Price (€)</Label>
                      <Input type="number" name="price" step="0.01" required />
                    </div>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" name="booked" />
                        <span>Pre-booked</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" name="exclusive" />
                        <span>Exclusive</span>
                      </label>
                    </div>
                    <Button type="submit" className="w-full">
                      Create Delivery & Share Link
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Automation Rules</CardTitle>
                <CardDescription>Set up automated workflows and follow-ups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Active Rules</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-sm text-muted-foreground">Currently running</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Actions Today</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">23</div>
                        <p className="text-sm text-muted-foreground">Automated actions</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Success Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">94%</div>
                        <p className="text-sm text-muted-foreground">Successful execution</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Default Automation Rules</h3>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Rule
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">No Answer Follow-up</h4>
                              <p className="text-sm text-muted-foreground">Send SMS A + create follow-up task J+2</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Voicemail Follow-up</h4>
                              <p className="text-sm text-muted-foreground">Send SMS B + create follow-up task J+1</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Booking Confirmation</h4>
                              <p className="text-sm text-muted-foreground">Send confirmation SMS + schedule reminders T-24h, T-1h</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Uncontacted Lead Alert</h4>
                              <p className="text-sm text-muted-foreground">Notify operator for leads idle 7+ days</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Delivery Reminder</h4>
                              <p className="text-sm text-muted-foreground">Remind agent about uncontacted delivery after 24h</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}