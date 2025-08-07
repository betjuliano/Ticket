import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/client';

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

    const { id } = params;
    const body = await request.json();
    const { response, action } = body; // action: 'respond' ou 'return_to_coordination'

    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Resposta é obrigatória' },
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
        assignedTo: {
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

    // Verificar se o usuário é o responsável pelo ticket ou tem permissão
    const canRespond = 
      existingTicket.assignedToId === session.user.id || 
      session.user.role === 'ADMIN' || 
      session.user.role === 'COORDINATOR';

    if (!canRespond) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Você não tem permissão para responder a este ticket' 
        },
        { status: 403 }
      );
    }

    // Determinar o novo status baseado na ação
    let newStatus = existingTicket.status;
    let newAssignedToId = existingTicket.assignedToId;

    if (action === 'return_to_coordination') {
      // Devolver para coordenação
      newStatus = 'OPEN';
      newAssignedToId = null; // Remove atribuição
    } else {
      // Responder ao ticket
      newStatus = 'IN_PROGRESS';
    }

    // Atualizar o ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: newStatus,
        assignedToId: newAssignedToId,
        updatedAt: new Date(),
        // Adicionar a resposta como comentário ou em um campo específico
        description: existingTicket.description + '\n\n--- RESPOSTA DO SUPORTE ---\n' + response,
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

    const message = action === 'return_to_coordination' 
      ? 'Ticket devolvido para coordenação com sucesso'
      : 'Resposta adicionada ao ticket com sucesso';

    return NextResponse.json({ 
      success: true, 
      ticket: updatedTicket,
      message
    });
  } catch (error) {
    console.error('Erro ao responder ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 