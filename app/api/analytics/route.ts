import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // dias
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Métricas principais
    const [totalTickets, openTickets, resolvedTickets] = await Promise.all([
      prisma.ticket.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.ticket.count({
        where: { 
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          createdAt: { gte: startDate }
        }
      }),
      prisma.ticket.count({
        where: { 
          status: 'RESOLVED',
          createdAt: { gte: startDate }
        }
      })
    ])
    
    // Calcular tempo médio de resolução separadamente (se necessário)
    const avgResolutionTime = await prisma.ticket.aggregate({
      where: {
        status: 'RESOLVED',
        closedAt: { not: null },
        createdAt: { gte: startDate }
      },
      _count: { id: true }
      // TODO: Implementar cálculo de tempo médio quando o schema incluir closedAt
    })

    // Tickets por categoria
    const ticketsByCategory = await prisma.ticket.groupBy({
      by: ['category'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true }
    })

    // Tickets por prioridade
    const ticketsByPriority = await prisma.ticket.groupBy({
      by: ['priority'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true }
    })

    // Tickets por dia (últimos 30 dias)
    const ticketsPerDay = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "tickets"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date
    `

    // Performance por usuário (coordenadores/admins)
    const userPerformance = await prisma.ticket.groupBy({
      by: ['assignedToId'],
      where: {
        assignedToId: { not: null },
        createdAt: { gte: startDate }
      },
      _count: { id: true }
      // TODO: Implementar cálculo de tempo médio quando necessário
    })

    return NextResponse.json({
      summary: {
        totalTickets,
        openTickets,
        resolvedTickets,
        resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets * 100).toFixed(1) : 0,
        avgResolutionTime: avgResolutionTime._count.id || 0 // Temporário até implementar cálculo real
      },
      charts: {
        ticketsByCategory,
        ticketsByPriority,
        ticketsPerDay,
        userPerformance
      }
    })
  } catch (error) {
    console.error('Erro ao buscar analytics:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}