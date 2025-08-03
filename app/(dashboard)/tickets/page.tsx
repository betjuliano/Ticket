'use client';

import { useState, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import {
  Ticket,
  TicketUser,
  TicketResponse,
  TicketStatus,
  TicketPriority,
} from '@/types/ticket';

type TicketCategory = 'Sistema' | 'Rede' | 'Hardware' | 'Software';

// Constantes
const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Abertos' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'resolved', label: 'Resolvidos' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
] as const;

const STATUS_STYLES = {
  open: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-yellow-600/20 text-yellow-300',
  resolved: 'bg-green-600/20 text-green-300',
} as const;

const PRIORITY_STYLES = {
  high: 'bg-red-500/20 text-red-500',
  medium: 'bg-orange-500/20 text-orange-500',
  low: 'bg-gray-500/20 text-gray-400',
} as const;

// Dados iniciais de exemplo
const initialTickets: Ticket[] = [
  {
    id: 'TKT-001',
    title: 'Sistema de login não funciona',
    description: 'Usuários não conseguem fazer login no sistema',
    status: 'open',
    priority: 'high',
    category: 'Sistema',
    createdBy: '12345',
    createdAt: '2025-01-20 10:00',
    updatedAt: '2025-01-20 10:00',
    user: {
      name: 'João Silva',
      matricula: '12345',
      email: 'joao.silva@empresa.com',
      phone: '(11) 99999-9999',
      admissionDate: '2023-01-15',
      sector: 'TI',
    },
    responses: [],
  },
  {
    id: 'TKT-002',
    title: 'Lentidão na rede',
    description: 'Rede corporativa está muito lenta',
    status: 'in_progress',
    priority: 'medium',
    category: 'Rede',
    createdBy: '67890',
    createdAt: '2025-01-19 14:30',
    updatedAt: '2025-01-20 09:15',
    user: {
      name: 'Maria Santos',
      matricula: '67890',
      email: 'maria.santos@empresa.com',
      phone: '(11) 88888-8888',
      admissionDate: '2022-05-10',
      sector: 'Financeiro',
    },
    responses: [],
  },
];

