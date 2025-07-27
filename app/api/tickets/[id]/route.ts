import { NextRequest, NextResponse } from 'next/server'

// Tipo para Ticket (mesmo do arquivo anterior)
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
  }
]

// GET - Buscar ticket por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ticket = mockTickets.find(t => t.id === id)
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: ticket
    })
  } catch (error) {
    console.error('Erro ao buscar ticket:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const ticketIndex = mockTickets.findIndex(t => t.id === id)
    
    if (ticketIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Ticket não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar ticket
    const updatedTicket = {
      ...mockTickets[ticketIndex],
      ...body,
      id: id, // Garantir que o ID não seja alterado
      updatedAt: new Date().toISOString()
    }

    mockTickets[ticketIndex] = updatedTicket

    return NextResponse.json({
      success: true,
      data: updatedTicket
    })
  } catch (error) {
    console.error('Erro ao atualizar ticket:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ticketIndex = mockTickets.findIndex(t => t.id === id)
    
    if (ticketIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Ticket não encontrado' },
        { status: 404 }
      )
    }

    // Remover ticket
    const deletedTicket = mockTickets.splice(ticketIndex, 1)[0]

    return NextResponse.json({
      success: true,
      message: 'Ticket excluído com sucesso',
      data: deletedTicket
    })
  } catch (error) {
    console.error('Erro ao excluir ticket:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

