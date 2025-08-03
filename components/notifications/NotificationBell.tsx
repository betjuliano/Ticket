'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Ticket,
  MessageSquare,
  Paperclip,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  relatedId?: string;
  data?: Record<string, any>;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar notificações
  useEffect(() => {
    if (session?.user) {
      loadNotifications();
      // Configurar polling para atualizações em tempo real
      const interval = setInterval(loadNotifications, 30000); // 30 segundos
      return () => clearInterval(interval);
    }
  }, [session]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications?limit=10');

      if (!response.ok) {
        throw new Error('Erro ao carregar notificações');
      }

      const data = await response.json();
      setNotifications(data.data || []);
      setUnreadCount(data.meta?.unreadCount || 0);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao marcar notificação como lida');
      }

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      toast.error('Erro ao marcar notificação como lida');
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Sem IDs específicos = marcar todas
      });

      if (!response.ok) {
        throw new Error('Erro ao marcar todas as notificações como lidas');
      }

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          read: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      toast.error('Erro ao marcar todas as notificações como lidas');
    }
  };

  // Navegar para item relacionado
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navegar baseado no tipo de notificação
    if (notification.relatedId && notification.type.includes('TICKET')) {
      window.location.href = `/tickets/${notification.relatedId}`;
    }
  };

  // Obter ícone baseado no tipo
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TICKET_CREATED':
      case 'TICKET_UPDATED':
      case 'TICKET_ASSIGNED':
        return <Ticket className="h-4 w-4 text-blue-500" />;
      case 'TICKET_COMMENTED':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'TICKET_RESOLVED':
      case 'TICKET_CLOSED':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'SYSTEM_ANNOUNCEMENT':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Obter cor do badge baseado no tipo
  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'TICKET_CREATED':
        return 'bg-blue-100 text-blue-800';
      case 'TICKET_UPDATED':
      case 'TICKET_ASSIGNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'TICKET_COMMENTED':
        return 'bg-green-100 text-green-800';
      case 'TICKET_RESOLVED':
      case 'TICKET_CLOSED':
        return 'bg-green-100 text-green-800';
      case 'SYSTEM_ANNOUNCEMENT':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TICKET_CREATED':
        return 'Novo Chamado';
      case 'TICKET_UPDATED':
        return 'Atualização';
      case 'TICKET_ASSIGNED':
        return 'Atribuição';
      case 'TICKET_COMMENTED':
        return 'Comentário';
      case 'TICKET_RESOLVED':
        return 'Resolvido';
      case 'TICKET_CLOSED':
        return 'Fechado';
      case 'SYSTEM_ANNOUNCEMENT':
        return 'Anúncio';
      default:
        return 'Notificação';
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={5}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notificações</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 px-2 text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notificação</p>
                  <p className="text-sm">Você está em dia!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read
                            ? 'bg-blue-50 border-l-4 border-l-blue-500'
                            : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                                  >
                                    {getTypeLabel(notification.type)}
                                  </Badge>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                                <p className="font-medium text-sm leading-tight">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatDistanceToNow(
                                    new Date(notification.createdAt),
                                    {
                                      addSuffix: true,
                                      locale: ptBR,
                                    }
                                  )}
                                </p>
                              </div>
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={e => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {notifications.length > 0 && (
              <>
                <Separator />
                <div className="p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = '/notifications';
                    }}
                  >
                    Ver todas as notificações
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
