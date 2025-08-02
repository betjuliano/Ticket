import { NextRequest } from 'next/server'
import { createTicketSchema, ticketFiltersSchema } from '@/lib/validations'
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  logRequest,
  sanitizeInput,
  paginate,
  generateId,
  formatDate
} from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Listar tickets
export async function GET(request: NextRequest) {
  try {
    logRequest('GET', '/api/tickets')
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Não autenticado', 401)
    }
    
    const { searchParams } = new URL(request.url)
    
    // Validar parâmetros de consulta
    const filters = ticketFiltersSchema.parse({
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      assignedTo: searchParams.get('assignedTo'),
      category: searchParams.get('category'),
      createdBy: searchParams.get('createdBy'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    // Construir filtros para Prisma
    const where: any = {}
    
    if (filters.status) {
      where.status = filters.status
    }
    if (filters.priority) {
      where.priority = filters.priority
    }
    if (filters.assignedTo) {
      where.assignedToId = filters.assignedTo
    }
    if (filters.category) {
      where.category = filters.category
    }
    if (filters.createdBy) {
      where.createdById = filters.createdBy
    }

    // Se não for admin ou coordenador, mostrar apenas tickets próprios ou atribuídos
    if (!['ADMIN', 'COORDINATOR'].includes(session.user.role)) {
      where.OR = [
        { createdById: session.user.id },
        { assignedToId: session.user.id }
      ]
    }

    // Buscar tickets com relacionamentos
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    })

    // Contar total para paginação
    const total = await prisma.ticket.count({ where })

    const paginatedResult = {
      data: tickets,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit)
      }
    }

    return createSuccessResponse(paginatedResult.data, undefined, paginatedResult.meta)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Criar novo ticket
export async function POST(request: NextRequest) {
  try {
    logRequest('POST', '/api/tickets')
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Não autenticado', 401)
    }
    
    const body = await request.json()
    const sanitizedBody = sanitizeInput(body)
    
    // Validar dados de entrada
    const validatedData = createTicketSchema.parse({
      ...sanitizedBody,
      createdBy: session.user.id // Usar ID do usuário da sessão
    })

    // Criar ticket no banco de dados
    const newTicket = await prisma.ticket.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        category: validatedData.category,
        tags: '', // Inicializar vazio, pode ser atualizado depois
        createdById: session.user.id,
        assignedToId: validatedData.assignedTo || null,
        status: 'OPEN'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return createSuccessResponse(newTicket, 'Ticket criado com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

