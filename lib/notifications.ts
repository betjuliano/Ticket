import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  userId: string;
  isRead: boolean;
  metadata?: string;
  createdAt: Date;
}

export interface NotificationCounts {
  total: number;
  unread: number;
  read: number;
}

export class NotificationManager {
  static async getNotifications(userId: string, limit = 50, offset = 0) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return notifications;
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }

  static async getNotificationCounts(userId: string): Promise<NotificationCounts> {
    try {
      const [total, unread] = await Promise.all([
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
      ]);

      return {
        total,
        unread,
        read: total - unread,
      };
    } catch (error) {
      console.error('Erro ao contar notificações:', error);
      return { total: 0, unread: 0, read: 0 };
    }
  }

  static async markAsRead(notificationId: string, userId: string) {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          isRead: true,
        },
      });

      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return true;
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      return false;
    }
  }

  static async deleteNotification(notificationId: string, userId: string) {
    try {
      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId,
        },
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      return false;
    }
  }

  static async deleteAllNotifications(userId: string) {
    try {
      await prisma.notification.deleteMany({
        where: { userId },
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar todas as notificações:', error);
      return false;
    }
  }
}
