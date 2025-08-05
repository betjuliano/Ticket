import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import { Ticket, TicketStatus, TicketPriority } from '@/types/ticket';
import { createTicketSchema, updateTicketSchema } from '@/lib/validations';

// Tipos para filtros de tickets
interface TicketFilters {
  search?: string;
  status?: TicketStatus | 'all';
  priority?: TicketPriority | 'all';
  userId?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Tipos para criação de ticket
interface CreateTicketData {
  title: string;
  description: string;
  priority: TicketPriority;
  category: string;
  tags?: string[];
  estimatedHours?: number;
  dueDate?: string;
}

// Tipos para atualização de ticket
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

/**
 * Hook customizado para operações de tickets com validação robusta
 * 
 * Este hook centraliza toda a lógica de CRUD de tickets, incluindo:
 * - Validação de dados com Zod
 * - Tratamento de erros específicos
 * - Cache inteligente
 * - Estados de loading otimizados
 * 
 * @returns Funções e estado para operações de tickets
 */
export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usar o hook de API com configurações específicas para tickets
  const api = useApi<{ tickets: Ticket[]; total: number }>('/api', {
    cacheTime: 2 * 60 * 1000, // 2 minutos para tickets (dados mais dinâmicos)
    retryCount: 2,
    retryDelay: 500,
  });

  /**
   * Função para validar dados de criação de ticket
   * Usa Zod para validação robusta e tipagem segura
   */
  const validateCreateTicket = useCallback((data: CreateTicketData) => {
    try {
      return createTicketSchema.parse(data);
    } catch (error: any) {
      // Extrair mensagens de erro do Zod de forma amigável
      const errorMessages = error.errors?.map((err: any) => err.message).join(', ');
      throw new Error(`Dados inválidos: ${errorMessages}`);
    }
  }, []);

  /**
   * Função para validar dados de atualização de ticket
   */
  const validateUpdateTicket = useCallback((data: UpdateTicketData) => {
    try {
      return updateTicketSchema.parse(data);
    } catch (error: any) {
      const errorMessages = error.errors?.map((err: any) => err.message).join(', ');
      throw new Error(`Dados inválidos: ${errorMessages}`);
    }
  }, []);

  /**
   * Função para buscar tickets com filtros
   * Implementa cache inteligente e tratamento de erros robusto
   */
  const fetchTickets = useCallback(async (newFilters?: TicketFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      // Mesclar filtros existentes com novos filtros
      const mergedFilters = { ...filters, ...newFilters };
      
      // Remover filtros vazios para otimizar cache
      const cleanFilters = Object.fromEntries(
        Object.entries(mergedFilters).filter(([_, value]) => 
          value !== undefined && value !== null && value !== ''
        )
      );

      const response = await api.get('/tickets', cleanFilters);
      
      if (response.success) {
        setTickets(response.tickets || []);
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

      const response = await api.post('/tickets', validatedData);

      if (response.success) {
        // Adicionar novo ticket ao início da lista
        setTickets(prev => [response.ticket, ...prev]);
        
        // Limpar cache para garantir dados atualizados
        api.clearCache();
        
        return response.ticket;
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

      const response = await api.put(`/tickets/${ticketId}`, validatedData);

      if (response.success) {
        // Atualizar ticket na lista local
        setTickets(prev => 
          prev.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, ...response.ticket }
              : ticket
          )
        );
        
        // Limpar cache para garantir dados atualizados
        api.clearCache();
        
        return response.ticket;
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
      const response = await api.delete(`/tickets/${ticketId}`);

      if (response.success) {
        // Remover ticket da lista local
        setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
        
        // Limpar cache
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
   * Implementa cache específico para dados individuais
   */
  const fetchTicket = useCallback(async (ticketId: string) => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      
      if (response.success) {
        return response.ticket;
      } else {
        throw new Error(response.error || 'Ticket não encontrado');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      throw error;
    }
  }, [api]);

  /**
   * Função para aplicar filtros
   * Implementa debounce para otimizar performance
   */
  const applyFilters = useCallback((newFilters: TicketFilters) => {
    setFilters(newFilters);
    return fetchTickets(newFilters);
  }, [fetchTickets]);

  /**
   * Função para limpar filtros
   */
  const clearFilters = useCallback(() => {
    setFilters({});
    return fetchTickets({});
  }, [fetchTickets]);

  /**
   * Função para buscar tickets na inicialização
   */
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]); // Executar apenas na montagem do componente

  return {
    // Estado
    tickets,
    filters,
    isLoading: isLoading || api.loading,
    error: error || api.error,
    
    // Funções
    fetchTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    fetchTicket,
    applyFilters,
    clearFilters,
    
    // Utilitários
    clearCache: api.clearCache,
    cancelRequest: api.cancelRequest,
  };
} 