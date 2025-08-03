import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  relatedId?: string;
  data?: Record<string, any>;
}

export class NotificationService {
  // Criar notificação
  static async create(notificationData: NotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: notificationData,
      });

      // TODO: Enviar via WebSocket quando implementado
      // this.sendRealTime(notification)

      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  // Notificar criação de ticket
  static async notifyTicketCreated(ticketId: string, createdById: string) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: true,
          assignedTo: true,
        },
      });

      if (!ticket) return;

      // Notificar coordenadores e admins
      const coordinatorsAndAdmins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'COORDINATOR'] },
          isActive: true,
          id: { not: createdById }, // Não notificar o criador
        },
      });

      const notifications = coordinatorsAndAdmins.map(user => ({
        type: 'TICKET_CREATED' as NotificationType,
        title: 'Novo chamado criado',
        message: `${ticket.createdBy.name} criou o chamado "${ticket.title}"`,
        userId: user.id,
        relatedId: ticketId,
        data: {
          ticketId,
          ticketTitle: ticket.title,
          createdBy: ticket.createdBy.name,
          priority: ticket.priority,
          category: ticket.category,
        },
      }));

      // Criar todas as notificações
      await prisma.notification.createMany({
        data: notifications,
      });

      return notifications.length;
    } catch (error) {
      console.error('Erro ao notificar criação de ticket:', error);
    }
  }

  // Notificar atribuição de ticket
  static async notifyTicketAssigned(
    ticketId: string,
    assignedToId: string,
    assignedById: string
  ) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: true,
          assignedTo: true,
        },
      });

      if (!ticket || !ticket.assignedTo) return;

      // Notificar o usuário atribuído (se não foi ele mesmo que se atribuiu)
      if (assignedToId !== assignedById) {
        await this.create({
          type: 'TICKET_ASSIGNED',
          title: 'Chamado atribuído a você',
          message: `O chamado "${ticket.title}" foi atribuído a você`,
          userId: assignedToId,
          relatedId: ticketId,
          data: {
            ticketId,
            ticketTitle: ticket.title,
            assignedBy: assignedById,
            priority: ticket.priority,
            category: ticket.category,
          },
        });
      }

      // Notificar o criador do ticket (se não foi ele que atribuiu)
      if (
        ticket.createdById !== assignedById &&
        ticket.createdById !== assignedToId
      ) {
        await this.create({
          type: 'TICKET_ASSIGNED',
          title: 'Seu chamado foi atribuído',
          message: `Seu chamado "${ticket.title}" foi atribuído para ${ticket.assignedTo.name}`,
          userId: ticket.createdById,
          relatedId: ticketId,
          data: {
            ticketId,
            ticketTitle: ticket.title,
            assignedTo: ticket.assignedTo.name,
            assignedBy: assignedById,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao notificar atribuição de ticket:', error);
    }
  }

  // Notificar atualização de status
  static async notifyTicketStatusChanged(
    ticketId: string,
    oldStatus: string,
    newStatus: string,
    updatedById: string
  ) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: true,
          assignedTo: true,
        },
      });

      if (!ticket) return;

      const statusLabels: Record<string, string> = {
        OPEN: 'Aberto',
        IN_PROGRESS: 'Em Andamento',
        WAITING_FOR_USER: 'Aguardando Usuário',
        WAITING_FOR_THIRD_PARTY: 'Aguardando Terceiros',
        RESOLVED: 'Resolvido',
        CLOSED: 'Fechado',
        CANCELLED: 'Cancelado',
      };

      const usersToNotify = new Set<string>();

      // Adicionar criador do ticket
      if (ticket.createdById !== updatedById) {
        usersToNotify.add(ticket.createdById);
      }

      // Adicionar usuário atribuído
      if (ticket.assignedToId && ticket.assignedToId !== updatedById) {
        usersToNotify.add(ticket.assignedToId);
      }

      // Criar notificações
      const notifications = Array.from(usersToNotify).map(userId => ({
        type: 'TICKET_UPDATED' as NotificationType,
        title: 'Status do chamado alterado',
        message: `O chamado "${ticket.title}" mudou de ${statusLabels[oldStatus]} para ${statusLabels[newStatus]}`,
        userId,
        relatedId: ticketId,
        data: {
          ticketId,
          ticketTitle: ticket.title,
          oldStatus,
          newStatus,
          updatedBy: updatedById,
        },
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }

      return notifications.length;
    } catch (error) {
      console.error('Erro ao notificar mudança de status:', error);
    }
  }

  // Notificar novo comentário
  static async notifyNewComment(
    commentId: string,
    ticketId: string,
    commentUserId: string
  ) {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: true,
          ticket: {
            include: {
              createdBy: true,
              assignedTo: true,
            },
          },
        },
      });

      if (!comment) return;

      const usersToNotify = new Set<string>();

      // Adicionar criador do ticket
      if (comment.ticket.createdById !== commentUserId) {
        usersToNotify.add(comment.ticket.createdById);
      }

      // Adicionar usuário atribuído
      if (
        comment.ticket.assignedToId &&
        comment.ticket.assignedToId !== commentUserId
      ) {
        usersToNotify.add(comment.ticket.assignedToId);
      }

      // Se for comentário interno, notificar apenas admins e coordenadores
      if (comment.isInternal) {
        const coordinatorsAndAdmins = await prisma.user.findMany({
          where: {
            role: { in: ['ADMIN', 'COORDINATOR'] },
            isActive: true,
            id: { not: commentUserId },
          },
        });

        coordinatorsAndAdmins.forEach(user => usersToNotify.add(user.id));
      }

      // Criar notificações
      const notifications = Array.from(usersToNotify).map(userId => ({
        type: 'TICKET_COMMENTED' as NotificationType,
        title: comment.isInternal
          ? 'Novo comentário interno'
          : 'Novo comentário',
        message: `${comment.user.name} comentou no chamado "${comment.ticket.title}"`,
        userId,
        relatedId: ticketId,
        data: {
          ticketId,
          commentId,
          ticketTitle: comment.ticket.title,
          commentUser: comment.user.name,
          isInternal: comment.isInternal,
          commentPreview: comment.content.substring(0, 100),
        },
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }

      return notifications.length;
    } catch (error) {
      console.error('Erro ao notificar novo comentário:', error);
    }
  }

  // Notificar novo anexo
  static async notifyNewAttachment(
    attachmentId: string,
    ticketId: string,
    attachmentUserId: string
  ) {
    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: {
          user: true,
          ticket: {
            include: {
              createdBy: true,
              assignedTo: true,
            },
          },
        },
      });

      if (!attachment) return;

      const usersToNotify = new Set<string>();

      // Adicionar criador do ticket
      if (attachment.ticket.createdById !== attachmentUserId) {
        usersToNotify.add(attachment.ticket.createdById);
      }

      // Adicionar usuário atribuído
      if (
        attachment.ticket.assignedToId &&
        attachment.ticket.assignedToId !== attachmentUserId
      ) {
        usersToNotify.add(attachment.ticket.assignedToId);
      }

      // Notificar coordenadores e admins
      const coordinatorsAndAdmins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'COORDINATOR'] },
          isActive: true,
          id: { not: attachmentUserId },
        },
      });

      coordinatorsAndAdmins.forEach(user => usersToNotify.add(user.id));

      // Criar notificações
      const notifications = Array.from(usersToNotify).map(userId => ({
        type: 'TICKET_UPDATED' as NotificationType,
        title: 'Novo anexo adicionado',
        message: `${attachment.user.name} adicionou o arquivo "${attachment.originalName}" ao chamado "${attachment.ticket.title}"`,
        userId,
        relatedId: ticketId,
        data: {
          ticketId,
          attachmentId,
          ticketTitle: attachment.ticket.title,
          attachmentUser: attachment.user.name,
          fileName: attachment.originalName,
          fileSize: attachment.filesize,
        },
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }

      return notifications.length;
    } catch (error) {
      console.error('Erro ao notificar novo anexo:', error);
    }
  }

  // Notificar resolução de ticket
  static async notifyTicketResolved(ticketId: string, resolvedById: string) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: true,
          assignedTo: true,
        },
      });

      if (!ticket) return;

      // Notificar o criador do ticket
      if (ticket.createdById !== resolvedById) {
        await this.create({
          type: 'TICKET_RESOLVED',
          title: 'Seu chamado foi resolvido',
          message: `Seu chamado "${ticket.title}" foi marcado como resolvido`,
          userId: ticket.createdById,
          relatedId: ticketId,
          data: {
            ticketId,
            ticketTitle: ticket.title,
            resolvedBy: resolvedById,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao notificar resolução de ticket:', error);
    }
  }

  // Notificar fechamento de ticket
  static async notifyTicketClosed(ticketId: string, closedById: string) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: true,
          assignedTo: true,
        },
      });

      if (!ticket) return;

      const usersToNotify = new Set<string>();

      // Adicionar criador do ticket
      if (ticket.createdById !== closedById) {
        usersToNotify.add(ticket.createdById);
      }

      // Adicionar usuário atribuído
      if (ticket.assignedToId && ticket.assignedToId !== closedById) {
        usersToNotify.add(ticket.assignedToId);
      }

      // Criar notificações
      const notifications = Array.from(usersToNotify).map(userId => ({
        type: 'TICKET_CLOSED' as NotificationType,
        title: 'Chamado fechado',
        message: `O chamado "${ticket.title}" foi fechado`,
        userId,
        relatedId: ticketId,
        data: {
          ticketId,
          ticketTitle: ticket.title,
          closedBy: closedById,
        },
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }

      return notifications.length;
    } catch (error) {
      console.error('Erro ao notificar fechamento de ticket:', error);
    }
  }

  // Criar notificação de sistema
  static async createSystemAnnouncement(
    title: string,
    message: string,
    targetRoles?: string[]
  ) {
    try {
      const whereClause: any = { isActive: true };

      if (targetRoles && targetRoles.length > 0) {
        whereClause.role = { in: targetRoles };
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: { id: true },
      });

      const notifications = users.map(user => ({
        type: 'SYSTEM_ANNOUNCEMENT' as NotificationType,
        title,
        message,
        userId: user.id,
        data: {
          isSystemAnnouncement: true,
          targetRoles,
        },
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }

      return notifications.length;
    } catch (error) {
      console.error('Erro ao criar anúncio do sistema:', error);
    }
  }

  // Marcar notificação como lida
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId, // Garantir que o usuário só pode marcar suas próprias notificações
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return notification.count > 0;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }

  // Marcar todas as notificações como lidas
  static async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      return 0;
    }
  }

  // Contar notificações não lidas
  static async getUnreadCount(userId: string) {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      });
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
  }
}
