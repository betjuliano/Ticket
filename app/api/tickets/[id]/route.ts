import { NextRequest } from 'next/server'
import { updateTicketSchema } from '@/lib/validations'
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  logRequest,
  sanitizeInput
} from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions, canUserAccessTicket } from '@/lib/auth'

// GET - Buscar ticket por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    logRequest('GET', `/api/tickets/${id}`)
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Não autenticado', 401)
    }

    // Verificar se o usuário pode acessar este ticket
    const canAccess = await canUserAccessTicket(session.user.id, session.user.role, id)
    if (!canAccess) {
      return createErrorResponse('Acesso negado', 403)
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            matricula: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            matricula: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        attachments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
    
    if (!ticket) {
      return createErrorResponse('Ticket não encontrado', 404)
    }

    return createSuccessResponse(ticket)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT - Atualizar ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    logRequest('PUT', `/api/tickets/${id}`)
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Não autenticado', 401)
    }

    // Verificar se o usuário pode acessar este ticket
    const canAccess = await canUserAccessTicket(session.user.id, session.user.role, id)
    if (!canAccess) {
      return createErrorResponse('Acesso negado', 403)
    }
    
    const body = await request.json()
    const sanitizedBody = sanitizeInput(body)
    
    // Validar dados de entrada
    const validatedData = updateTicketSchema.parse(sanitizedBody)

    // Verificar se o ticket existe
    const existingTicket = await prisma.ticket.findUnique({
      where: { id }
    })
    
    if (!existingTicket) {
      return createErrorResponse('Ticket não encontrado', 404)
    }

    // Atualizar ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        ...validatedData,
        // Se o status mudou para CLOSED ou RESOLVED, definir closedAt
        ...(validatedData.status && ['CLOSED', 'RESOLVED'].includes(validatedData.status) && !existingTicket.closedAt
          ? { closedAt: new Date() }
          : {}),
        // Se o status mudou de CLOSED/RESOLVED para outro, remover closedAt
        ...(validatedData.status && !['CLOSED', 'RESOLVED'].includes(validatedData.status) && existingTicket.closedAt
          ? { closedAt: null }
          : {})
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

    return createSuccessResponse(updatedTicket, 'Ticket atualizado com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Atualizar ticket parcialmente (para botões de ação)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    logRequest('PATCH', `/api/tickets/${id}`)
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Não autenticado', 401)
    }

    // Verificar se o usuário pode acessar este ticket
    const canAccess = await canUserAccessTicket(session.user.id, session.user.role, id)
    if (!canAccess) {
      return createErrorResponse('Acesso negado', 403)
    }
    
    const body = await request.json()
    const sanitizedBody = sanitizeInput(body)

    // Verificar se o ticket existe
    const existingTicket = await prisma.ticket.findUnique({
      where: { id }
    })
    
    if (!existingTicket) {
      return createErrorResponse('Ticket não encontrado', 404)
    }

    // Atualizar ticket parcialmente
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        ...sanitizedBody,
        // Se o status mudou para CLOSED ou RESOLVED, definir closedAt
        ...(sanitizedBody.status && ['CLOSED', 'RESOLVED'].includes(sanitizedBody.status) && !existingTicket.closedAt
          ? { closedAt: new Date() }
          : {}),
        // Se o status mudou de CLOSED/RESOLVED para outro, remover closedAt
        ...(sanitizedBody.status && !['CLOSED', 'RESOLVED'].includes(sanitizedBody.status) && existingTicket.closedAt
          ? { closedAt: null }
          : {})
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

    return createSuccessResponse(updatedTicket, 'Ticket atualizado com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Excluir ticket (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    logRequest('DELETE', `/api/tickets/${id}`)
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Não autenticado', 401)
    }

    // Apenas admins e coordenadores podem excluir tickets
    if (!['ADMIN', 'COORDINATOR'].includes(session.user.role)) {
      return createErrorResponse('Acesso negado', 403)
    }

    // Verificar se o ticket existe
    const existingTicket = await prisma.ticket.findUnique({
      where: { id }
    })
    
    if (!existingTicket) {
      return createErrorResponse('Ticket não encontrado', 404)
    }

    // Soft delete - marcar como cancelado
    const deletedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        closedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return createSuccessResponse(deletedTicket, 'Ticket excluído com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

