'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  Activity,
  Users,
  UserCheck,
  UserPlus,
  Headphones,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    avgResolutionTime: '0h',
    satisfactionRate: 0,
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    supportContacts: 0,
  });

  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserStats, setShowUserStats] = useState(false);

  const isAdminOrCoordinator = session?.user?.role === 'ADMIN' || session?.user?.role === 'COORDINATOR';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Buscar dados do dashboard (API pública)
        const dashboardResponse = await fetch('/api/dashboard/stats');
        const dashboardData = await dashboardResponse.json();
        
        if (dashboardData.success) {
          const { stats, recentTickets } = dashboardData;
          
          setRecentTickets(recentTickets || []);
          setStats({
            totalTickets: stats.totalTickets,
            openTickets: stats.openTickets,
            inProgressTickets: stats.inProgressTickets,
            resolvedTickets: stats.resolvedTickets,
            avgResolutionTime: stats.avgResolutionTime,
            satisfactionRate: stats.satisfactionRate,
            totalUsers: stats.totalUsers,
            activeUsers: stats.activeUsers,
            newUsersThisMonth: stats.newUsersThisMonth,
            supportContacts: stats.supportContacts,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-orange-500/20 text-orange-500';
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-500';
      case 'RESOLVED':
        return 'bg-green-500/20 text-green-500';
      default:
        return 'bg-neutral-500/20 text-neutral-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'ABERTO';
      case 'IN_PROGRESS':
        return 'EM ANDAMENTO';
      case 'RESOLVIDO':
        return 'RESOLVIDO';
      default:
        return status.toUpperCase();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/20 text-red-500';
      case 'MEDIUM':
        return 'bg-orange-500/20 text-orange-500';
      case 'LOW':
        return 'bg-green-500/20 text-green-500';
      default:
        return 'bg-neutral-500/20 text-neutral-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCardClick = (section: string) => {
    if (isAdminOrCoordinator) {
      router.push(`/${section}`);
    }
  };

  const getCardCursor = (section: string) => {
    return isAdminOrCoordinator ? 'cursor-pointer hover:scale-105 transition-transform' : 'cursor-default';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">
            DASHBOARD DO SISTEMA
          </h1>
          <p className="text-sm text-blue-200">
            Visão geral em tempo real dos tickets e usuários
          </p>
          {session?.user && (
            <p className="text-xs text-blue-300 mt-1">
              Logado como: {session.user.name} ({session.user.role})
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isAdminOrCoordinator && (
            <Button
              variant="outline"
              className="border-white/20 text-blue-300 hover:bg-white/10"
              onClick={() => setShowUserStats(!showUserStats)}
            >
              {showUserStats ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showUserStats ? 'Ocultar' : 'Mostrar'} Estatísticas de Usuários
            </Button>
          )}
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <MessageSquare className="w-4 h-4 mr-2" />
            Novo Ticket
          </Button>
        </div>
      </div>

      {/* Stats Overview - Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card 
          className={`bg-slate-800 border-slate-600 ${getCardCursor('tickets')}`}
          onClick={() => handleCardClick('tickets')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {isLoading ? (
                    <span className="animate-pulse bg-slate-600 rounded h-8 w-12 inline-block"></span>
                  ) : (
                    stats.totalTickets
                  )}
                </p>
              </div>
              <Ticket className="w-8 h-8 text-white" />
            </div>
            {isAdminOrCoordinator && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-blue-300">Clique para ver</span>
                <ArrowRight className="w-4 h-4 text-blue-300" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`bg-slate-800 border-slate-600 ${getCardCursor('tickets')}`}
          onClick={() => handleCardClick('tickets')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  ABERTOS
                </p>
                <p className="text-2xl font-bold text-orange-500 font-mono">
                  {isLoading ? (
                    <span className="animate-pulse bg-slate-600 rounded h-8 w-12 inline-block"></span>
                  ) : (
                    stats.openTickets
                  )}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            {isAdminOrCoordinator && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-blue-300">Clique para ver</span>
                <ArrowRight className="w-4 h-4 text-blue-300" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`bg-slate-800 border-slate-600 ${getCardCursor('tickets')}`}
          onClick={() => handleCardClick('tickets')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  EM ANDAMENTO
                </p>
                <p className="text-2xl font-bold text-blue-500 font-mono">
                  {isLoading ? (
                    <span className="animate-pulse bg-slate-600 rounded h-8 w-12 inline-block"></span>
                  ) : (
                    stats.inProgressTickets
                  )}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
            {isAdminOrCoordinator && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-blue-300">Clique para ver</span>
                <ArrowRight className="w-4 h-4 text-blue-300" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`bg-slate-800 border-slate-600 ${getCardCursor('tickets')}`}
          onClick={() => handleCardClick('tickets')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  RESOLVIDOS
                </p>
                <p className="text-2xl font-bold text-green-500 font-mono">
                  {isLoading ? (
                    <span className="animate-pulse bg-slate-600 rounded h-8 w-12 inline-block"></span>
                  ) : (
                    stats.resolvedTickets
                  )}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            {isAdminOrCoordinator && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-blue-300">Clique para ver</span>
                <ArrowRight className="w-4 h-4 text-blue-300" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  TEMPO MÉDIO
                </p>
                <p className="text-2xl font-bold text-white font-mono">
                  {isLoading ? (
                    <span className="animate-pulse bg-slate-600 rounded h-8 w-12 inline-block"></span>
                  ) : (
                    stats.avgResolutionTime
                  )}
                </p>
              </div>
              <Activity className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  SATISFAÇÃO
                </p>
                <p className="text-2xl font-bold text-green-500 font-mono">
                  {isLoading ? (
                    <span className="animate-pulse bg-slate-600 rounded h-8 w-12 inline-block"></span>
                  ) : (
                    `${stats.satisfactionRate}%`
                  )}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Stats - Apenas para admin/coordenação */}
      {isAdminOrCoordinator && showUserStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className={`bg-slate-800 border-slate-600 ${getCardCursor('users')}`}
            onClick={() => handleCardClick('users')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    TOTAL USUÁRIOS
                  </p>
                  <p className="text-2xl font-bold text-blue-400 font-mono">
                    {isLoading ? (
                      <span className="animate-pulse bg-slate-600 rounded h-8 w-12 inline-block"></span>
                    ) : (
                      stats.totalUsers
                    )}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-blue-300">Clique para ver</span>
                <ArrowRight className="w-4 h-4 text-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-slate-800 border-slate-600 ${getCardCursor('users')}`}
            onClick={() => handleCardClick('users')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    USUÁRIOS ATIVOS
                  </p>
                  <p className="text-2xl font-bold text-green-400 font-mono">
                    {isLoading ? (
                      <span className="animate-pulse bg-slate-600 rounded h-8 w-12 inline-block"></span>
                    ) : (
                      stats.activeUsers
                    )}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-green-400" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-blue-300">Clique para ver</span>
                <ArrowRight className="w-4 h-4 text-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-slate-800 border-slate-600 ${getCardCursor('users')}`}
            onClick={() => handleCardClick('users')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    NOVOS ESTE MÊS
                  </p>
                  <p className="text-2xl font-bold text-orange-400 font-mono">
                    {isLoading ? (
                      <span className="animate-pulse bg-slate-600 rounded h-8 w-12 inline-block"></span>
                    ) : (
                      stats.newUsersThisMonth
                    )}
                  </p>
                </div>
                <UserPlus className="w-8 h-8 text-orange-400" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-blue-300">Clique para ver</span>
                <ArrowRight className="w-4 h-4 text-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-slate-800 border-slate-600 ${getCardCursor('users')}`}
            onClick={() => handleCardClick('users')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    CONTATOS SUPORTE
                  </p>
                  <p className="text-2xl font-bold text-purple-400 font-mono">
                    {isLoading ? (
                      <span className="animate-pulse bg-slate-600 rounded h-8 w-12 inline-block"></span>
                    ) : (
                      stats.supportContacts
                    )}
                  </p>
                </div>
                <Headphones className="w-8 h-8 text-purple-400" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-blue-300">Clique para ver</span>
                <ArrowRight className="w-4 h-4 text-blue-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Executive Summary */}
      <Card className="bg-gradient-to-r from-blue-900/50 to-slate-800/50 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            RESUMO EXECUTIVO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-blue-300 tracking-wider">
                PERFORMANCE GERAL
              </h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Taxa de Resolução:</span>
                  <span className="text-green-400 font-mono">
                    {stats.totalTickets > 0
                      ? ((stats.resolvedTickets / stats.totalTickets) * 100).toFixed(1)
                      : '0'}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Tickets Pendentes:</span>
                  <span className="text-orange-400 font-mono">
                    {stats.openTickets + stats.inProgressTickets}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Tempo Médio:</span>
                  <span className="text-blue-400 font-mono">
                    {stats.avgResolutionTime}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-blue-300 tracking-wider">
                QUALIDADE DO ATENDIMENTO
              </h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Satisfação:</span>
                  <span className="text-green-400 font-mono">
                    {stats.satisfactionRate}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Meta Satisfação:</span>
                  <span className="text-slate-400 font-mono">≥90%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Status:</span>
                  <span
                    className={`font-mono ${stats.satisfactionRate >= 90 ? 'text-green-400' : 'text-orange-400'}`}
                  >
                    {stats.satisfactionRate >= 90
                      ? '✓ Meta Atingida'
                      : '⚠ Abaixo da Meta'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-blue-300 tracking-wider">
                INSIGHTS & ALERTAS
              </h3>
              <div className="space-y-1">
                <div className="text-xs text-slate-300">
                  {stats.openTickets > 5 && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <AlertTriangle className="w-3 h-3" />
                      Alto volume de tickets abertos
                    </div>
                  )}
                  {stats.satisfactionRate >= 95 && (
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="w-3 h-3" />
                      Excelente satisfação do cliente
                    </div>
                  )}
                  {parseFloat(stats.avgResolutionTime) < 5 && (
                    <div className="flex items-center gap-1 text-blue-400">
                      <Clock className="w-3 h-3" />
                      Tempo de resolução otimizado
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            TICKETS RECENTES
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-neutral-700 rounded p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-600 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-slate-600 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentTickets.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
              <p className="text-neutral-400">Nenhum ticket encontrado</p>
              <p className="text-sm text-neutral-500">Os tickets aparecerão aqui quando criados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTickets.map(ticket => (
                <div
                  key={ticket.id}
                  className="border border-neutral-700 rounded p-4 hover:border-orange-500/50 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-bold text-white">
                          {ticket.title}
                        </h3>
                        <Badge className="bg-neutral-800 text-neutral-300 text-xs font-mono">
                          {ticket.id}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-neutral-400 space-y-1">
                        <div>Usuário: {ticket.createdBy?.name || 'N/A'}</div>
                        <div>Criado: {formatDate(ticket.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isAdminOrCoordinator && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                        >
                          Atribuir
                        </Button>
                      )}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
