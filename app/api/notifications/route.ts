import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  createNotificationSchema,
  markNotificationReadSchema,
} from '@/lib/validations/forms';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

// GET /api/notifications - Listar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const userId = session.user.id;

    // Construir filtros
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    // Buscar notificações com paginação
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    // Contar não lidas
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return createSuccessResponse(
      { notifications, unreadCount }, 
      undefined, 
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}

// POST /api/notifications - Criar nova notificação (apenas admin/sistema)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    // Apenas admin pode criar notificações manuais
    if (session.user.role !== 'ADMIN') {
      return createErrorResponse('Sem permissão para criar notificações', 403);
    }

    const body = await request.json();

    // Validar dados
    const validationResult = createNotificationSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(
        'Dados inválidos',
        400,
        validationResult.error.errors
      );
    }

    const { type, title, message, userId, metadata } =
      validationResult.data;

    // Verificar se usuário de destino existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Criar notificação
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        userId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return createSuccessResponse(
      notification,
      'Notificação criada com sucesso'
    );
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}

// PATCH /api/notifications - Marcar notificações como lidas
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    const body = await request.json();
    const userId = session.user.id;

    // Se não especificar IDs, marcar todas como lidas
    if (!body.notificationIds) {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return createSuccessResponse(
        null,
        'Todas as notificações foram marcadas como lidas'
      );
    }

    // Validar dados
    const validationResult = markNotificationReadSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(
        'Dados inválidos',
        400,
        validationResult.error.errors
      );
    }

    const { notificationIds } = validationResult.data;

    // Marcar notificações específicas como lidas
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId, // Garantir que o usuário só pode marcar suas próprias notificações
      },
      data: {
        isRead: true,
      },
    });

    return createSuccessResponse(
      { updatedCount: result.count },
      `${result.count} notificação(ões) marcada(s) como lida(s)`
    );
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}
