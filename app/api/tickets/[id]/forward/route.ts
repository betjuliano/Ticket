import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não autorizado',
        },
        { status: 401 }
      );
    }

    // Verificar se o usuário tem permissão para encaminhar tickets
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR') {
      return NextResponse.json(
        {
          success: false,
          error: 'Acesso negado - apenas administradores e coordenadores podem encaminhar tickets',
        },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { assignedToId, status } = body;

    if (!assignedToId) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário de suporte é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o ticket existe
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { success: false, error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário de suporte existe
    const supportUser = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!supportUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário de suporte não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar o ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        assignedToId,
        status: status || 'IN_PROGRESS',
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            matricula: true,
            telefone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      ticket: updatedTicket,
      message: `Ticket encaminhado com sucesso para ${supportUser.name}`
    });
  } catch (error) {
    console.error('Erro ao encaminhar ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 