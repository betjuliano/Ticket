import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/client';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const userId = searchParams.get('userId');

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    // Se não for admin ou coordenador, só pode ver seus próprios tickets
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR') {
      where.createdById = session.user.id;
    } else if (userId) {
      // Admin/coordenador pode filtrar por usuário específico
      where.createdById = userId;
    }

    const tickets = await prisma.ticket.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformar os dados para o formato esperado pelo frontend
    const transformedTickets = tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category || 'Outros',
      tags: ticket.tags || '',
      createdById: ticket.createdById,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      createdBy: {
        id: ticket.createdBy.id,
        name: ticket.createdBy.name,
        email: ticket.createdBy.email,
        role: ticket.createdBy.role,
        matricula: ticket.createdBy.matricula,
        phone: ticket.createdBy.telefone,
      },
    }));

    return NextResponse.json({
      success: true,
      tickets: transformedTickets,
      total: transformedTickets.length,
    });
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, description, priority, category } = body;

    if (!title || !description || !priority) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados obrigatórios não fornecidos',
        },
        { status: 400 }
      );
    }

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        status: 'OPEN',
        priority,
        category: category || 'Outros',
        tags: 'chamado,sistema',
        createdById: session.user.id, // Usar ID do usuário logado
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
      },
    });

    const transformedTicket = {
      id: newTicket.id,
      title: newTicket.title,
      description: newTicket.description,
      status: newTicket.status,
      priority: newTicket.priority,
      category: newTicket.category || 'Outros',
      tags: newTicket.tags || '',
      createdById: newTicket.createdById,
      createdAt: newTicket.createdAt,
      updatedAt: newTicket.updatedAt,
      createdBy: {
        id: newTicket.createdBy.id,
        name: newTicket.createdBy.name,
        email: newTicket.createdBy.email,
        role: newTicket.createdBy.role,
        matricula: newTicket.createdBy.matricula,
        phone: newTicket.createdBy.telefone,
      },
    };

    return NextResponse.json({
      success: true,
      ticket: transformedTicket,
      message: 'Ticket criado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
