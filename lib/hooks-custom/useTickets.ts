import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import { Ticket, TicketStatus, TicketPriority } from '@/types/ticket';

interface TicketFilters {
  search?: string;
  status?: TicketStatus | 'all';
  priority?: TicketPriority | 'all';
  userId?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface CreateTicketData {
  title: string;
  description: string;
  priority: TicketPriority;
  category: string;
  tags?: string[];
  estimatedHours?: number;
  dueDate?: string;
}

interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  tags?: string[];
  assignedToId?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface TicketsResponse {
  tickets: Ticket[];
  total: number;
}

interface TicketResponse {
  ticket: Ticket;
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API com tipos corretos
  const api = useApi<any>('/api', {
    cacheTime: 5 * 60 * 1000, // 5 minutos
    retryCount: 3,
    retryDelay: 1000,
  });

  // Validação de dados
  const validateCreateTicket = useCallback((data: CreateTicketData): CreateTicketData => {
    if (!data.title?.trim()) {
      throw new Error('Título é obrigatório');
    }
    if (!data.description?.trim()) {
      throw new Error('Descrição é obrigatória');
    }
    if (!data.priority) {
      throw new Error('Prioridade é obrigatória');
    }
    if (!data.category?.trim()) {
      throw new Error('Categoria é obrigatória');
    }
    return data;
  }, []);

  const validateUpdateTicket = useCallback((data: UpdateTicketData): UpdateTicketData => {
    if (data.title !== undefined && !data.title?.trim()) {
      throw new Error('Título não pode estar vazio');
    }
    if (data.description !== undefined && !data.description?.trim()) {
      throw new Error('Descrição não pode estar vazia');
    }
    return data;
  }, []);

  /**
   * Função para buscar tickets
   * Implementa cache inteligente e filtros avançados
   */
  const fetchTickets = useCallback(async (newFilters?: Partial<TicketFilters>) => {
    setIsLoading(true);
    setError(null);

    try {
      // Mesclar filtros
      const mergedFilters = { ...filters, ...newFilters };
      
      // Limpar filtros vazios
      const cleanFilters = Object.fromEntries(
        Object.entries(mergedFilters).filter(([_, value]) => 
          value !== undefined && value !== '' && value !== 'all'
        )
      );

      const response = await api.get('/tickets', cleanFilters);
      
      if (response.success && response.data) {
        setTickets(response.data.tickets || []);
        setFilters(mergedFilters);
      } else {
        throw new Error(response.error || 'Erro ao buscar tickets');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      // Log detalhado para debugging
      console.error('Erro ao buscar tickets:', {
        error,
        filters: newFilters,
        timestamp: new Date().toISOString(),
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [api, filters]);

  /**
   * Função para criar novo ticket
   * Inclui validação robusta e tratamento de erros específicos
   */
  const createTicket = useCallback(async (data: CreateTicketData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validar dados antes de enviar
      const validatedData = validateCreateTicket(data);

      const response = await api.post<ApiResponse<TicketResponse>>('/tickets', validatedData);

      if (response.success && response.data) {
        // Adicionar novo ticket ao início da lista
        setTickets(prev => [response.data!.ticket, ...prev]);
        
        // Limpar cache para garantir dados atualizados
        api.clearCache();
        
        return response.data.ticket;
      } else {
        throw new Error(response.error || 'Erro ao criar ticket');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      console.error('Erro ao criar ticket:', {
        error,
        data,
        timestamp: new Date().toISOString(),
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [api, validateCreateTicket]);

  /**
   * Função para atualizar ticket
   * Implementa validação parcial e otimizações de performance
   */
  const updateTicket = useCallback(async (ticketId: string, data: UpdateTicketData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validar dados de atualização
      const validatedData = validateUpdateTicket(data);

      const response = await api.put<ApiResponse<TicketResponse>>(`/tickets/${ticketId}`, validatedData);

      if (response.success && response.data) {
        // Atualizar ticket na lista local
        setTickets(prev => 
          prev.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, ...response.data!.ticket }
              : ticket
          )
        );
        
        // Limpar cache para garantir dados atualizados
        api.clearCache();
        
        return response.data.ticket;
      } else {
        throw new Error(response.error || 'Erro ao atualizar ticket');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      console.error('Erro ao atualizar ticket:', {
        error,
        ticketId,
        data,
        timestamp: new Date().toISOString(),
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [api, validateUpdateTicket]);

  /**
   * Função para deletar ticket
   * Implementa confirmação e limpeza de cache
   */
  const deleteTicket = useCallback(async (ticketId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.delete<ApiResponse<{ success: boolean }>>(`/tickets/${ticketId}`);

      if (response.success) {
        // Remover ticket da lista local
        setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
        
        // Limpar cache para garantir dados atualizados
        api.clearCache();
        
        return true;
      } else {
        throw new Error(response.error || 'Erro ao deletar ticket');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      console.error('Erro ao deletar ticket:', {
        error,
        ticketId,
        timestamp: new Date().toISOString(),
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  /**
   * Função para buscar ticket específico
   * Implementa cache individual para performance
   */
  const getTicket = useCallback(async (ticketId: string): Promise<Ticket | null> => {
    try {
      const response = await api.get<ApiResponse<TicketResponse>>(`/tickets/${ticketId}`);
      
      if (response.success && response.data) {
        return response.data.ticket;
      } else {
        throw new Error(response.error || 'Ticket não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar ticket:', error);
      return null;
    }
  }, [api]);

  // Carregar tickets iniciais
  useEffect(() => {
    fetchTickets();
  }, []);

  return {
    tickets,
    filters,
    isLoading,
    error,
    fetchTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    getTicket,
    setFilters,
    clearError: () => setError(null),
  };
} 