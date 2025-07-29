import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyticsService } from '@/lib/analytics'
import { createSuccessResponse, createErrorResponse, handleApiError, logRequest } from '@/lib/api-utils'

// GET - Obter dados de analytics
export async function GET(request: NextRequest) {
  try {
    logRequest('GET', '/api/analytics')
    
    const session = await getServerSession(authOptions)
    if (!session || !['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
      return createErrorResponse('Acesso negado', 403)
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const type = searchParams.get('type') || 'overview'

    let data

    switch (type) {
      case 'overview':
        const [ticketStats, userStats, performanceMetrics] = await Promise.all([
          analyticsService.getTicketStats(period),
          analyticsService.getUserStats(period),
          analyticsService.getPerformanceMetrics(period)
        ])
        data = { ticketStats, userStats, performanceMetrics }
        break

      case 'tickets':
        data = await analyticsService.getTicketStats(period)
        break

      case 'users':
        data = await analyticsService.getUserStats(period)
        break

      case 'performance':
        data = await analyticsService.getPerformanceMetrics(period)
        break

      case 'timeseries':
        data = await analyticsService.getTimeSeriesData(period)
        break

      case 'insights':
        data = await analyticsService.getInsights(period)
        break

      default:
        return createErrorResponse('Tipo de analytics inválido', 400)
    }

    return createSuccessResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}

