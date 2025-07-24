'use client'

import { useState } from 'react'
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
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  Building,
  Zap,
  Send,
  Forward,
  Archive,
  Plus,
  Paperclip,
  Bot,
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
// Definir tipos para Ticket
interface TicketUser {
  name: string;
  matricula: string;
  email: string;
  phone: string;
  admissionDate: string;
  sector: string;
}

interface TicketResponse {
  author: string;
  message: string;
  timestamp: string;
  type: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created: string;
  lastUpdate: string;
  user: TicketUser;
  responses: TicketResponse[];
}

export default function TicketsPage() {
  return <CoordinatorTicketsPage />
}

function CoordinatorTicketsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState("")
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showNewTicketForm, setShowNewTicketForm] = useState(false)

  const tickets: Ticket[] = [
    {
      id: "TK-2025-001",
      title: "Problema com acesso ao sistema",
      description: "Não consigo acessar o sistema desde ontem. Aparece erro de autenticação.",
      status: "open",
      priority: "high",
      category: "Técnico",
      created: "2025-06-17 14:30",
      lastUpdate: "2025-06-17 15:45",
      user: {
        name: "João Silva",
        matricula: "12345",
        email: "joao.silva@empresa.com",
        phone: "5511999999999",
        admissionDate: "2020-03-15",
        sector: "TI",
      },
      responses: [],
    },
    {
      id: "TK-2025-002",
      title: "Solicitação de novo equipamento",
      description: "Preciso de um novo monitor para minha estação de trabalho. O atual está com defeito.",
      status: "in_progress",
      priority: "medium",
      category: "Equipamento",
      created: "2025-06-16 09:15",
      lastUpdate: "2025-06-17 10:20",
      user: {
        name: "Maria Santos",
        matricula: "67890",
        email: "maria.santos@empresa.com",
        phone: "5511888888888",
        admissionDate: "2019-08-22",
        sector: "Financeiro",
      },
      responses: [
        {
          author: "Coordenador",
          message: "Solicitação aprovada. Verificando disponibilidade no estoque.",
          timestamp: "2025-06-17 10:20",
          type: "coordinator",
        },
      ],
    },
  ]

  const handleAiSuggestion = async () => {
    setShowAiPanel(true)
    // Simular chamada para IA
    setTimeout(() => {
      setAiSuggestion(
        "Com base no problema relatado, sugiro verificar: 1) Se o usuário está usando as credenciais corretas, 2) Se não há bloqueio na conta, 3) Verificar logs do sistema de autenticação. Resposta sugerida: 'Olá João, recebemos seu chamado. Vamos verificar sua conta e o sistema de autenticação. Por favor, confirme se você está usando a senha correta e se não recebeu nenhuma notificação de bloqueio.'",
      )
    }, 2000)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">CENTRAL DE TICKETS</h1>
          <p className="text-sm text-neutral-400">Gerencie todos os chamados do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar por título, usuário, matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white"
              />
            </div>
            <Select>
              <SelectTrigger className="w-40 bg-neutral-800 border-neutral-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="grid grid-cols-1 gap-4">
        {tickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="bg-neutral-900 border-neutral-700 hover:border-orange-500/50 transition-colors cursor-pointer"
            onClick={() => setSelectedTicket(ticket)}
          >
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold text-white">{ticket.title}</h3>
                    <Badge className="bg-neutral-800 text-neutral-300 text-xs font-mono">{ticket.id}</Badge>
                  </div>
                  <p className="text-sm text-neutral-300 mb-2">{ticket.description}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge
                      className={`${
                        ticket.status === "open"
                          ? "bg-orange-500/20 text-orange-500"
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
                    <Badge className="bg-neutral-800 text-neutral-300">{ticket.category}</Badge>
                  </div>
                </div>
                <div className="text-sm text-neutral-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>{ticket.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{ticket.created}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-7xl max-h-[95vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-700">
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-wider">{selectedTicket.title}</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">{selectedTicket.id}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedTicket(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* User Info Panel */}
                <div className="xl:col-span-1">
                  <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                        DADOS DO SOLICITANTE
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-xs text-neutral-400">NOME</span>
                        <p className="text-sm text-white font-medium">{selectedTicket.user.name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-400">MATRÍCULA</span>
                        <p className="text-sm text-white font-mono">{selectedTicket.user.matricula}</p>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-400">SETOR</span>
                        <p className="text-sm text-white">{selectedTicket.user.sector}</p>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-400">DATA DE INGRESSO</span>
                        <p className="text-sm text-white font-mono">{selectedTicket.user.admissionDate}</p>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-400">E-MAIL</span>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white">{selectedTicket.user.email}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-neutral-400 hover:text-orange-500"
                          >
                            <Mail className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-400">TELEFONE</span>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white">{selectedTicket.user.phone}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-neutral-400 hover:text-orange-500"
                            onClick={() => window.open(`https://wa.me/${selectedTicket.user.phone}`, "_blank")}
                          >
                            <Phone className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Suggestion Panel */}
                  <Card className="bg-neutral-800 border-neutral-700 mt-4">
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
                          className="border-neutral-700 text-neutral-400 hover:bg-neutral-800">
                          <Forward className="w-4 h-4 mr-2" />
                          Encaminhar
                        </Button>
                        <Button
                          variant="outline"
                          className="border-neutral-700 text-neutral-400 hover:bg-neutral-800">
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
    </div>
  );
}