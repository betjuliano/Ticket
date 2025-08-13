import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateCommentSchema } from '@/lib/validations/forms';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

// GET /api/comments/[id] - Buscar comentário específico
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

    const commentId = params.id;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
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
        ticket: {
          include: {
            createdBy: true,
            assignedTo: true,
          },
        },
      },
    });

    if (!comment) {
      return createErrorResponse('Comentário não encontrado', 404);
    }

    // Verificar permissões
    const userRole = session.user.role;
    const userId = session.user.id;
    const canView =
      userRole === 'ADMIN' ||
      userRole === 'COORDINATOR' ||
      comment.ticket.createdById === userId ||
      comment.ticket.assignedToId === userId ||
      comment.userId === userId;

    if (!canView) {
      return createErrorResponse(
        'Sem permissão para visualizar este comentário',
        403
      );
    }

    // Verificação de permissões para comentários (se necessário no futuro)
    // if (userRole === 'USER' && comment.isInternal) {
    //   return createErrorResponse('Comentário não encontrado', 404);
    // }

    return createSuccessResponse(comment);
  } catch (error) {
    console.error('Erro ao buscar comentário:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}

// PUT /api/comments/[id] - Atualizar comentário
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    const commentId = params.id;
    const body = await request.json();

    // Validar dados
    const validationResult = updateCommentSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(
        'Dados inválidos',
        400,
        validationResult.error.errors
      );
    }

    const { content } = validationResult.data;

    // Buscar comentário
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        ticket: {
          include: {
            createdBy: true,
            assignedTo: true,
          },
        },
      },
    });

    if (!comment) {
      return createErrorResponse('Comentário não encontrado', 404);
    }

    // Verificar permissões
    const userRole = session.user.role;
    const userId = session.user.id;
    const canEdit = userRole === 'ADMIN' || comment.userId === userId;

    if (!canEdit) {
      return createErrorResponse(
        'Sem permissão para editar este comentário',
        403
      );
    }

    // Atualizar comentário
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        updatedAt: new Date(),
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

    // Criar log de atividade
    await prisma.ticketLog.create({
      data: {
        ticketId: comment.ticketId,
        action: 'COMMENT_UPDATED',
        details: 'Comentário editado',
        userId,
      },
    });

    return createSuccessResponse(
      updatedComment,
      'Comentário atualizado com sucesso'
    );
  } catch (error) {
    console.error('Erro ao atualizar comentário:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}

// DELETE /api/comments/[id] - Deletar comentário
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    const commentId = params.id;

    // Buscar comentário
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        ticket: true,
      },
    });

    if (!comment) {
      return createErrorResponse('Comentário não encontrado', 404);
    }

    // Verificar permissões
    const userRole = session.user.role;
    const userId = session.user.id;
    const canDelete = userRole === 'ADMIN' || comment.userId === userId;

    if (!canDelete) {
      return createErrorResponse(
        'Sem permissão para deletar este comentário',
        403
      );
    }

    // Deletar comentário
    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Criar log de atividade
    await prisma.ticketLog.create({
      data: {
        ticketId: comment.ticketId,
        action: 'COMMENT_DELETED',
        details: 'Comentário removido',
        userId,
      },
    });

    return createSuccessResponse(null, 'Comentário deletado com sucesso');
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}
