import { prisma } from './prisma';
import { logger } from './logger';

// Função simples de cache sem Redis por enquanto
async function getOrSetCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  try {
    // Por enquanto, sempre buscar dados frescos
    // TODO: Implementar cache real quando necessário
    return await fetchFn();
  } catch (error) {
    console.error('Cache error:', error);
    return await fetchFn();
  }
}

// Interfaces para analytics
interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  byCategory: Record<string, number>;
  avgResolutionTime: number;
  satisfactionRate: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: {
    admin: number;
    coordinator: number;
    user: number;
  };
  topCreators: Array<{
    userId: string;
    name: string;
    ticketCount: number;
  }>;
  topResolvers: Array<{
    userId: string;
    name: string;
    resolvedCount: number;
    avgResolutionTime: number;
  }>;
}

interface TimeSeriesData {
  date: string;
  created: number;
  resolved: number;
  open: number;
}

interface PerformanceMetrics {
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
  throughput: {
    ticketsPerDay: number;
    commentsPerDay: number;
  };
  efficiency: {
    firstResponseTime: number;
    resolutionRate: number;
    reopenRate: number;
  };
}

class AnalyticsService {
  // Obter estatísticas gerais de tickets
  async getTicketStats(period: string = '30d'): Promise<TicketStats> {
    const cacheKey = `ticket_stats:${period}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        try {
          const dateFilter = this.getDateFilter(period);

          // Contadores básicos
          const [total, open, inProgress, resolved, closed] = await Promise.all(
            [
              prisma.ticket.count({ where: dateFilter }),
              prisma.ticket.count({ where: { ...dateFilter, status: 'OPEN' } }),
              prisma.ticket.count({
                where: { ...dateFilter, status: 'IN_PROGRESS' },
              }),
              prisma.ticket.count({
                where: { ...dateFilter, status: 'RESOLVED' },
              }),
              prisma.ticket.count({
                where: { ...dateFilter, status: 'CLOSED' },
              }),
            ]
          );

          // Por prioridade
          const [lowPriority, mediumPriority, highPriority, urgentPriority] =
            await Promise.all([
              prisma.ticket.count({
                where: { ...dateFilter, priority: 'LOW' },
              }),
              prisma.ticket.count({
                where: { ...dateFilter, priority: 'MEDIUM' },
              }),
              prisma.ticket.count({
                where: { ...dateFilter, priority: 'HIGH' },
              }),
              prisma.ticket.count({
                where: { ...dateFilter, priority: 'URGENT' },
              }),
            ]);

          // Por categoria
          const categoryStats = await prisma.ticket.groupBy({
            by: ['category'],
            where: dateFilter,
            _count: { category: true },
          });

          const byCategory = categoryStats.reduce(
            (acc, stat) => {
              acc[stat.category] = stat._count.category;
              return acc;
            },
            {} as Record<string, number>
          );

          // Tempo médio de resolução
          const resolvedTickets = await prisma.ticket.findMany({
            where: {
              ...dateFilter,
              status: { in: ['RESOLVED', 'CLOSED'] },
              closedAt: { not: null },
            },
            select: {
              createdAt: true,
              closedAt: true,
            },
          });

          const avgResolutionTime =
            resolvedTickets.length > 0
              ? resolvedTickets.reduce((acc, ticket) => {
                  const diff =
                    new Date(ticket.closedAt!).getTime() -
                    new Date(ticket.createdAt).getTime();
                  return acc + diff;
                }, 0) /
                resolvedTickets.length /
                (1000 * 60 * 60) // em horas
              : 0;

          // Taxa de satisfação (mock - implementar com feedback real)
          const satisfactionRate = 94.5;

          return {
            total,
            open,
            inProgress,
            resolved,
            closed,
            byPriority: {
              low: lowPriority,
              medium: mediumPriority,
              high: highPriority,
              urgent: urgentPriority,
            },
            byCategory,
            avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
            satisfactionRate,
          };
        } catch (error) {
          logger.error('Failed to get ticket stats', error as Error, { period });
          throw error;
        }
      }
    );
  }

  // Obter estatísticas de usuários
  async getUserStats(period: string = '30d'): Promise<UserStats> {
    const cacheKey = `user_stats:${period}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        try {
          const dateFilter = this.getDateFilter(period);

          // Contadores básicos
          const [totalUsers, activeUsers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
          ]);

          // Por role
          const [adminCount, coordinatorCount, userCount] = await Promise.all([
            prisma.user.count({ where: { role: 'ADMIN' } }),
            prisma.user.count({ where: { role: 'COORDINATOR' } }),
            prisma.user.count({ where: { role: 'USER' } }),
          ]);

          // Top criadores de tickets
          const topCreators = await prisma.user.findMany({
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  createdTickets: {
                    where: dateFilter,
                  },
                },
              },
            },
            orderBy: {
              createdTickets: {
                _count: 'desc',
              },
            },
            take: 5,
          });

          // Top resolvedores
          const topResolvers = await prisma.user.findMany({
            select: {
              id: true,
              name: true,
              assignedTickets: {
                where: {
                  ...dateFilter,
                  status: { in: ['RESOLVED', 'CLOSED'] },
                  closedAt: { not: null },
                },
                select: {
                  createdAt: true,
                  closedAt: true,
                },
              },
            },
            orderBy: {
              assignedTickets: {
                _count: 'desc',
              },
            },
            take: 5,
          });

          const topResolversFormatted = topResolvers.map(user => {
            const resolvedCount = user.assignedTickets.length;
            const avgResolutionTime =
              resolvedCount > 0
                ? user.assignedTickets.reduce((acc, ticket) => {
                    const diff =
                      new Date(ticket.closedAt!).getTime() -
                      new Date(ticket.createdAt).getTime();
                    return acc + diff;
                  }, 0) /
                  resolvedCount /
                  (1000 * 60 * 60) // em horas
                : 0;

            return {
              userId: user.id,
              name: user.name,
              resolvedCount,
              avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
            };
          });

          return {
            totalUsers,
            activeUsers,
            usersByRole: {
              admin: adminCount,
              coordinator: coordinatorCount,
              user: userCount,
            },
            topCreators: topCreators.map(user => ({
              userId: user.id,
              name: user.name,
              ticketCount: user._count.createdTickets,
            })),
            topResolvers: topResolversFormatted,
          };
        } catch (error) {
          logger.error('Failed to get user stats', error as Error, { period });
          throw error;
        }
      }
    );
  }

  // Obter dados de série temporal
  async getTimeSeriesData(period: string = '30d'): Promise<TimeSeriesData[]> {
    const cacheKey = `time_series:${period}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        try {
          const days = this.getPeriodDays(period);
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);

          const data: TimeSeriesData[] = [];

          for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const [created, resolved] = await Promise.all([
              prisma.ticket.count({
                where: {
                  createdAt: {
                    gte: date,
                    lt: nextDate,
                  },
                },
              }),
              prisma.ticket.count({
                where: {
                  closedAt: {
                    gte: date,
                    lt: nextDate,
                  },
                  status: { in: ['RESOLVED', 'CLOSED'] },
                },
              }),
            ]);

            const open = await prisma.ticket.count({
              where: {
                createdAt: { lte: date },
                OR: [{ closedAt: null }, { closedAt: { gt: date } }],
              },
            });

            data.push({
              date: date.toISOString().split('T')[0] || '',
              created,
              resolved,
              open,
            });
          }

          return data;
        } catch (error) {
          logger.error('Failed to get time series data', error as Error, { period });
          throw error;
        }
      }
    );
  }

  // Obter métricas de performance
  async getPerformanceMetrics(
    period: string = '30d'
  ): Promise<PerformanceMetrics> {
    const cacheKey = `performance_metrics:${period}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        try {
          const dateFilter = this.getDateFilter(period);

          // Tempo de primeira resposta
          const ticketsWithComments = await prisma.ticket.findMany({
            where: dateFilter,
            include: {
              comments: {
                orderBy: { createdAt: 'asc' },
                take: 1,
              },
            },
          });

          const firstResponseTimes = ticketsWithComments
            .filter(ticket => ticket.comments.length > 0)
            .map(ticket => {
              const diff =
                new Date(ticket.comments?.[0]?.createdAt || new Date()).getTime() -
                new Date(ticket.createdAt).getTime();
              return diff / (1000 * 60 * 60); // em horas
            });

          const firstResponseTime =
            firstResponseTimes.length > 0
              ? firstResponseTimes.reduce((a, b) => a + b, 0) /
                firstResponseTimes.length
              : 0;

          // Taxa de resolução
          const totalTickets = await prisma.ticket.count({ where: dateFilter });
          const resolvedTickets = await prisma.ticket.count({
            where: {
              ...dateFilter,
              status: { in: ['RESOLVED', 'CLOSED'] },
            },
          });

          const resolutionRate =
            totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

          // Taxa de reabertura (mock)
          const reopenRate = 5.2;

          // Throughput
          const days = this.getPeriodDays(period);
          const ticketsPerDay = totalTickets / days;

          const totalComments = await prisma.comment.count({
            where: {
              createdAt: dateFilter.createdAt,
            },
          });
          const commentsPerDay = totalComments / days;

          return {
            responseTime: {
              avg: 2.5, // mock
              p95: 8.2, // mock
              p99: 24.1, // mock
            },
            throughput: {
              ticketsPerDay: Math.round(ticketsPerDay * 100) / 100,
              commentsPerDay: Math.round(commentsPerDay * 100) / 100,
            },
            efficiency: {
              firstResponseTime: Math.round(firstResponseTime * 100) / 100,
              resolutionRate: Math.round(resolutionRate * 100) / 100,
              reopenRate,
            },
          };
        } catch (error) {
          logger.error('Failed to get performance metrics');
          throw error;
        }
      }
    );
  }

  // Obter insights e recomendações
  async getInsights(period: string = '30d'): Promise<any> {
    const cacheKey = `insights:${period}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        try {
          const [ticketStats, userStats, performanceMetrics] =
            await Promise.all([
              this.getTicketStats(period),
              this.getUserStats(period),
              this.getPerformanceMetrics(period),
            ]);

          const insights = [];

          // Análise de carga de trabalho
          if (ticketStats.open > ticketStats.resolved) {
            insights.push({
              type: 'warning',
              title: 'Acúmulo de Tickets',
              message: `Há ${ticketStats.open} tickets abertos contra ${ticketStats.resolved} resolvidos. Considere redistribuir a carga de trabalho.`,
              priority: 'high',
            });
          }

          // Análise de prioridades
          const highPriorityRatio =
            (ticketStats.byPriority.high + ticketStats.byPriority.urgent) /
            ticketStats.total;
          if (highPriorityRatio > 0.3) {
            insights.push({
              type: 'alert',
              title: 'Muitos Tickets de Alta Prioridade',
              message: `${Math.round(highPriorityRatio * 100)}% dos tickets são de alta prioridade. Revise os critérios de priorização.`,
              priority: 'medium',
            });
          }

          // Análise de performance
          if (performanceMetrics.efficiency.firstResponseTime > 4) {
            insights.push({
              type: 'warning',
              title: 'Tempo de Primeira Resposta Alto',
              message: `Tempo médio de primeira resposta é ${performanceMetrics.efficiency.firstResponseTime}h. Meta recomendada: 2h.`,
              priority: 'medium',
            });
          }

          // Análise de satisfação
          if (ticketStats.satisfactionRate < 90) {
            insights.push({
              type: 'alert',
              title: 'Taxa de Satisfação Baixa',
              message: `Taxa de satisfação atual: ${ticketStats.satisfactionRate}%. Investigue possíveis melhorias no atendimento.`,
              priority: 'high',
            });
          }

          return {
            insights,
            recommendations: [
              'Considere implementar automação para tickets de baixa complexidade',
              'Revise regularmente a distribuição de carga entre técnicos',
              'Mantenha a base de conhecimento atualizada para reduzir tickets recorrentes',
              'Implemente SLAs claros para diferentes tipos de tickets',
            ],
          };
        } catch (error) {
          logger.error('Failed to get insights');
          throw error;
        }
      }
    );
  }

  // Utilitários privados
  private getDateFilter(period: string) {
    const days = this.getPeriodDays(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
      createdAt: {
        gte: startDate,
      },
    };
  }

  private getPeriodDays(period: string): number {
    switch (period) {
      case '1d':
        return 1;
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case '1y':
        return 365;
      default:
        return 30;
    }
  }
}

// Instância singleton do serviço de analytics
export const analyticsService = new AnalyticsService();

export default analyticsService;
