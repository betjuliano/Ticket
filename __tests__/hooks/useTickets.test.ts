import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '@/data/mockTickets';
import { toast } from '@/components/ui/use-toast';

import { renderHook, act } from '@testing-library/react';
import { useTickets } from '@/lib/hooks/useTickets';
import { mockTickets } from '@/data/mockTickets';

// Mock fetch
global.fetch = jest.fn();

export function useTickets(): UseTicketsReturn {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tickets');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar tickets');
      }

      setTickets(data.data);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTicket = useCallback(
    async (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => {
      setIsLoading(true);

      try {
        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ticketData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao criar ticket');
        }

        setTickets(prev => [data.data, ...prev]);

        toast({
          title: 'Sucesso',
          description: 'Ticket criado com sucesso',
        });
      } catch (err: any) {
        toast({
          title: 'Erro',
          description: err.message,
          variant: 'destructive',
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateTicket = useCallback(
    async (id: string, updates: Partial<Ticket>) => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/tickets/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao atualizar ticket');
        }

        setTickets(prev =>
          prev.map(ticket =>
            ticket.id === id ? { ...ticket, ...data.data } : ticket
          )
        );

        toast({
          title: 'Sucesso',
          description: 'Ticket atualizado com sucesso',
        });
      } catch (err: any) {
        toast({
          title: 'Erro',
          description: err.message,
          variant: 'destructive',
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTicket = useCallback(async (id: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir ticket');
      }

      setTickets(prev => prev.filter(ticket => ticket.id !== id));

      toast({
        title: 'Sucesso',
        description: 'Ticket excluído com sucesso',
      });
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const archiveTicket = useCallback(
    async (id: string) => {
      await updateTicket(id, { status: 'closed' });
    },
    [updateTicket]
  );

  const forwardTicket = useCallback(
    async (id: string, assignedTo: string) => {
      await updateTicket(id, { assignedTo, status: 'in_progress' });
    },
    [updateTicket]
  );

  useEffect(() => {
    fetchTickets();
  }, []);

  return {
    tickets,
    isLoading,
    error,
    createTicket,
    updateTicket,
    deleteTicket,
    archiveTicket,
    forwardTicket,
    refreshTickets: fetchTickets,
  };
}

describe('useTickets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve carregar tickets na inicialização', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockTickets }),
    });

    const { result } = renderHook(() => useTickets());

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.tickets).toEqual(mockTickets);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('deve criar um novo ticket', async () => {
    const newTicket = mockTickets[0](fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTickets }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: newTicket }),
      });

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.createTicket({
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category,
        createdBy: newTicket.createdBy,
        status: newTicket.status,
        user: newTicket.user,
      });
    });

    expect(fetch).toHaveBeenCalledWith('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category,
        createdBy: newTicket.createdBy,
        status: newTicket.status,
        user: newTicket.user,
      }),
    });
  });
});
