import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  static async notifyTicketCreated(ticketId: string, createdById: string) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: true,
        },
      });

      if (!ticket) {
        console.error('Ticket não encontrado:', ticketId);
        return false;
      }

      // Notificar coordenadores e admins
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'COORDINATOR'] },
          isActive: true,
        },
      });

      const notifications = admins.map(admin => ({
        userId: admin.id,
        type: 'TICKET_CREATED',
        title: 'Novo ticket criado',
        message: `Ticket #${ticket.id} - ${ticket.title} foi criado por ${ticket.createdBy.name}`,
        metadata: JSON.stringify({
          ticketId: ticket.id,
          createdById: ticket.createdById,
          ticketTitle: ticket.title,
        }),
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      return true;
    } catch (error) {
      console.error('Erro ao notificar criação de ticket:', error);
      return false;
    }
  }

  static async notifyTicketStatusChanged(
    ticketId: string,
    oldStatus: string,
    newStatus: string,
    changedById: string
  ) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: true,
          assignedTo: true,
        },
      });

      if (!ticket) {
        console.error('Ticket não encontrado:', ticketId);
        return false;
      }

      const changedBy = await prisma.user.findUnique({
        where: { id: changedById },
      });

      if (!changedBy) {
        console.error('Usuário não encontrado:', changedById);
        return false;
      }

      // Notificar criador do ticket
      if (ticket.createdById !== changedById) {
        await prisma.notification.create({
          data: {
            userId: ticket.createdById,
            type: 'TICKET_STATUS_CHANGED',
            title: 'Status do ticket alterado',
            message: `O status do ticket #${ticket.id} foi alterado de ${oldStatus} para ${newStatus} por ${changedBy.name}`,
            metadata: JSON.stringify({
              ticketId: ticket.id,
              oldStatus,
              newStatus,
              changedById: changedBy.id,
            }),
          },
        });
      }

      // Notificar técnico responsável se diferente do que alterou
      if (ticket.assignedToId && ticket.assignedToId !== changedById) {
        await prisma.notification.create({
          data: {
            userId: ticket.assignedToId,
            type: 'TICKET_STATUS_CHANGED',
            title: 'Status do ticket alterado',
            message: `O status do ticket #${ticket.id} foi alterado de ${oldStatus} para ${newStatus} por ${changedBy.name}`,
            metadata: JSON.stringify({
              ticketId: ticket.id,
              oldStatus,
              newStatus,
              changedById: changedBy.id,
            }),
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Erro ao notificar mudança de status:', error);
      return false;
    }
  }

  static async notifyNewComment(
    commentId: string,
    ticketId: string,
    userId: string
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

      if (!comment) {
        console.error('Comentário não encontrado:', commentId);
        return false;
      }

      const ticket = comment.ticket;
      const commentAuthor = comment.user;

      // Lista de usuários para notificar
      const usersToNotify = [];

      // Adicionar criador do ticket se não for o autor do comentário
      if (ticket.createdById !== userId) {
        usersToNotify.push(ticket.createdById);
      }

      // Adicionar técnico responsável se existir e não for o autor do comentário
      if (ticket.assignedToId && ticket.assignedToId !== userId) {
        usersToNotify.push(ticket.assignedToId);
      }

      // Criar notificações
      const notifications = usersToNotify.map(userId => ({
        userId,
        type: 'NEW_COMMENT',
        title: 'Novo comentário no ticket',
        message: `${commentAuthor.name} comentou no ticket #${ticket.id} - ${ticket.title}`,
        metadata: JSON.stringify({
          ticketId: ticket.id,
          commentId: comment.id,
          commentAuthorId: commentAuthor.id,
          ticketTitle: ticket.title,
        }),
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }

      return true;
    } catch (error) {
      console.error('Erro ao notificar novo comentário:', error);
      return false;
    }
  }

  static async notifyNewAttachment(
    attachmentId: string,
    ticketId: string,
    userId: string
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

      if (!attachment) {
        console.error('Anexo não encontrado:', attachmentId);
        return false;
      }

      const ticket = attachment.ticket;
      const attachmentAuthor = attachment.user;

      // Lista de usuários para notificar
      const usersToNotify = [];

      // Adicionar criador do ticket se não for o autor do anexo
      if (ticket.createdById !== userId) {
        usersToNotify.push(ticket.createdById);
      }

      // Adicionar técnico responsável se existir e não for o autor do anexo
      if (ticket.assignedToId && ticket.assignedToId !== userId) {
        usersToNotify.push(ticket.assignedToId);
      }

      // Criar notificações
      const notifications = usersToNotify.map(userId => ({
        userId,
        type: 'NEW_ATTACHMENT',
        title: 'Novo anexo no ticket',
        message: `${attachmentAuthor.name} adicionou um anexo no ticket #${ticket.id} - ${ticket.title}`,
        metadata: JSON.stringify({
          ticketId: ticket.id,
          attachmentId: attachment.id,
          attachmentAuthorId: attachmentAuthor.id,
          ticketTitle: ticket.title,
          fileName: attachment.filename,
          fileSize: attachment.size,
        }),
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }

      return true;
    } catch (error) {
      console.error('Erro ao notificar novo anexo:', error);
      return false;
    }
  }

  static async notifyTicketClosed(ticketId: string, closedById: string) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: true,
          assignedTo: true,
        },
      });

      if (!ticket) {
        console.error('Ticket não encontrado:', ticketId);
        return false;
      }

      const closedBy = await prisma.user.findUnique({
        where: { id: closedById },
      });

      if (!closedBy) {
        console.error('Usuário não encontrado:', closedById);
        return false;
      }

      // Notificar criador do ticket
      if (ticket.createdById !== closedById) {
        await prisma.notification.create({
          data: {
            userId: ticket.createdById,
            type: 'TICKET_CLOSED',
            title: 'Ticket fechado',
            message: `O ticket #${ticket.id} - ${ticket.title} foi fechado por ${closedBy.name}`,
            metadata: JSON.stringify({
              ticketId: ticket.id,
              closedById: closedBy.id,
              ticketTitle: ticket.title,
            }),
          },
        });
      }

      // Notificar técnico responsável se diferente do que fechou
      if (ticket.assignedToId && ticket.assignedToId !== closedById) {
        await prisma.notification.create({
          data: {
            userId: ticket.assignedToId,
            type: 'TICKET_CLOSED',
            title: 'Ticket fechado',
            message: `O ticket #${ticket.id} - ${ticket.title} foi fechado por ${closedBy.name}`,
            metadata: JSON.stringify({
              ticketId: ticket.id,
              closedById: closedBy.id,
              ticketTitle: ticket.title,
            }),
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Erro ao notificar fechamento de ticket:', error);
      return false;
    }
  }

  static async createSystemAnnouncement(
    title: string,
    message: string,
    targetUsers?: string[]
  ) {
    try {
      let users: { id: string }[] = [];

      if (targetUsers && targetUsers.length > 0) {
        users = await prisma.user.findMany({
          where: {
            id: { in: targetUsers },
            isActive: true,
          },
          select: { id: true },
        });
      } else {
        // Notificar todos os usuários ativos
        users = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true },
        });
      }

      const notifications = users.map(user => ({
        userId: user.id,
        type: 'SYSTEM_ANNOUNCEMENT',
        title,
        message,
        metadata: JSON.stringify({
          announcementTitle: title,
          announcementMessage: message,
        }),
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }

      return true;
    } catch (error) {
      console.error('Erro ao criar anúncio do sistema:', error);
      return false;
    }
  }

  static async markNotificationsAsRead(userId: string, notificationIds?: string[]) {
    try {
      const whereClause = notificationIds 
        ? { id: { in: notificationIds }, userId }
        : { userId, isRead: false };

      await prisma.notification.updateMany({
        where: whereClause,
        data: { isRead: true },
      });

      return true;
    } catch (error) {
      console.error('Erro ao marcar notificações como lidas:', error);
      return false;
    }
  }

  static async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      console.error('Erro ao obter contagem de não lidas:', error);
      return 0;
    }
  }
}
