'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  Filter, 
  User, 
  Clock, 
  Phone, 
  Mail, 
  Forward,
  Archive,
  Bot
} from 'lucide-react'

// Tipos mais específicos
type TicketStatus = 'open' | 'in_progress' | 'resolved'
type TicketPriority = 'high' | 'medium' | 'low'
type TicketCategory = 'Sistema' | 'Rede' | 'Hardware' | 'Software'

interface TicketUser {
  name: string
  matricula: string
  email: string
  phone: string
  admissionDate: string
  sector: string
}

interface TicketResponse {
  author: string
  message: string
  timestamp: string
  type: string
}

interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  created: string
  lastUpdate: string
  user: TicketUser
  responses: TicketResponse[]
}

// Constantes
const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Abertos' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'resolved', label: 'Resolvidos' }
] as const

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' }
] as const

const STATUS_STYLES = {
  open: 'bg-blue-600/20 text-blue-300',
  in_progress: 'bg-yellow-600/20 text-yellow-300',
  resolved: 'bg-green-600/20 text-green-300'
} as const

const PRIORITY_STYLES = {
  high: 'bg-red-500/20 text-red-500',
  medium: 'bg-orange-500/20 text-orange-500',
  low: 'bg-gray-500/20 text-gray-400'
} as const

// Dados iniciais de exemplo
const initialTickets: Ticket[] = [
  {
    id: "TKT-001",
    title: "Sistema de login não funciona",
    description: "Usuários não conseguem fazer login no sistema",
    status: "open",
    priority: "high",
    category: "Sistema",
    created: "2025-01-20 10:00",
    lastUpdate: "2025-01-20 10:00",
    user: {
      name: "João Silva",
      matricula: "12345",
      email: "joao.silva@empresa.com",
      phone: "(11) 99999-9999",
      admissionDate: "2023-01-15",
      sector: "TI"
    },
    responses: []
  },
  {
    id: "TKT-002",
    title: "Lentidão na rede",
    description: "Rede corporativa está muito lenta",
    status: "in_progress",
    priority: "medium",
    category: "Rede",
    created: "2025-01-19 14:30",
    lastUpdate: "2025-01-20 09:15",
    user: {
      name: "Maria Santos",
      matricula: "67890",
      email: "maria.santos@empresa.com",
      phone: "(11) 88888-8888",
      admissionDate: "2022-05-10",
      sector: "Financeiro"
    },
    responses: []
  }
];

