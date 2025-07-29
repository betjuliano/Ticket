import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/notifications'
import { createSuccessResponse, createErrorResponse, handleApiError, logRequest } from '@/lib/api-utils'

// GET - Obter notificações do usuário
export async function GET(request: NextRequest) {
  try {
    logRequest('GET', '/api/notifications')
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Não autenticado', 401)
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    let notifications = await notificationService.getUserNotifications(
      session.user.id,
      limit
    )
    // Optionally filter to only unread notifications when requested via query string
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read)
    }

    const unreadCount = await notificationService.getUnreadCount(session.user.id)

    return createSuccessResponse({
      notifications,
      unreadCount
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Marcar notificação como lida
export async function PATCH(request: NextRequest) {
  try {
    logRequest('PATCH', '/api/notifications')
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Não autenticado', 401)
    }

    const body = await request.json()
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      await notificationService.markAllAsRead(session.user.id)
    } else if (notificationId) {
      await notificationService.markAsRead(notificationId, session.user.id)
    } else {
      return createErrorResponse('ID da notificação ou markAllAsRead é obrigatório', 400)
    }

    return createSuccessResponse(null, 'Notificação(ões) marcada(s) como lida(s)')
  } catch (error) {
    return handleApiError(error)
  }
}