export default function CoordinatorTicketsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isAdmin = userRole === 'ADMIN';
  const isCoordinator = userRole === 'COORDINATOR';
  const isUser = userRole === 'USER';
  const canCreateTickets = isAdmin || isCoordinator;
  const canEditAllTickets = isAdmin || isCoordinator;
  const canDeleteTickets = isAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as TicketPriority,
    category: 'Sistema' as TicketCategory,
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

  // Memoização para performance
  const filteredTickets = useMemo(() => {
    let ticketsToFilter = tickets;

    // Se for usuário comum, mostrar apenas seus próprios tickets
    if (isUser && session?.user?.id) {
      ticketsToFilter = tickets.filter(
        ticket => ticket.createdBy === session.user.id
      );
    }

    return ticketsToFilter.filter(ticket => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Função para criar novo chamado
  const handleCreateTicket = () => {
    if (!newTicketForm.title || !newTicketForm.description) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (newTicketForm.userType === 'new') {
      if (
        !newTicketForm.newUser.name ||
        !newTicketForm.newUser.email ||
        !newTicketForm.newUser.matricula
      ) {
        alert('Por favor, preencha todos os dados do novo usuário.');
        return;
      }
    } else if (!newTicketForm.existingUserId) {
      alert('Por favor, selecione um usuário existente.');
      return;
    }

    const newTicketId = `TKT-${String(tickets.length + 1).padStart(3, '0')}`;
    const currentDate = new Date().toLocaleString('pt-BR');

    let ticketUser: TicketUser;

    if (newTicketForm.userType === 'new') {
      // Criar novo usuário
      ticketUser = {
        name: newTicketForm.newUser.name,
        matricula: newTicketForm.newUser.matricula,
        email: newTicketForm.newUser.email,
        phone: newTicketForm.newUser.phone,
        sector: newTicketForm.newUser.sector,
        admissionDate: currentDate.split(' ')[0],
      };

      // Simular envio de email de recuperação de senha
      console.log(`Email de recuperação enviado para: ${ticketUser.email}`);
      alert(
        `Novo usuário criado! Email de configuração de senha enviado para ${ticketUser.email}`
      );
    } else {
      // Usar usuário existente
      const existingTicket = tickets.find(
        t => t.user.matricula === newTicketForm.existingUserId
      );
      if (!existingTicket) {
        alert('Usuário não encontrado.');
        return;
      }
      ticketUser = existingTicket.user;
    }

    const newTicket: Ticket = {
      id: newTicketId,
      title: newTicketForm.title,
      description: newTicketForm.description,
      status: 'open',
      priority: newTicketForm.priority,
      category: newTicketForm.category,
      createdBy: ticketUser.matricula,
      createdAt: currentDate,
      updatedAt: currentDate,
      user: ticketUser,
      responses: [],
    };

    setTickets(prev => [newTicket, ...prev]);

    // Resetar formulário
    setNewTicketForm({
      title: '',
      description: '',
      priority: 'medium',
      category: 'Sistema',
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

    setShowNewTicketModal(false);
    alert('Chamado criado com sucesso!');
  };

  // Funções otimizadas com useCallback (manter apenas esta versão)
  const handleArchiveTicket = useCallback(async (ticketId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });

      if (!response.ok) {
        throw new Error('Falha ao arquivar ticket');
      }

      setTickets(prev =>
        prev.map(t =>
          t.id === ticketId ? { ...t, status: 'resolved' as TicketStatus } : t
        )
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleForwardTicket = useCallback(
    async (ticketId: string, assignedTo: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedTo }),
        });

        if (!response.ok) {
          throw new Error('Falha ao encaminhar ticket');
        }

        alert('Ticket encaminhado com sucesso!');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleEditTicket = useCallback((ticketId: string) => {
    // Implementar modal de edição ou redirecionamento
    alert(
      `Funcionalidade de edição será implementada para o ticket: ${ticketId}`
    );
  }, []);

  const handleDeleteTicket = useCallback(async (ticketId: string) => {
    if (!confirm('Tem certeza que deseja excluir este ticket?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir ticket');
      }

      setTickets(prev => prev.filter(t => t.id !== ticketId));
      setSelectedTicket(null);
      alert('Ticket excluído com sucesso!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSendEmail = useCallback((ticket: Ticket) => {
    const subject = encodeURIComponent(`Ticket ${ticket.id}: ${ticket.title}`);
    const body = encodeURIComponent(
      `Olá ${ticket.user.name},\n\nSeu ticket foi atualizado:\n\nTítulo: ${ticket.title}\nDescrição: ${ticket.description}\nStatus: ${ticket.status}\nPrioridade: ${ticket.priority}\n\nAtenciosamente,\nEquipe de Suporte`
    );
    const mailtoLink = `mailto:${ticket.user.email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
  }, []);

  const handleSendWhatsApp = useCallback((ticket: Ticket) => {
    const phone = ticket.user.phone.replace(/\D/g, ''); // Remove caracteres não numéricos
    const message = encodeURIComponent(
      `Olá ${ticket.user.name}! Seu ticket ${ticket.id} foi atualizado. Título: ${ticket.title}. Status: ${ticket.status}. Prioridade: ${ticket.priority}.`
    );
    const whatsappLink = `https://wa.me/55${phone}?text=${message}`;
    window.open(whatsappLink, '_blank');
  }, []);

  // Componente para Badge de Status
  const StatusBadge = ({ status }: { status: TicketStatus }) => (
    <Badge className={STATUS_STYLES[status]}>
      {status === 'open'
        ? 'ABERTO'
        : status === 'in_progress'
          ? 'EM ANDAMENTO'
          : 'RESOLVIDO'}
    </Badge>
  );

  // Componente para Badge de Prioridade
  const PriorityBadge = ({ priority }: { priority: TicketPriority }) => (
    <Badge className={PRIORITY_STYLES[priority]}>
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
                  value="open"
                  className="text-foreground hover:bg-accent"
                >
                  Abertos
                </SelectItem>
                <SelectItem
                  value="in_progress"
                  className="text-foreground hover:bg-accent"
                >
                  Em Andamento
                </SelectItem>
                <SelectItem
                  value="resolved"
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
                  value="high"
                  className="text-foreground hover:bg-accent"
                >
                  Alta
                </SelectItem>
                <SelectItem
                  value="medium"
                  className="text-foreground hover:bg-accent"
                >
                  Média
                </SelectItem>
                <SelectItem
                  value="low"
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
                        ticket.status === 'open'
                          ? 'btn-status-open'
                          : ticket.status === 'in_progress'
                            ? 'btn-status-progress'
                            : 'btn-status-resolved'
                      }`}
                    >
                      {ticket.status === 'open'
                        ? 'ABERTO'
                        : ticket.status === 'in_progress'
                          ? 'EM ANDAMENTO'
                          : 'RESOLVIDO'}
                    </Badge>
                    <Badge
                      className={`${
                        ticket.priority === 'high'
                          ? 'badge-danger'
                          : ticket.priority === 'medium'
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
                      {ticket.user.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ticket.createdAt}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(canEditAllTickets ||
                    (isUser && ticket.createdBy === session?.user?.id)) && (
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
                  {canEditAllTickets && (
                    <Button
                      onClick={e => {
                        e.stopPropagation();
                        handleForwardTicket(ticket.id, 'coordinator-id');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Forward className="w-4 h-4 mr-1" />
                      Encaminhar
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
                            {selectedTicket.user.name}
                          </p>
                          <p className="text-xs text-neutral-400">
                            Mat: {selectedTicket.user.matricula}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">E-mail:</span>
                          <span className="text-white">
                            {selectedTicket.user.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Telefone:</span>
                          <span className="text-white">
                            {selectedTicket.user.phone}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Setor:</span>
                          <span className="text-white">
                            {selectedTicket.user.sector}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Admissão:</span>
                          <span className="text-white">
                            {selectedTicket.user.admissionDate}
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
                                selectedTicket.status === 'open'
                                  ? 'bg-orange-500/20 text-orange-500'
                                  : selectedTicket.status === 'in_progress'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-white/20 text-white'
                              }`}
                            >
                              {selectedTicket.status === 'open'
                                ? 'ABERTO'
                                : selectedTicket.status === 'in_progress'
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
                                selectedTicket.priority === 'high'
                                  ? 'bg-red-500/20 text-red-500'
                                  : selectedTicket.priority === 'medium'
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
                              selectedTicket.id,
                              'coordinator-id'
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
                          onClick={() => handleEditTicket(selectedTicket.id)}
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
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="low">Baixa</SelectItem>
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
                          <SelectItem value="Sistema">Sistema</SelectItem>
                          <SelectItem value="Rede">Rede</SelectItem>
                          <SelectItem value="Hardware">Hardware</SelectItem>
                          <SelectItem value="Software">Software</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Seleção de Usuário */}
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
                          {initialTickets.map(ticket => (
                            <SelectItem
                              key={ticket.user.matricula}
                              value={ticket.user.matricula}
                            >
                              {ticket.user.name} - {ticket.user.matricula}
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
    </div>
  );
}
