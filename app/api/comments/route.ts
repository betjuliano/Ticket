import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  logRequest,
} from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions, canUserAccessTicket } from '@/lib/auth';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  ticketId: z.string(),
  isInternal: z.boolean().default(false),
});

// GET - Listar comentários de um ticket
export async function GET(request: NextRequest) {
  try {
    logRequest('GET', '/api/comments');

    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Não autenticado', 401);
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return createErrorResponse('ticketId é obrigatório', 400);
    }

    const hasAccess = await canUserAccessTicket(
      session.user.id,
      session.user.role,
      ticketId
    );

    if (!hasAccess) {
      return createErrorResponse('Acesso negado', 403);
    }

    const comments = await prisma.comment.findMany({
      where: { ticketId },
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return createSuccessResponse(comments);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Criar comentário
export async function POST(request: NextRequest) {
  try {
    logRequest('POST', '/api/comments');

    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Não autenticado', 401);
    }

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    const hasAccess = await canUserAccessTicket(
      session.user.id,
      session.user.role,
      validatedData.ticketId
    );

    if (!hasAccess) {
      return createErrorResponse('Acesso negado', 403);
    }

    const newComment = await prisma.comment.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    return createSuccessResponse(
      newComment,
      'Comentário adicionado com sucesso'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
