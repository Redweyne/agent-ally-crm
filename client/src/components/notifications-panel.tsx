import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive';
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    leadAlerts: true,
    appointmentReminders: true,
    systemUpdates: false,
  });

  // Mock notifications - replace with real data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'warning',
        title: 'Lead en attente',
        message: 'Marc Dubois attend une réponse depuis 2 heures',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        actions: [
          {
            label: 'Appeler',
            action: () => console.log('Calling Marc Dubois'),
          },
          {
            label: 'Envoyer SMS',
            action: () => console.log('Sending SMS'),
          },
        ],
      },
      {
        id: '2',
        type: 'success',
        title: 'RDV confirmé',
        message: 'Sophie Martin a confirmé son RDV de demain 14h',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
      },
      {
        id: '3',
        type: 'info',
        title: 'Nouveau lead',
        message: 'Un nouveau prospect vient d\'être ajouté à votre liste',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        read: true,
      },
      {
        id: '4',
        type: 'error',
        title: 'Erreur automation',
        message: 'L\'envoi d\'SMS automatique a échoué pour 3 prospects',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        actions: [
          {
            label: 'Voir détails',
            action: () => console.log('View error details'),
          },
          {
            label: 'Réessayer',
            action: () => console.log('Retry automation'),
          },
        ],
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 md:relative md:bg-transparent">
      <div className="fixed right-0 top-0 h-full w-full bg-white shadow-xl md:w-96 md:shadow-lg dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-96 p-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !notification.read ? 'border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium truncate">
                            {notification.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                        {notification.actions && (
                          <div className="flex gap-2 mt-3">
                            {notification.actions.map((action, index) => (
                              <Button
                                key={index}
                                size="sm"
                                variant={action.variant || 'outline'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.action();
                                }}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Settings Section */}
        <div className="border-t p-4">
          <h3 className="text-sm font-medium mb-3">Préférences</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Notifications email</span>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Alertes leads</span>
              <Switch
                checked={settings.leadAlerts}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, leadAlerts: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Rappels RDV</span>
              <Switch
                checked={settings.appointmentReminders}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, appointmentReminders: checked }))
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}