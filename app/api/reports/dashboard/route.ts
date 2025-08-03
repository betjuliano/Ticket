import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

// GET /api/reports/dashboard - Dados do dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // dias
    const userRole = session.user.role;
    const userId = session.user.id;

    // Calcular data de início baseada no período
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Filtros baseados no role do usuário
    const ticketFilters: any = {
      createdAt: {
        gte: startDate,
      },
    };

    // Usuários comuns só veem seus próprios tickets
    if (userRole === 'USER') {
      ticketFilters.OR = [{ createdById: userId }, { assignedToId: userId }];
    }

    // Buscar dados em paralelo
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      ticketsByPriority,
      ticketsByCategory,
      ticketsByStatus,
      recentTickets,
      ticketsOverTime,
      avgResolutionTime,
      userStats,
      topCategories,
      priorityDistribution,
    ] = await Promise.all([
      // Total de tickets
      prisma.ticket.count({ where: ticketFilters }),

      // Tickets por status
      prisma.ticket.count({
        where: { ...ticketFilters, status: 'OPEN' },
      }),
      prisma.ticket.count({
        where: { ...ticketFilters, status: 'IN_PROGRESS' },
      }),
      prisma.ticket.count({
        where: { ...ticketFilters, status: 'RESOLVED' },
      }),
      prisma.ticket.count({
        where: { ...ticketFilters, status: 'CLOSED' },
      }),

      // Tickets por prioridade
      prisma.ticket.groupBy({
        by: ['priority'],
        where: ticketFilters,
        _count: { id: true },
      }),

      // Tickets por categoria
      prisma.ticket.groupBy({
        by: ['category'],
        where: ticketFilters,
        _count: { id: true },
      }),

      // Distribuição por status
      prisma.ticket.groupBy({
        by: ['status'],
        where: ticketFilters,
        _count: { id: true },
      }),

      // Tickets recentes
      prisma.ticket.findMany({
        where: ticketFilters,
        include: {
          createdBy: {
            select: { name: true, email: true },
          },
          assignedTo: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Tickets ao longo do tempo (últimos 30 dias)
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM tickets 
        WHERE created_at >= ${startDate}
        ${
          userRole === 'USER'
            ? prisma.$queryRaw`AND (created_by_id = ${userId} OR assigned_to_id = ${userId})`
            : prisma.$queryRaw``
        }
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,

      // Tempo médio de resolução
      prisma.$queryRaw`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours
        FROM tickets 
        WHERE resolved_at IS NOT NULL 
        AND created_at >= ${startDate}
        ${
          userRole === 'USER'
            ? prisma.$queryRaw`AND (created_by_id = ${userId} OR assigned_to_id = ${userId})`
            : prisma.$queryRaw``
        }
      `,

      // Estatísticas por usuário (apenas para admin/coordenador)
      userRole !== 'USER'
        ? prisma.$queryRaw`
        SELECT 
          u.name,
          u.email,
          u.role,
          COUNT(CASE WHEN t.created_by_id = u.id THEN 1 END) as created_count,
          COUNT(CASE WHEN t.assigned_to_id = u.id THEN 1 END) as assigned_count,
          COUNT(CASE WHEN t.assigned_to_id = u.id AND t.status = 'RESOLVED' THEN 1 END) as resolved_count
        FROM users u
        LEFT JOIN tickets t ON (t.created_by_id = u.id OR t.assigned_to_id = u.id)
          AND t.created_at >= ${startDate}
        WHERE u.is_active = true
        GROUP BY u.id, u.name, u.email, u.role
        ORDER BY created_count DESC
        LIMIT 10
      `
        : [],

      // Top categorias
      prisma.ticket.groupBy({
        by: ['category'],
        where: ticketFilters,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),

      // Distribuição de prioridade
      prisma.ticket.groupBy({
        by: ['priority'],
        where: ticketFilters,
        _count: { id: true },
      }),
    ]);

    // Processar dados para o frontend
    const dashboardData = {
      summary: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
        avgResolutionTime: avgResolutionTime[0]?.avg_hours || 0,
      },

      charts: {
        ticketsByStatus: ticketsByStatus.map(item => ({
          status: item.status,
          count: item._count.id,
          label: getStatusLabel(item.status),
        })),

        ticketsByPriority: ticketsByPriority.map(item => ({
          priority: item.priority,
          count: item._count.id,
          label: getPriorityLabel(item.priority),
        })),

        ticketsByCategory: ticketsByCategory.map(item => ({
          category: item.category,
          count: item._count.id,
          label: getCategoryLabel(item.category),
        })),

        ticketsOverTime: (ticketsOverTime as any[]).map(item => ({
          date: item.date,
          count: parseInt(item.count),
        })),

        topCategories: topCategories.map(item => ({
          category: item.category,
          count: item._count.id,
          label: getCategoryLabel(item.category),
        })),

        priorityDistribution: priorityDistribution.map(item => ({
          priority: item.priority,
          count: item._count.id,
          label: getPriorityLabel(item.priority),
          color: getPriorityColor(item.priority),
        })),
      },

      recentTickets: recentTickets.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt,
        createdBy: ticket.createdBy,
        assignedTo: ticket.assignedTo,
      })),

      userStats:
        userRole !== 'USER'
          ? (userStats as any[]).map(user => ({
              name: user.name,
              email: user.email,
              role: user.role,
              createdCount: parseInt(user.created_count) || 0,
              assignedCount: parseInt(user.assigned_count) || 0,
              resolvedCount: parseInt(user.resolved_count) || 0,
            }))
          : [],
    };

    return createSuccessResponse(dashboardData);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}

// Funções auxiliares para labels
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: 'Aberto',
    IN_PROGRESS: 'Em Andamento',
    WAITING_FOR_USER: 'Aguardando Usuário',
    WAITING_FOR_THIRD_PARTY: 'Aguardando Terceiros',
    RESOLVED: 'Resolvido',
    CLOSED: 'Fechado',
    CANCELLED: 'Cancelado',
  };
  return labels[status] || status;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  };
  return labels[priority] || priority;
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    TECHNICAL_SUPPORT: 'Suporte Técnico',
    ACCOUNT_ACCESS: 'Acesso à Conta',
    SYSTEM_ERROR: 'Erro do Sistema',
    FEATURE_REQUEST: 'Solicitação de Funcionalidade',
    DOCUMENTATION: 'Documentação',
    OTHER: 'Outros',
  };
  return labels[category] || category;
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: '#10B981',
    MEDIUM: '#F59E0B',
    HIGH: '#EF4444',
    URGENT: '#DC2626',
  };
  return colors[priority] || '#6B7280';
}
