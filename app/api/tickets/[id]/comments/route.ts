import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCommentSchema } from '@/lib/validations';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

// GET /api/tickets/[id]/comments - Listar comentários do ticket
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    const ticketId = params.id;

    // Verificar se o ticket existe
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: true,
        assignedTo: true,
      },
    });

    if (!ticket) {
      return createErrorResponse('Ticket não encontrado', 404);
    }

    // Verificar permissões
    const userRole = session.user.role;
    const userId = session.user.id;
    const canViewTicket =
      userRole === 'ADMIN' ||
      userRole === 'COORDINATOR' ||
      ticket.createdById === userId ||
      ticket.assignedToId === userId;

    if (!canViewTicket) {
      return createErrorResponse(
        'Sem permissão para visualizar este ticket',
        403
      );
    }

    // Buscar comentários
    const whereClause: any = { ticketId };

    // Usuários comuns só veem comentários não internos
    if (userRole === 'USER') {
      whereClause.isInternal = false;
    }

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return createSuccessResponse(comments);
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}

// POST /api/tickets/[id]/comments - Criar novo comentário
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    const ticketId = params.id;
    const body = await request.json();

    // Validar dados
    const validationResult = createCommentSchema.safeParse({
      ...body,
      ticketId,
    });

    if (!validationResult.success) {
      return createErrorResponse(
        'Dados inválidos',
        400,
        validationResult.error.errors
      );
    }

    const { content, isInternal } = validationResult.data;

    // Verificar se o ticket existe
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: true,
        assignedTo: true,
      },
    });

    if (!ticket) {
      return createErrorResponse('Ticket não encontrado', 404);
    }

    // Verificar permissões
    const userRole = session.user.role;
    const userId = session.user.id;
    const canComment =
      userRole === 'ADMIN' ||
      userRole === 'COORDINATOR' ||
      ticket.createdById === userId ||
      ticket.assignedToId === userId;

    if (!canComment) {
      return createErrorResponse(
        'Sem permissão para comentar neste ticket',
        403
      );
    }

    // Usuários comuns não podem criar comentários internos
    const finalIsInternal = userRole === 'USER' ? false : isInternal || false;

    // Criar comentário
    const comment = await prisma.comment.create({
      data: {
        content,
        ticketId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    // Atualizar timestamp do ticket
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    // Criar log de atividade
    await prisma.ticketLog.create({
      data: {
        ticketId,
        action: 'COMMENT_ADDED',
        details: `Comentário ${finalIsInternal ? 'interno ' : ''}adicionado`,
        userId,
      },
    });

    // TODO: Criar notificação para usuários relevantes
    // Isso será implementado na fase de notificações

    return createSuccessResponse(comment, 'Comentário criado com sucesso');
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}
