"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Ticket, Clock, CheckCircle, AlertTriangle, MessageSquare, TrendingUp, Activity } from "lucide-react"

interface DashboardPageProps {
  userRole: "user" | "coordinator"
}

export default function DashboardPage({ userRole }: DashboardPageProps) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    inProgress: 15,
    resolved: 209,
    avgResponseTime: "1.2h",
    satisfaction: 94,
  }

  const recentActivity = [
    {
      time: "17/06/2025 15:45",
      user: "João Silva",
      action: "abriu chamado",
      ticket: "TK-2025-045",
      priority: "high",
    },
    {
      time: "17/06/2025 15:30",
      user: "Maria Santos",
      action: "respondeu chamado",
      ticket: "TK-2025-044",
      priority: "medium",
    },
    {
      time: "17/06/2025 15:15",
      user: "Pedro Costa",
      action: "finalizou chamado",
      ticket: "TK-2025-043",
      priority: "low",
    },
    {
      time: "17/06/2025 15:00",
      user: "Ana Oliveira",
      action: "encaminhou para parecer",
      ticket: "TK-2025-042",
      priority: "high",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">DASHBOARD COORDENADOR</h1>
          <p className="text-sm text-neutral-400">Visão geral do sistema de tickets</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <MessageSquare className="w-4 h-4 mr-2" />
            Responder Tickets
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL TICKETS</p>
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
                <p className="text-2xl font-bold text-white font-mono">{stats.inProgress}</p>
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
                <p className="text-2xl font-bold text-white font-mono">{stats.resolved}</p>
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
                <p className="text-2xl font-bold text-white font-mono">{stats.avgResponseTime}</p>
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
                <p className="text-2xl font-bold text-white font-mono">{stats.satisfaction}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">ATIVIDADE RECENTE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="text-xs border-l-2 border-orange-500 pl-3 hover:bg-neutral-800 p-2 rounded transition-colors"
                >
                  <div className="text-neutral-500 font-mono">{activity.time}</div>
                  <div className="text-white">
                    <span className="text-orange-500 font-mono">{activity.user}</span> {activity.action}{" "}
                    <span className="text-white font-mono">{activity.ticket}</span>
                    <Badge
                      className={`ml-2 text-xs ${
                        activity.priority === "high"
                          ? "bg-red-500/20 text-red-500"
                          : activity.priority === "medium"
                            ? "bg-orange-500/20 text-orange-500"
                            : "bg-white/20 text-white"
                      }`}
                    >
                      {activity.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              PERFORMANCE DOS TICKETS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 relative">
              {/* Chart Grid */}
              <div className="absolute inset-0 grid grid-cols-7 grid-rows-6 opacity-20">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div key={i} className="border border-neutral-700"></div>
                ))}
              </div>

              {/* Chart Line */}
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  points="0,120 50,100 100,110 150,90 200,95 250,85 300,100"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                />
                <polyline
                  points="0,140 50,135 100,130 150,125 200,130 250,135 300,125"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-500 -ml-8 font-mono">
                <span>50</span>
                <span>40</span>
                <span>30</span>
                <span>20</span>
                <span>10</span>
                <span>0</span>
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-neutral-500 -mb-6 font-mono">
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
                <span>Dom</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