// REMOVER a primeira declaração export default e manter apenas uma
export default function CoordinatorTicketsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Memoização para performance
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus
      const matchesPriority = selectedPriority === 'all' || ticket.priority === selectedPriority
      
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, searchTerm, selectedStatus, selectedPriority])

  // Funções otimizadas com useCallback (manter apenas esta versão)
  const handleArchiveTicket = useCallback(async (ticketId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      })
      
      if (!response.ok) {
        throw new Error('Falha ao arquivar ticket')
      }
      
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, status: 'resolved' as TicketStatus } : t
      ))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleForwardTicket = useCallback(async (ticketId: string, assignedTo: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo })
      })
      
      if (!response.ok) {
        throw new Error('Falha ao encaminhar ticket')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Componente para Badge de Status
  const StatusBadge = ({ status }: { status: TicketStatus }) => (
    <Badge className={STATUS_STYLES[status]}>
      {status === 'open' ? 'ABERTO' : status === 'in_progress' ? 'EM ANDAMENTO' : 'RESOLVIDO'}
    </Badge>
  )

  // Componente para Badge de Prioridade
  const PriorityBadge = ({ priority }: { priority: TicketPriority }) => (
    <Badge className={PRIORITY_STYLES[priority]}>
      {priority.toUpperCase()}
    </Badge>
  )

  // REMOVER as funções duplicadas handleArchiveTicket e handleForwardTicket (linhas 184-205)

  const handleAiSuggestion = async () => {
    setShowAiPanel(true)
    setTimeout(() => {
      setAiSuggestion(
        "Com base no problema relatado, sugiro verificar: 1) Se o usuário está usando as credenciais corretas, 2) Se não há bloqueio na conta, 3) Verificar logs do sistema de autenticação.",
      )
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">CENTRAL DE TICKETS</h1>
          <p className="text-sm text-blue-200">Gerencie todos os chamados do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
              <Input
                placeholder="Buscar por título, usuário, matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                <SelectItem value="open" className="text-white hover:bg-slate-700">Abertos</SelectItem>
                <SelectItem value="in_progress" className="text-white hover:bg-slate-700">Em Andamento</SelectItem>
                <SelectItem value="resolved" className="text-white hover:bg-slate-700">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all" className="text-white hover:bg-slate-700">Todas</SelectItem>
                <SelectItem value="high" className="text-white hover:bg-slate-700">Alta</SelectItem>
                <SelectItem value="medium" className="text-white hover:bg-slate-700">Média</SelectItem>
                <SelectItem value="low" className="text-white hover:bg-slate-700">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="bg-white/10 backdrop-blur-lg border-white/20 hover:border-blue-400/50 transition-colors cursor-pointer"
            onClick={() => setSelectedTicket(ticket)}
          >
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold text-white">{ticket.title}</h3>
                    <Badge className="bg-white/20 text-blue-200 text-xs font-mono">{ticket.id}</Badge>
                  </div>
                  <p className="text-sm text-blue-200 mb-2">{ticket.description}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge
                      className={`${
                        ticket.status === "open"
                          ? "bg-blue-600/20 text-blue-300"
                          : ticket.status === "in_progress"
                            ? "bg-white/20 text-white"
                            : "bg-white/20 text-white"
                      }`}
                    >
                      {ticket.status === "open"
                        ? "ABERTO"
                        : ticket.status === "in_progress"
                          ? "EM ANDAMENTO"
                          : "RESOLVIDO"}
                    </Badge>
                    <Badge
                      className={`${
                        ticket.priority === "high"
                          ? "bg-red-500/20 text-red-500"
                          : ticket.priority === "medium"
                            ? "bg-orange-500/20 text-orange-500"
                            : "bg-white/20 text-white"
                      }`}
                    >
                      {ticket.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-blue-300">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {ticket.user.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ticket.created}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleArchiveTicket(ticket.id)
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <Archive className="w-4 h-4 mr-1" />
                    Arquivar
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleForwardTicket(ticket.id, 'coordinator-id')
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Forward className="w-4 h-4 mr-1" />
                    Encaminhar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-700">
            <CardHeader className="border-b border-neutral-700">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold text-white">{selectedTicket.title}</CardTitle>
                  <p className="text-sm text-neutral-400 mt-1">{selectedTicket.id}</p>
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
                  <Card className="bg-neutral-800 border-neutral-700">
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
                          <p className="text-sm font-medium text-white">{selectedTicket.user.name}</p>
                          <p className="text-xs text-neutral-400">Mat: {selectedTicket.user.matricula}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">E-mail:</span>
                          <span className="text-white">{selectedTicket.user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Telefone:</span>
                          <span className="text-white">{selectedTicket.user.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Setor:</span>
                          <span className="text-white">{selectedTicket.user.sector}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Admissão:</span>
                          <span className="text-white">{selectedTicket.user.admissionDate}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                          <Mail className="w-3 h-3" />
                        </Button>
                        <Button size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                          <Phone className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Suggestion Panel */}
                  <Card className="bg-neutral-800 border-neutral-700">
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
                        {showAiPanel ? "Gerando..." : "Gerar Sugestão"}
                      </Button>
                      {showAiPanel && (
                        <div className="p-3 bg-neutral-900 border border-neutral-600 rounded text-xs text-neutral-300">
                          {aiSuggestion || "Analisando ticket..."}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Ticket Details */}
                  <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                        DETALHES DO CHAMADO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-neutral-400">STATUS</span>
                          <div className="mt-1">
                            <Badge
                              className={`${
                                selectedTicket.status === "open"
                                  ? "bg-orange-500/20 text-orange-500"
                                  : selectedTicket.status === "in_progress"
                                    ? "bg-white/20 text-white"
                                    : "bg-white/20 text-white"
                              }`}
                            >
                              {selectedTicket.status === "open"
                                ? "ABERTO"
                                : selectedTicket.status === "in_progress"
                                  ? "EM ANDAMENTO"
                                  : "RESOLVIDO"}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-neutral-400">PRIORIDADE</span>
                          <div className="mt-1">
                            <Badge
                              className={`${
                                selectedTicket.priority === "high"
                                  ? "bg-red-500/20 text-red-500"
                                  : selectedTicket.priority === "medium"
                                    ? "bg-orange-500/20 text-orange-500"
                                    : "bg-white/20 text-white"
                              }`}
                            >
                              {selectedTicket.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-400">DESCRIÇÃO</span>
                        <p className="text-sm text-white mt-1 p-3 bg-neutral-900 border border-neutral-600 rounded">
                          {selectedTicket.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Response Section */}
                  <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                        RESPOSTA / ENCAMINHAMENTO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Digite sua resposta..."
                        className="bg-neutral-900 border-neutral-600 text-white min-h-[100px]"
                        defaultValue={aiSuggestion}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar por E-mail
                        </Button>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                          <Phone className="w-4 h-4 mr-2" />
                          Enviar por WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          className="border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                          onClick={() => handleForwardTicket(selectedTicket.id, 'coordinator-id')}
                        >
                          <Forward className="w-4 h-4 mr-2" />
                          Encaminhar
                        </Button>
                        <Button
                          variant="outline"
                          className="border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                          onClick={() => handleArchiveTicket(selectedTicket.id)}
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Arquivar
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
    // Remover qualquer código duplicado após o fechamento do componente
    // O arquivo deve terminar assim:
    </div>
  )
}

// NÃO deve haver código adicional aqui