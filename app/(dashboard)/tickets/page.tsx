'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Filter,
  User,
  Clock,
  Phone,
  Mail,
  Forward,
  Archive,
  Bot,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import {
  Ticket,
  TicketUser,
  TicketResponse,
  TicketStatus,
  TicketPriority,
} from '@/types/ticket';
import { TicketResponseModal } from '@/components/ticket-response-modal';

type TicketCategory = 'Coordenação' | 'Outros';

// Constantes
const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'OPEN', label: 'Abertos' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'RESOLVED', label: 'Resolvidos' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'LOW', label: 'Baixa' },
] as const;

const STATUS_STYLES = {
  OPEN: 'bg-blue-500/20 text-blue-400',
  IN_PROGRESS: 'bg-yellow-600/20 text-yellow-300',
  RESOLVED: 'bg-green-600/20 text-green-300',
} as const;

const PRIORITY_STYLES = {
  HIGH: 'bg-red-500/20 text-red-500',
  MEDIUM: 'bg-orange-500/20 text-orange-500',
  LOW: 'bg-gray-500/20 text-gray-400',
} as const;

// Dados iniciais vazios - serão carregados do banco
const initialTickets: Ticket[] = [];

export default function CoordinatorTicketsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isAdmin = userRole === 'ADMIN';
  const isCoordinator = userRole === 'COORDINATOR';
  const isManager = userRole === 'MANAGER';
  const isUser = userRole === 'USER';
  
  // Permissões ajustadas para permitir que usuários criem seus próprios tickets
  const canCreateTickets = isAdmin || isCoordinator || isManager || isUser;
  const canEditAllTickets = isAdmin || isCoordinator || isManager;
  const canEditOwnTickets = isUser; // Usuários podem editar seus próprios tickets
  const canDeleteTickets = isAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [ticketToForward, setTicketToForward] = useState<string | null>(null);
  const [selectedSupportUser, setSelectedSupportUser] = useState<string>('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [ticketToRespond, setTicketToRespond] = useState<any>(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [supportUsers, setSupportUsers] = useState<any[]>([]);
  const [newTicketForm, setNewTicketForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TicketPriority,
    category: 'Coordenação' as TicketCategory,
    userType: 'existing' as 'existing' | 'new',
    existingUserId: '',
    newUser: {
      name: '',
      email: '',
      phone: '',
      sector: '',
      matricula: '',
    },
  });

  // Carregar tickets do banco de dados
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/tickets');
        if (response.ok) {
          const data = await response.json();
          setTickets(data.tickets || []);
        } else {
          setError('Erro ao carregar tickets');
        }
      } catch (error) {
        console.error('Erro ao buscar tickets:', error);
        setError('Erro ao carregar tickets');
      } finally {
        setIsLoading(false);
      }
    };

    // Carregar usuários para admins/coordenadores
    const fetchUsers = async () => {
      if (!isAdmin && !isCoordinator && !isManager) return;
      
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };

    // Carregar usuários de suporte
    const fetchSupportUsers = async () => {
      if (!isAdmin && !isCoordinator) return;
      
      try {
        const response = await fetch('/api/users/support');
        if (response.ok) {
          const data = await response.json();
          setSupportUsers(data.data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar usuários de suporte:', error);
      }
    };

    if (session?.user) {
      fetchTickets();
      fetchUsers();
      fetchSupportUsers();
    }
  }, [session?.user, isAdmin, isCoordinator, isManager]);

  // Memoização para performance
  const filteredTickets = useMemo(() => {
    let ticketsToFilter = tickets;

    // Se for usuário comum, mostrar apenas seus próprios tickets
    if (isUser && session?.user?.id) {
      ticketsToFilter = tickets.filter(
        ticket => ticket.createdById === session.user.id
      );
    }

    return ticketsToFilter.filter(ticket => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        selectedStatus === 'all' || ticket.status === selectedStatus;
      const matchesPriority =
        selectedPriority === 'all' || ticket.priority === selectedPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [
    tickets,
    searchTerm,
    selectedStatus,
    selectedPriority,
    isUser,
    session?.user?.id,
  ]);

  // Função para verificar se o usuário pode editar um ticket específico
  const canEditTicket = (ticket: Ticket) => {
    if (canEditAllTickets) return true;
    if (canEditOwnTickets && ticket.createdBy?.id === session?.user?.id) return true;
    return false;
  };

  // Função para criar novo chamado
  const handleCreateTicket = async () => {
    if (!newTicketForm.title || !newTicketForm.description) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setIsLoading(true);

      // Para usuários regulares, usar seus próprios dados automaticamente
      if (isUser && session?.user) {
        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: newTicketForm.title,
            description: newTicketForm.description,
            priority: newTicketForm.priority,
            category: newTicketForm.category,
            createdById: session.user.id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setTickets(prev => [data.ticket, ...prev]);
          setShowNewTicketModal(false);
          setNewTicketForm({
            title: '',
            description: '',
            priority: 'MEDIUM',
            category: 'Coordenação',
            userType: 'existing',
            existingUserId: '',
            newUser: {
              name: '',
              email: '',
              phone: '',
              sector: '',
              matricula: '',
            },
          });
          alert('Chamado criado com sucesso!');
        } else {
          alert('Erro ao criar chamado. Tente novamente.');
        }
        return;
      }

      // Lógica para coordenadores e admins (mantém a seleção de usuário)
      const selectedUserId = newTicketForm.existingUserId || session?.user?.id || 'admin';
      
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTicketForm.title,
          description: newTicketForm.description,
          priority: newTicketForm.priority,
          category: newTicketForm.category,
          createdById: selectedUserId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(prev => [data.ticket, ...prev]);
        setShowNewTicketModal(false);
        setNewTicketForm({
          title: '',
          description: '',
          priority: 'MEDIUM',
          category: 'Coordenação',
          userType: 'existing',
          existingUserId: '',
          newUser: {
            name: '',
            email: '',
            phone: '',
            sector: '',
            matricula: '',
          },
        });
        alert('Chamado criado com sucesso!');
      } else {
        alert('Erro ao criar chamado. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      alert('Erro ao criar chamado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para editar ticket
  const handleEditTicket = async (ticket: Ticket) => {
    if (!canEditTicket(ticket)) {
      alert('Você não tem permissão para editar este ticket.');
      return;
    }
    
    try {
      // Implementar modal de edição ou navegar para página de edição
      console.log('Editando ticket:', ticket.id);
      
      // Por enquanto, vamos apenas atualizar o status para IN_PROGRESS
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
        }),
      });

      if (response.ok) {
        // Atualizar o ticket na lista local
        setTickets(prev =>
          prev.map(t =>
            t.id === ticket.id
              ? { ...t, status: 'IN_PROGRESS' as TicketStatus }
              : t
          )
        );
        alert('Ticket atualizado com sucesso!');
      } else {
        alert('Erro ao atualizar ticket.');
      }
    } catch (error) {
      console.error('Erro ao editar ticket:', error);
      alert('Erro ao editar ticket.');
    }
  };

  // Função para arquivar ticket
  const handleArchiveTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'RESOLVED',
        }),
      });

      if (response.ok) {
        setTickets(prev =>
          prev.map(ticket =>
            ticket.id === ticketId
              ? { ...ticket, status: 'RESOLVED' as TicketStatus }
              : ticket
          )
        );
        alert('Ticket arquivado com sucesso!');
      } else {
        alert('Erro ao arquivar ticket.');
      }
    } catch (error) {
      console.error('Erro ao arquivar ticket:', error);
      alert('Erro ao arquivar ticket.');
    }
  };

  // Função para encaminhar ticket
  const handleForwardTicket = async (ticketId: string) => {
    setTicketToForward(ticketId);
    setShowForwardModal(true);
  };

  // Função para confirmar encaminhamento
  const handleConfirmForward = async () => {
    if (!selectedSupportUser) {
      alert('Por favor, selecione um usuário de suporte.');
      return;
    }

    if (!ticketToForward) {
      alert('Erro: Ticket não identificado.');
      return;
    }

    try {
      setIsForwarding(true);
      console.log(`Encaminhando ticket ${ticketToForward} para usuário ${selectedSupportUser}`);
      
      const response = await fetch(`/api/tickets/${ticketToForward}/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedToId: selectedSupportUser,
          status: 'IN_PROGRESS',
        }),
      });

      if (response.ok) {
        alert('Ticket encaminhado com sucesso!');
        // Recarregar tickets para mostrar mudanças
        const ticketsResponse = await fetch('/api/tickets');
        if (ticketsResponse.ok) {
          const data = await ticketsResponse.json();
          setTickets(data.tickets || []);
        }
        // Fechar modal
        setShowForwardModal(false);
        setTicketToForward(null);
        setSelectedSupportUser('');
      } else {
        const errorData = await response.json();
        alert(`Erro ao encaminhar ticket: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao encaminhar ticket:', error);
      alert('Erro ao encaminhar ticket.');
    } finally {
      setIsForwarding(false);
    }
  };

  const handleDeleteTicket = useCallback(async (ticketId: string) => {
    if (!canDeleteTickets) {
      alert('Você não tem permissão para excluir tickets.');
      return;
    }

    if (confirm('Tem certeza que deseja excluir este ticket?')) {
      try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setTickets(prev => prev.filter(t => t.id !== ticketId));
          alert('Ticket excluído com sucesso!');
        } else {
          alert('Erro ao excluir ticket.');
        }
      } catch (error) {
        console.error('Erro ao excluir ticket:', error);
        alert('Erro ao excluir ticket.');
      }
    }
  }, [canDeleteTickets]);

  const handleSendEmail = useCallback((ticket: Ticket) => {
    const subject = encodeURIComponent(`Ticket ${ticket.id}: ${ticket.title}`);
    const body = encodeURIComponent(
      `Olá ${ticket.createdBy?.name},\n\nSeu ticket foi atualizado:\n\nTítulo: ${ticket.title}\nDescrição: ${ticket.description}\nStatus: ${ticket.status}\nPrioridade: ${ticket.priority}\n\nAtenciosamente,\nEquipe de Suporte`
    );
    const mailtoLink = `mailto:${ticket.createdBy?.email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
  }, []);

  const handleSendWhatsApp = useCallback((ticket: Ticket) => {
    const phone = ticket.createdBy?.phone?.replace(/\D/g, '') || ''; // Remove caracteres não numéricos
    if (!phone) {
      alert('Telefone não disponível para este usuário.');
      return;
    }
    const message = encodeURIComponent(
      `Olá ${ticket.createdBy?.name}! Seu ticket ${ticket.id} foi atualizado. Título: ${ticket.title}. Status: ${ticket.status}. Prioridade: ${ticket.priority}.`
    );
    const whatsappLink = `https://wa.me/55${phone}?text=${message}`;
    window.open(whatsappLink, '_blank');
  }, []);

  // Componente para Badge de Status
  const StatusBadge = ({ status }: { status: TicketStatus }) => (
    <Badge className={STATUS_STYLES[status as keyof typeof STATUS_STYLES] || 'bg-gray-500/20 text-gray-400'}>
      {status === 'OPEN'
        ? 'ABERTO'
        : status === 'IN_PROGRESS'
          ? 'EM ANDAMENTO'
          : 'RESOLVIDO'}
    </Badge>
  );

  // Componente para Badge de Prioridade
  const PriorityBadge = ({ priority }: { priority: TicketPriority }) => (
    <Badge className={PRIORITY_STYLES[priority as keyof typeof PRIORITY_STYLES] || 'bg-gray-500/20 text-gray-400'}>
      {priority.toUpperCase()}
    </Badge>
  );

  // REMOVER as funções duplicadas handleArchiveTicket e handleForwardTicket (linhas 184-205)

  const handleAiSuggestion = async () => {
    setShowAiPanel(true);
    setTimeout(() => {
      setAiSuggestion(
        'Com base no problema relatado, sugiro verificar: 1) Se o usuário está usando as credenciais corretas, 2) Se não há bloqueio na conta, 3) Verificar logs do sistema de autenticação.'
      );
    }, 2000);
  };

  // Função para responder ticket (usuários de suporte)
  const handleRespondTicket = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setTicketToRespond(ticket);
      setShowResponseModal(true);
    }
  };

  // Função para enviar resposta
  const handleSendResponse = async (response: string, action: 'respond' | 'return_to_coordination') => {
    if (!ticketToRespond) return;

    try {
      const apiResponse = await fetch(`/api/tickets/${ticketToRespond.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response,
          action,
        }),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        alert(data.message || 'Resposta enviada com sucesso!');
        
        // Recarregar tickets
        const ticketsResponse = await fetch('/api/tickets');
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          setTickets(ticketsData.tickets || []);
        }
        
        // Fechar modal
        setShowResponseModal(false);
        setTicketToRespond(null);
      } else {
        const errorData = await apiResponse.json();
        alert(`Erro ao enviar resposta: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      alert('Erro ao enviar resposta.');
    }
  };

  return (
    <div className="min-h-screen tactical-layout p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wider">
            CENTRAL DE TICKETS
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todos os chamados do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="tactical-button">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          {(isAdmin || isCoordinator || isManager) && (
            <Button
              onClick={() => window.location.href = '/users'}
              className="tactical-button bg-blue-600 hover:bg-blue-700"
            >
              <User className="w-4 h-4 mr-2" />
              Criar Usuário Suporte
            </Button>
          )}
          {canCreateTickets && (
            <Button
              onClick={() => setShowNewTicketModal(true)}
              className="tactical-button bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Chamado
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="tactical-card">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, usuário, matrícula..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 tactical-input"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40 tactical-input">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="tactical-card">
                <SelectItem
                  value="all"
                  className="text-foreground hover:bg-accent"
                >
                  Todos
                </SelectItem>
                <SelectItem
                  value="OPEN"
                  className="text-foreground hover:bg-accent"
                >
                  Abertos
                </SelectItem>
                <SelectItem
                  value="IN_PROGRESS"
                  className="text-foreground hover:bg-accent"
                >
                  Em Andamento
                </SelectItem>
                <SelectItem
                  value="RESOLVED"
                  className="text-foreground hover:bg-accent"
                >
                  Resolvidos
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedPriority}
              onValueChange={setSelectedPriority}
            >
              <SelectTrigger className="w-40 tactical-input">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent className="tactical-card">
                <SelectItem
                  value="all"
                  className="text-foreground hover:bg-accent"
                >
                  Todas
                </SelectItem>
                <SelectItem
                  value="HIGH"
                  className="text-foreground hover:bg-accent"
                >
                  Alta
                </SelectItem>
                <SelectItem
                  value="MEDIUM"
                  className="text-foreground hover:bg-accent"
                >
                  Média
                </SelectItem>
                <SelectItem
                  value="LOW"
                  className="text-foreground hover:bg-accent"
                >
                  Baixa
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTickets.map(ticket => (
          <Card
            key={ticket.id}
            className="tactical-card-hover cursor-pointer"
            onClick={() => setSelectedTicket(ticket)}
          >
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {ticket.title}
                    </h3>
                    <Badge className="bg-muted/20 text-muted-foreground text-xs font-mono">
                      {ticket.id}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {ticket.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge
                      className={`${
                        ticket.status === 'OPEN'
                          ? 'btn-status-open'
                          : ticket.status === 'IN_PROGRESS'
                            ? 'btn-status-progress'
                            : 'btn-status-resolved'
                      }`}
                    >
                      {ticket.status === 'OPEN'
                        ? 'ABERTO'
                        : ticket.status === 'IN_PROGRESS'
                          ? 'EM ANDAMENTO'
                          : 'RESOLVIDO'}
                    </Badge>
                    <Badge
                      className={`${
                        ticket.priority === 'HIGH'
                          ? 'badge-danger'
                          : ticket.priority === 'MEDIUM'
                            ? 'badge-warning'
                            : 'badge-secondary'
                      }`}
                    >
                      {ticket.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {ticket.createdBy?.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ticket.createdAt instanceof Date 
                        ? ticket.createdAt.toLocaleDateString('pt-BR')
                        : ticket.createdAt}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* Botão de Editar para usuários */}
                  {canEditTicket(ticket) && (
                    <Button
                      onClick={e => {
                        e.stopPropagation();
                        handleEditTicket(ticket);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      {isUser ? 'Editar' : 'Editar'}
                    </Button>
                  )}
                  
                  {/* Botão de Arquivar */}
                  {(canEditAllTickets ||
                    (isUser && ticket.createdBy?.id === session?.user?.id)) && (
                    <Button
                      onClick={e => {
                        e.stopPropagation();
                        handleArchiveTicket(ticket.id);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Archive className="w-4 h-4 mr-1" />
                      Arquivar
                    </Button>
                  )}
                  
                  {/* Botão de Encaminhar apenas para admins/coordinators */}
                  {canEditAllTickets && (
                    <Button
                      onClick={e => {
                        e.stopPropagation();
                        handleForwardTicket(ticket.id);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Forward className="w-4 h-4 mr-1" />
                      Encaminhar
                    </Button>
                  )}

                  {/* Botão de Responder para usuários de suporte */}
                  {session?.user?.role === 'USER' && ticket.assignedToId === session.user.id && (
                    <Button
                      onClick={e => {
                        e.stopPropagation();
                        handleRespondTicket(ticket.id);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Responder
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900 border-neutral-700">
            <CardHeader className="border-b border-neutral-700">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold text-white">
                    {selectedTicket.title}
                  </CardTitle>
                  <p className="text-sm text-neutral-400 mt-1">
                    {selectedTicket.id}
                  </p>
                </div>
                <Button
                  onClick={() => setSelectedTicket(null)}
                  variant="ghost"
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Sidebar */}
                <div className="space-y-6">
                  {/* User Info */}
                  <Card className="bg-slate-800 border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                        INFORMAÇÕES DO USUÁRIO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-neutral-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {selectedTicket.createdBy?.name}
                          </p>
                          <p className="text-xs text-neutral-400">
                            Mat: {selectedTicket.createdBy?.matricula || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">E-mail:</span>
                          <span className="text-white">
                            {selectedTicket.createdBy?.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Telefone:</span>
                          <span className="text-white">
                            {selectedTicket.createdBy?.phone || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Setor:</span>
                          <span className="text-white">
                            {selectedTicket.createdBy?.sector || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Admissão:</span>
                          <span className="text-white">
                            {selectedTicket.createdBy?.admissionDate || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Suggestion Panel */}
                  <Card className="bg-slate-800 border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        SUGESTÃO IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={handleAiSuggestion}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={showAiPanel}
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        {showAiPanel ? 'Gerando...' : 'Gerar Sugestão'}
                      </Button>
                      {showAiPanel && (
                        <div className="p-3 bg-slate-900 border border-neutral-600 rounded text-xs text-neutral-300">
                          {aiSuggestion || 'Analisando ticket...'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Ticket Details */}
                  <Card className="bg-slate-800 border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                        DETALHES DO CHAMADO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-neutral-400">
                            STATUS
                          </span>
                          <div className="mt-1">
                            <Badge
                              className={`${
                                selectedTicket.status === 'OPEN'
                                  ? 'bg-orange-500/20 text-orange-500'
                                  : selectedTicket.status === 'IN_PROGRESS'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-white/20 text-white'
                              }`}
                            >
                              {selectedTicket.status === 'OPEN'
                                ? 'ABERTO'
                                : selectedTicket.status === 'IN_PROGRESS'
                                  ? 'EM ANDAMENTO'
                                  : 'RESOLVIDO'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-neutral-400">
                            PRIORIDADE
                          </span>
                          <div className="mt-1">
                            <Badge
                              className={`${
                                selectedTicket.priority === 'HIGH'
                                  ? 'bg-red-500/20 text-red-500'
                                  : selectedTicket.priority === 'MEDIUM'
                                    ? 'bg-orange-500/20 text-orange-500'
                                    : 'bg-white/20 text-white'
                              }`}
                            >
                              {selectedTicket.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-400">
                          DESCRIÇÃO
                        </span>
                        <p className="text-sm text-white mt-1 p-3 bg-slate-900 border border-neutral-600 rounded">
                          {selectedTicket.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Response Section */}
                  <Card className="bg-slate-800 border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                        RESPOSTA / ENCAMINHAMENTO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Digite sua resposta..."
                        className="bg-slate-900 border-neutral-600 text-white min-h-[100px]"
                        defaultValue={aiSuggestion}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() => handleSendEmail(selectedTicket)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar por E-mail
                        </Button>
                        <Button
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() => handleSendWhatsApp(selectedTicket)}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Enviar por WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          className="border-neutral-700 text-neutral-400 hover:bg-slate-800"
                          onClick={() =>
                            handleForwardTicket(
                              selectedTicket.id
                            )
                          }
                        >
                          <Forward className="w-4 h-4 mr-2" />
                          Encaminhar
                        </Button>
                        <Button
                          variant="outline"
                          className="border-neutral-700 text-neutral-400 hover:bg-slate-800"
                          onClick={() => handleArchiveTicket(selectedTicket.id)}
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Arquivar
                        </Button>
                        <Button
                          variant="outline"
                          className="border-blue-700 text-blue-400 hover:bg-blue-800"
                          onClick={() => handleEditTicket(selectedTicket)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-700 text-red-400 hover:bg-red-800"
                          onClick={() => handleDeleteTicket(selectedTicket.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Novo Chamado */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Novo Chamado</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewTicketModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                {/* Informações do Chamado */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Informações do Chamado
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Título
                    </label>
                    <Input
                      value={newTicketForm.title}
                      onChange={e =>
                        setNewTicketForm(prev => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Descreva brevemente o problema"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Descrição
                    </label>
                    <Textarea
                      value={newTicketForm.description}
                      onChange={e =>
                        setNewTicketForm(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Descreva detalhadamente o problema"
                      className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Prioridade
                      </label>
                      <Select
                        value={newTicketForm.priority}
                        onValueChange={(value: TicketPriority) =>
                          setNewTicketForm(prev => ({
                            ...prev,
                            priority: value,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HIGH">Alta</SelectItem>
                          <SelectItem value="MEDIUM">Média</SelectItem>
                          <SelectItem value="LOW">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Categoria
                      </label>
                      <Select
                        value={newTicketForm.category}
                        onValueChange={(value: TicketCategory) =>
                          setNewTicketForm(prev => ({
                            ...prev,
                            category: value,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Coordenação">Coordenação</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Seleção de Usuário - apenas para admins/coordinators */}
                {!isUser && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Usuário</h3>

                    <div className="flex gap-4">
                      <Button
                        variant={
                          newTicketForm.userType === 'existing'
                            ? 'default'
                            : 'outline'
                        }
                        onClick={() =>
                          setNewTicketForm(prev => ({
                            ...prev,
                            userType: 'existing',
                          }))
                        }
                        className={
                          newTicketForm.userType === 'existing'
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'border-slate-600 text-gray-300'
                        }
                      >
                        Usuário Existente
                      </Button>
                      <Button
                        variant={
                          newTicketForm.userType === 'new' ? 'default' : 'outline'
                        }
                        onClick={() =>
                          setNewTicketForm(prev => ({ ...prev, userType: 'new' }))
                        }
                        className={
                          newTicketForm.userType === 'new'
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'border-slate-600 text-gray-300'
                        }
                      >
                        Novo Usuário
                      </Button>
                    </div>

                    {newTicketForm.userType === 'existing' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Selecionar Usuário
                        </label>
                        <Select
                          value={newTicketForm.existingUserId}
                          onValueChange={value =>
                            setNewTicketForm(prev => ({
                              ...prev,
                              existingUserId: value,
                            }))
                          }
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Selecione um usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem
                                key={user.id}
                                value={user.id}
                              >
                                {user.name} - {user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Nome Completo
                            </label>
                            <Input
                              value={newTicketForm.newUser.name}
                              onChange={e =>
                                setNewTicketForm(prev => ({
                                  ...prev,
                                  newUser: {
                                    ...prev.newUser,
                                    name: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Nome do usuário"
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Matrícula
                            </label>
                            <Input
                              value={newTicketForm.newUser.matricula}
                              onChange={e =>
                                setNewTicketForm(prev => ({
                                  ...prev,
                                  newUser: {
                                    ...prev.newUser,
                                    matricula: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Matrícula do usuário"
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Email
                            </label>
                            <Input
                              type="email"
                              value={newTicketForm.newUser.email}
                              onChange={e =>
                                setNewTicketForm(prev => ({
                                  ...prev,
                                  newUser: {
                                    ...prev.newUser,
                                    email: e.target.value,
                                  },
                                }))
                              }
                              placeholder="email@empresa.com"
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Telefone
                            </label>
                            <Input
                              value={newTicketForm.newUser.phone}
                              onChange={e =>
                                setNewTicketForm(prev => ({
                                  ...prev,
                                  newUser: {
                                    ...prev.newUser,
                                    phone: e.target.value,
                                  },
                                }))
                              }
                              placeholder="(11) 99999-9999"
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Setor
                          </label>
                          <Input
                            value={newTicketForm.newUser.sector}
                            onChange={e =>
                              setNewTicketForm(prev => ({
                                ...prev,
                                newUser: {
                                  ...prev.newUser,
                                  sector: e.target.value,
                                },
                              }))
                            }
                            placeholder="Setor do usuário"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Informação para usuários */}
                {isUser && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Informações do Usuário</h3>
                    <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
                      <p className="text-sm text-gray-300">
                        <strong>Nome:</strong> {session?.user?.name || 'Usuário'}
                      </p>
                      <p className="text-sm text-gray-300">
                        <strong>Email:</strong> {session?.user?.email || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-300">
                        <strong>Matrícula:</strong> N/A
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        O chamado será criado com suas informações automaticamente.
                      </p>
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => setShowNewTicketModal(false)}
                    variant="outline"
                    className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateTicket}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    Criar Chamado
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Encaminhamento */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-800 border border-white/20 rounded-lg p-6">
            <CardHeader className="border-b border-neutral-700 pb-4">
              <CardTitle className="text-lg font-bold text-white">
                Encaminhar Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-neutral-400">
                Selecione o usuário de suporte para encaminhar este ticket.
              </p>
              <Select
                value={selectedSupportUser}
                onValueChange={setSelectedSupportUser}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione um usuário de suporte" />
                </SelectTrigger>
                <SelectContent>
                  {supportUsers.map(user => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                    >
                      {user.name} - {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  onClick={() => setShowForwardModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmForward}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isForwarding}
                >
                  {isForwarding ? 'Encaminhando...' : 'Encaminhar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Resposta */}
      {showResponseModal && ticketToRespond && (
        <TicketResponseModal
          ticket={ticketToRespond}
          onClose={() => {
            setShowResponseModal(false);
            setTicketToRespond(null);
          }}
          onResponse={(response, action) => handleSendResponse(response, action)}
        />
      )}
    </div>
  );
}
