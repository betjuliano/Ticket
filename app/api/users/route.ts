import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

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

    // Apenas admin pode ver todos os usuários
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Acesso negado',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    // Construir filtros
    const where: any = {
      isActive: true, // Por padrão, mostrar apenas usuários ativos
    };

    // Filtro de busca
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { matricula: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por role
    if (role && role !== 'all') {
      where.role = role;
    }

    // Filtro por status
    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }

    // Buscar usuários com contagem de tickets
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        matricula: true,
        telefone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            createdTickets: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Buscar último ticket de cada usuário
    const usersWithLastTicket = await Promise.all(
      users.map(async (user) => {
        const lastTicket = await prisma.ticket.findFirst({
          where: {
            createdById: user.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            createdAt: true,
          },
        });

        return {
          ...user,
          ticketsCount: user._count.createdTickets,
          lastTicket: lastTicket?.createdAt || null,
          phone: user.telefone, // Mapear telefone para phone para compatibilidade
          sector: getUserSector(user.role), // Mapear role para sector
          admissionDate: user.createdAt, // Usar data de criação como data de admissão
          status: user.isActive ? 'active' : 'inactive',
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: usersWithLastTicket,
      total: usersWithLastTicket.length,
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// Função para mapear role para sector
function getUserSector(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'Administração';
    case 'COORDINATOR':
      return 'Coordenação';
    case 'USER':
      return 'Usuário';
    default:
      return 'Outros';
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

    // Apenas admin pode criar usuários
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Acesso negado',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, role, matricula, telefone, password } = body;

    // Validar dados obrigatórios
    if (!name || !email || !role || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados obrigatórios não fornecidos',
        },
        { status: 400 }
      );
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email já cadastrado',
        },
        { status: 409 }
      );
    }

    // Hash da senha
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar novo usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        matricula,
        telefone,
        password: hashedPassword,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'Usuário criado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
