import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'

interface Ticket {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  createdAt: string
  updatedAt: string
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
  _count?: {
    comments: number
    attachments: number
  }
}

interface TicketFilters {
  status?: string
  priority?: string
  category?: string
  assignedTo?: string
  search?: string
  page?: number
  limit?: number
}

interface UseTicketsReturn {
  tickets: Ticket[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: TicketFilters
  setFilters: (filters: Partial<TicketFilters>) => void
  createTicket: (data: any) => Promise<Ticket>
  updateTicket: (id: string, data: any) => Promise<Ticket>
  deleteTicket: (id: string) => Promise<void>
  refreshTickets: () => Promise<void>
}

export function useTickets(initialFilters: TicketFilters = {}): UseTicketsReturn {
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [filters, setFiltersState] = useState<TicketFilters>({
    page: 1,
    limit: 10,
    ...initialFilters
  })

  const fetchTickets = useCallback(async () => {
    if (!session) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/tickets?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar tickets')
      }

      const data = await response.json()
      
      if (data.success) {
        setTickets(data.data)
        if (data.meta) {
          setPagination(data.meta)
        }
      } else {
        throw new Error(data.message || 'Erro ao carregar tickets')
      }
    } catch (err: any) {
      setError(err.message)
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [session, filters])

  const setFilters = useCallback((newFilters: Partial<TicketFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters, page: 1 }))
  }, [])

  const createTicket = useCallback(async (data: any): Promise<Ticket> => {
    if (!session) throw new Error('Não autenticado')

    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...data,
        createdBy: session.user.id
      })
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Erro ao criar ticket')
    }

    toast({
      title: 'Sucesso',
      description: 'Ticket criado com sucesso'
    })

    await fetchTickets()
    return result.data
  }, [session, fetchTickets])

  const updateTicket = useCallback(async (id: string, data: any): Promise<Ticket> => {
    if (!session) throw new Error('Não autenticado')

    const response = await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Erro ao atualizar ticket')
    }

    toast({
      title: 'Sucesso',
      description: 'Ticket atualizado com sucesso'
    })

    await fetchTickets()
    return result.data
  }, [session, fetchTickets])

  const deleteTicket = useCallback(async (id: string): Promise<void> => {
    if (!session) throw new Error('Não autenticado')

    const response = await fetch(`/api/tickets/${id}`, {
      method: 'DELETE'
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Erro ao excluir ticket')
    }

    toast({
      title: 'Sucesso',
      description: 'Ticket excluído com sucesso'
    })

    await fetchTickets()
  }, [session, fetchTickets])

  const refreshTickets = useCallback(async () => {
    await fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  return {
    tickets,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    createTicket,
    updateTicket,
    deleteTicket,
    refreshTickets
  }
}