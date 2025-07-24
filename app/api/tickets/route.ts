import { NextRequest, NextResponse } from 'next/server'
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

// Tipo para Ticket
interface Ticket {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  category: string
}

// Mock data - em produção, isso viria do banco de dados
let mockTickets: Ticket[] = [
  {
    id: '1',
    title: 'Sistema de login não funciona',
    description: 'Usuários não conseguem fazer login no sistema',
    status: 'open',
    priority: 'high',
    createdBy: 'user1',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
    category: 'Sistema'
  },
  {
    id: '2',
    title: 'Lentidão na rede',
    description: 'Rede corporativa está muito lenta',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 'tech1',
    createdBy: 'user2',
    createdAt: '2025-01-19T14:30:00Z',
    updatedAt: '2025-01-20T09:15:00Z',
    category: 'Rede'
  },
  {
    id: '3',
    title: 'Impressora não funciona',
    description: 'Impressora do setor financeiro não está imprimindo',
    status: 'resolved',
    priority: 'low',
    assignedTo: 'tech2',
    createdBy: 'user3',
    createdAt: '2025-01-18T09:00:00Z',
    updatedAt: '2025-01-19T16:30:00Z',
    category: 'Hardware'
  }
]

// GET - Listar tickets
export async function GET(request: NextRequest) {
  try {
    logRequest('GET', '/api/tickets')
    
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

    let filteredTickets = mockTickets

    // Aplicar filtros
    if (filters.status) {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === filters.status)
    }
    if (filters.priority) {
      filteredTickets = filteredTickets.filter(ticket => ticket.priority === filters.priority)
    }
    if (filters.assignedTo) {
      filteredTickets = filteredTickets.filter(ticket => ticket.assignedTo === filters.assignedTo)
    }
    if (filters.category) {
      filteredTickets = filteredTickets.filter(ticket => ticket.category === filters.category)
    }
    if (filters.createdBy) {
      filteredTickets = filteredTickets.filter(ticket => ticket.createdBy === filters.createdBy)
    }

    // Aplicar paginação
    const paginatedResult = paginate(filteredTickets, filters.page, filters.limit)

    return createSuccessResponse(paginatedResult.data, undefined, paginatedResult.meta)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Criar novo ticket
export async function POST(request: NextRequest) {
  try {
    logRequest('POST', '/api/tickets')
    
    const body = await request.json()
    const sanitizedBody = sanitizeInput(body)
    
    // Validar dados de entrada
    const validatedData = createTicketSchema.parse(sanitizedBody)

    const newTicket: Ticket = {
      id: generateId(),
      title: validatedData.title,
      description: validatedData.description,
      status: 'open',
      priority: validatedData.priority,
      assignedTo: validatedData.assignedTo,
      createdBy: validatedData.createdBy,
      createdAt: formatDate(new Date()),
      updatedAt: formatDate(new Date()),
      category: validatedData.category
    }

    // Em produção, salvar no banco de dados
    mockTickets.push(newTicket)

    return createSuccessResponse(newTicket, 'Ticket criado com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

