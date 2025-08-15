import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Phone, Calendar, AlertTriangle, CheckCircle, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Prospect } from "@shared/schema";

interface NotificationsPanelProps {
  prospects: Prospect[];
}

interface Notification {
  id: string;
  type: "call_due" | "follow_up" | "hot_lead" | "rdv_reminder";
  title: string;
  message: string;
  prospect?: Prospect;
  timestamp: Date;
  isRead: boolean;
}

export default function NotificationsPanel({ prospects }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const generateNotifications = () => {
      const now = new Date();
      const today = now.toDateString();
      const newNotifications: Notification[] = [];

      // Call due notifications
      prospects.forEach(prospect => {
        if (prospect.prochaineAction && 
            new Date(prospect.prochaineAction).toDateString() === today &&
            !["Gagné", "Perdu", "Pas de réponse"].includes(prospect.statut || "")) {
          newNotifications.push({
            id: `call_${prospect.id}`,
            type: "call_due",
            title: "Appel à effectuer",
            message: `${prospect.nomComplet} - ${prospect.ville}`,
            prospect,
            timestamp: new Date(prospect.prochaineAction),
            isRead: false
          });
        }

        // Hot lead notifications
        if (prospect.score && prospect.score > 80 && 
            prospect.timeline && 
            ["1 mois", "2 mois", "moins de 3 mois", "urgent"].includes(prospect.timeline.toLowerCase())) {
          newNotifications.push({
            id: `hot_${prospect.id}`,
            type: "hot_lead",
            title: "Hot Lead détecté",
            message: `${prospect.nomComplet} - Score: ${prospect.score}`,
            prospect,
            timestamp: now,
            isRead: false
          });
        }

        // Follow-up needed
        if (prospect.dernierContact) {
          const daysSinceContact = Math.floor((now.getTime() - new Date(prospect.dernierContact).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceContact > 7 && !["Gagné", "Perdu", "Pas de réponse"].includes(prospect.statut || "")) {
            newNotifications.push({
              id: `followup_${prospect.id}`,
              type: "follow_up",
              title: "Relance nécessaire",
              message: `${prospect.nomComplet} - Dernier contact: ${daysSinceContact} jours`,
              prospect,
              timestamp: now,
              isRead: false
            });
          }
        }
      });

      setNotifications(newNotifications.slice(0, 10)); // Limit to 10 notifications
    };

    generateNotifications();
    
    // Update notifications every minute
    const interval = setInterval(generateNotifications, 60000);
    return () => clearInterval(interval);
  }, [prospects]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "call_due": return <Phone className="w-4 h-4 text-blue-600" />;
      case "hot_lead": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "follow_up": return <Calendar className="w-4 h-4 text-orange-600" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "call_due": return "bg-blue-100 text-blue-800 border-blue-200";
      case "hot_lead": return "bg-red-100 text-red-800 border-red-200";
      case "follow_up": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden z-50 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Tout lire
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune notification</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{notification.title}</span>
                          <Badge className={`text-xs ${getTypeColor(notification.type)}`}>
                            {notification.type === "call_due" ? "Appel" :
                             notification.type === "hot_lead" ? "Hot" :
                             notification.type === "follow_up" ? "Relance" : "Info"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(notification.timestamp, "dd MMM à HH:mm", { locale: fr })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}