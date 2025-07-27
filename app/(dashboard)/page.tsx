"use client"

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Ticket, Clock, CheckCircle, AlertTriangle, MessageSquare, TrendingUp, Activity } from "lucide-react"

export default function DashboardPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role === 'COORDINATOR' ? 'coordinator' : 'user'

  if (userRole === "user") {
    return <UserDashboard />
  }

  return <CoordinatorDashboard />
}

function UserDashboard() {
  const userTickets = [
    {
      id: "TK-2025-001",
      title: "Problema com acesso ao sistema",
      status: "open",
      priority: "high",
      created: "2025-06-17 14:30",
      lastUpdate: "2025-06-17 15:45",
    },
    {
      id: "TK-2025-002",
      title: "Solicitação de novo equipamento",
      status: "in_progress",
      priority: "medium",
      created: "2025-06-16 09:15",
      lastUpdate: "2025-06-17 10:20",
    },
    {
      id: "TK-2025-003",
      title: "Dúvida sobre procedimento",
      status: "resolved",
      priority: "low",
      created: "2025-06-15 16:00",
      lastUpdate: "2025-06-16 08:30",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-orange-500/20 text-orange-500"
      case "in_progress":
        return "bg-white/20 text-white"
      case "resolved":
        return "bg-white/20 text-white"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "ABERTO"
      case "in_progress":
        return "EM ANDAMENTO"
      case "resolved":
        return "RESOLVIDO"
      default:
        return status.toUpperCase()
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-500"
      case "medium":
        return "bg-orange-500/20 text-orange-500"
      case "low":
        return "bg-white/20 text-white"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">MEU DASHBOARD</h1>
          <p className="text-sm text-neutral-400">Acompanhe seus chamados e abra novos tickets</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Ticket className="w-4 h-4 mr-2" />
          Novo Chamado
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CHAMADOS ABERTOS</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">2</p>
              </div>
              <Ticket className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">EM ANDAMENTO</p>
                <p className="text-2xl font-bold text-white font-mono">1</p>
              </div>
              <Clock className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">RESOLVIDOS</p>
                <p className="text-2xl font-bold text-white font-mono">15</p>
              </div>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TEMPO MÉDIO</p>
                <p className="text-2xl font-bold text-white font-mono">2.5h</p>
              </div>
              <Activity className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">MEUS CHAMADOS RECENTES</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border border-neutral-700 rounded p-4 hover:border-orange-500/50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-bold text-white">{ticket.title}</h3>
                      <Badge className="bg-neutral-800 text-neutral-300 text-xs font-mono">{ticket.id}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority.toUpperCase()}</Badge>
                    </div>
                    <div className="text-xs text-neutral-400 space-y-1">
                      <div>Criado: {ticket.created}</div>
                      <div>Última atualização: {ticket.lastUpdate}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CoordinatorDashboard() {
  const stats = {
    totalTickets: 247,
    openTickets: 23,
    inProgressTickets: 45,
    resolvedTickets: 179,
    avgResolutionTime: "4.2h",
    satisfactionRate: 94
  }

  const recentTickets = [
    {
      id: "TK-2025-045",
      title: "Sistema de backup não está funcionando",
      user: "João Silva",
      status: "open",
      priority: "high",
      created: "2025-06-17 16:20",
      assignedTo: "Maria Santos"
    },
    {
      id: "TK-2025-044",
      title: "Solicitação de acesso ao sistema financeiro",
      user: "Ana Costa",
      status: "in_progress",
      priority: "medium",
      created: "2025-06-17 14:15",
      assignedTo: "Carlos Lima"
    },
    {
      id: "TK-2025-043",
      title: "Problema com impressora do setor",
      user: "Pedro Oliveira",
      status: "resolved",
      priority: "low",
      created: "2025-06-17 10:30",
      assignedTo: "Maria Santos"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-orange-500/20 text-orange-500"
      case "in_progress":
        return "bg-blue-500/20 text-blue-500"
      case "resolved":
        return "bg-green-500/20 text-green-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "ABERTO"
      case "in_progress":
        return "EM ANDAMENTO"
      case "resolved":
        return "RESOLVIDO"
      default:
        return status.toUpperCase()
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-500"
      case "medium":
        return "bg-orange-500/20 text-orange-500"
      case "low":
        return "bg-green-500/20 text-green-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">DASHBOARD COORDENADOR</h1>
          <p className="text-sm text-blue-200">Visão geral do sistema de tickets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/20 text-blue-300 hover:bg-white/10">
            <TrendingUp className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <MessageSquare className="w-4 h-4 mr-2" />
            Gerenciar Tickets
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL</p>
                <p className="text-2xl font-bold text-white font-mono">{stats.totalTickets}</p>
              </div>
              <Ticket className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ABERTOS</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">{stats.openTickets}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">EM ANDAMENTO</p>
                <p className="text-2xl font-bold text-blue-500 font-mono">{stats.inProgressTickets}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">RESOLVIDOS</p>
                <p className="text-2xl font-bold text-green-500 font-mono">{stats.resolvedTickets}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TEMPO MÉDIO</p>
                <p className="text-2xl font-bold text-white font-mono">{stats.avgResolutionTime}</p>
              </div>
              <Activity className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">SATISFAÇÃO</p>
                <p className="text-2xl font-bold text-green-500 font-mono">{stats.satisfactionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">TICKETS RECENTES</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border border-neutral-700 rounded p-4 hover:border-orange-500/50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-bold text-white">{ticket.title}</h3>
                      <Badge className="bg-neutral-800 text-neutral-300 text-xs font-mono">{ticket.id}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority.toUpperCase()}</Badge>
                    </div>
                    <div className="text-xs text-neutral-400 space-y-1">
                      <div>Usuário: {ticket.user}</div>
                      <div>Atribuído a: {ticket.assignedTo}</div>
                      <div>Criado: {ticket.created}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                    >
                      Atribuir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}