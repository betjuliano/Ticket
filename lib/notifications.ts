import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import { logger } from './logger'

// Tipos de notificação
export enum NotificationType {
  TICKET_CREATED = 'ticket_created',
  TICKET_ASSIGNED = 'ticket_assigned',
  TICKET_UPDATED = 'ticket_updated',
  TICKET_RESOLVED = 'ticket_resolved',
  TICKET_CLOSED = 'ticket_closed',
  COMMENT_ADDED = 'comment_added',
  KNOWLEDGE_PUBLISHED = 'knowledge_published',
  USER_MENTIONED = 'user_mentioned',
  SYSTEM_ALERT = 'system_alert'
}

// Interface para notificação
interface Notification {
  id?: string
  type: NotificationType
  title: string
  message: string
  userId: string
  relatedId?: string // ID do ticket, comentário, etc.
  data?: any // Dados adicionais
  read?: boolean
  createdAt?: Date
}

// Interface para configurações de email
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

class NotificationService {
  private emailTransporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeEmailTransporter()
  }

  private initializeEmailTransporter(): void {
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const config: EmailConfig = {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }

        // Use nodemailer's correct factory function to create a transporter
        // See: https://nodemailer.com/transports/
        this.emailTransporter = nodemailer.createTransport(config)
        logger.info('Email transporter initialized')
      }
    } catch (error) {
      logger.error('Failed to initialize email transporter', { error })
    }
  }

  // Criar notificação no banco de dados
  async createNotification(notification: Notification): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          userId: notification.userId,
          relatedId: notification.relatedId,
          data: notification.data ? JSON.stringify(notification.data) : null,
          read: false
        }
      })

      logger.info('Notification created', {
        type: notification.type,
        userId: notification.userId,
        title: notification.title
      })
    } catch (error) {
      logger.error('Failed to create notification', { error, notification })
    }
  }

  // Enviar notificação por email
  async sendEmailNotification(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<boolean> {
    if (!this.emailTransporter) {
      logger.warn('Email transporter not configured')
      return false
    }

    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      })

      logger.info('Email sent successfully', { to, subject })
      return true
    } catch (error) {
      logger.error('Failed to send email', { error, to, subject })
      return false
    }
  }

  // Notificar criação de ticket
  async notifyTicketCreated(ticketId: string, createdById: string): Promise<void> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: true,
          assignedTo: true
        }
      })

      if (!ticket) return

      // Notificar coordenadores
      const coordinators = await prisma.user.findMany({
        where: { role: { in: ['COORDINATOR', 'ADMIN'] } }
      })

      for (const coordinator of coordinators) {
        if (coordinator.id === createdById) continue

        await this.createNotification({
          type: NotificationType.TICKET_CREATED,
          title: 'Novo Ticket Criado',
          message: `${ticket.createdBy.name} criou um novo ticket: ${ticket.title}`,
          userId: coordinator.id,
          relatedId: ticketId,
          data: { ticketId, priority: ticket.priority }
        })

        // Enviar email se configurado
        if (coordinator.email) {
          const emailHtml = this.generateTicketCreatedEmail(ticket, coordinator.name)
          await this.sendEmailNotification(
            coordinator.email,
            `Novo Ticket: ${ticket.title}`,
            emailHtml
          )
        }
      }
    } catch (error) {
      logger.error('Failed to notify ticket created', { error, ticketId })
    }
  }

  // Notificar atribuição de ticket
  async notifyTicketAssigned(ticketId: string, assignedToId: string): Promise<void> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: true,
          assignedTo: true
        }
      })

      if (!ticket || !ticket.assignedTo) return

      await this.createNotification({
        type: NotificationType.TICKET_ASSIGNED,
        title: 'Ticket Atribuído',
        message: `Você foi atribuído ao ticket: ${ticket.title}`,
        userId: assignedToId,
        relatedId: ticketId,
        data: { ticketId, priority: ticket.priority }
      })

      // Enviar email
      if (ticket.assignedTo.email) {
        const emailHtml = this.generateTicketAssignedEmail(ticket, ticket.assignedTo.name)
        await this.sendEmailNotification(
          ticket.assignedTo.email,
          `Ticket Atribuído: ${ticket.title}`,
          emailHtml
        )
      }
    } catch (error) {
      logger.error('Failed to notify ticket assigned', { error, ticketId })
    }
  }

  // Notificar atualização de ticket
  async notifyTicketUpdated(ticketId: string, updatedById: string, changes: any): Promise<void> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: true,
          assignedTo: true
        }
      })

      if (!ticket) return

      const usersToNotify = [ticket.createdById]
      if (ticket.assignedToId && ticket.assignedToId !== updatedById) {
        usersToNotify.push(ticket.assignedToId)
      }

      for (const userId of usersToNotify) {
        if (userId === updatedById) continue

        await this.createNotification({
          type: NotificationType.TICKET_UPDATED,
          title: 'Ticket Atualizado',
          message: `O ticket "${ticket.title}" foi atualizado`,
          userId,
          relatedId: ticketId,
          data: { ticketId, changes }
        })
      }
    } catch (error) {
      logger.error('Failed to notify ticket updated', { error, ticketId })
    }
  }

  // Notificar novo comentário
  async notifyCommentAdded(commentId: string): Promise<void> {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: true,
          ticket: {
            include: {
              createdBy: true,
              assignedTo: true
            }
          }
        }
      })

      if (!comment) return

      const usersToNotify = [comment.ticket.createdById]
      if (comment.ticket.assignedToId) {
        usersToNotify.push(comment.ticket.assignedToId)
      }

      for (const userId of usersToNotify) {
        if (userId === comment.userId) continue

        await this.createNotification({
          type: NotificationType.COMMENT_ADDED,
          title: 'Novo Comentário',
          message: `${comment.user.name} comentou no ticket: ${comment.ticket.title}`,
          userId,
          relatedId: comment.ticketId,
          data: { ticketId: comment.ticketId, commentId }
        })
      }
    } catch (error) {
      logger.error('Failed to notify comment added', { error, commentId })
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          read: true
        }
      })
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId })
    }
  }

  // Marcar todas as notificações como lidas
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          read: false
        },
        data: {
          read: true
        }
      })
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { error, userId })
    }
  }

  // Obter notificações do usuário
  async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
    try {
      return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    } catch (error) {
      logger.error('Failed to get user notifications', { error, userId })
      return []
    }
  }

  // Contar notificações não lidas
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          read: false
        }
      })
    } catch (error) {
      logger.error('Failed to get unread count', { error, userId })
      return 0
    }
  }

  // Templates de email
  private generateTicketCreatedEmail(ticket: any, recipientName: string): string {
    return `
      <h2>Novo Ticket Criado</h2>
      <p>Olá ${recipientName},</p>
      <p>Um novo ticket foi criado no sistema:</p>
      <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0;">
        <h3>${ticket.title}</h3>
        <p><strong>Criado por:</strong> ${ticket.createdBy.name}</p>
        <p><strong>Prioridade:</strong> ${ticket.priority}</p>
        <p><strong>Categoria:</strong> ${ticket.category}</p>
        <p><strong>Descrição:</strong> ${ticket.description}</p>
      </div>
      <p>Acesse o sistema para mais detalhes.</p>
    `
  }

  private generateTicketAssignedEmail(ticket: any, recipientName: string): string {
    return `
      <h2>Ticket Atribuído</h2>
      <p>Olá ${recipientName},</p>
      <p>Um ticket foi atribuído a você:</p>
      <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0;">
        <h3>${ticket.title}</h3>
        <p><strong>Criado por:</strong> ${ticket.createdBy.name}</p>
        <p><strong>Prioridade:</strong> ${ticket.priority}</p>
        <p><strong>Categoria:</strong> ${ticket.category}</p>
        <p><strong>Descrição:</strong> ${ticket.description}</p>
      </div>
      <p>Acesse o sistema para começar a trabalhar neste ticket.</p>
    `
  }
}

// Instância singleton do serviço de notificações
export const notificationService = new NotificationService()

export default notificationService

