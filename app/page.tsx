'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Monitor,
  Settings,
  Shield,
  Target,
  Users,
  Bell,
  RefreshCw,
  User,
  UserCog,
  LogOut,
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  UserPlus,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'coordinator'>(
    'coordinator'
  );

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  const handleNavigation = (section: string) => {
    router.push(`/${section}`);
  };

  // Redirect to dashboard by default
  useEffect(() => {
    if (status === 'authenticated') {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        router.push('/');
      }, 0);
    } else if (status === 'unauthenticated') {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        router.push('/auth/signin');
      }, 0);
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900">
        <div className="text-orange-500">Carregando...</div>
      </div>
    );
  }

  // Remove the direct router.push call from render
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900">
        <div className="text-orange-500">Redirecionando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? 'w-16' : 'w-70'} bg-white/10 backdrop-blur-lg border-r border-white/20 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? 'md:block' : ''}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? 'hidden' : 'block'}`}>
              <h1 className="text-orange-300 font-bold text-lg tracking-wider">
                Curso Administração UFSM
              </h1>
              <p className="text-orange-200 text-xs">
                v.1.0 desenvolvido por Juliano Alves
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-orange-300 hover:text-white"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`}
              />
            </Button>
          </div>

          {/* Role Switcher */}
          {!sidebarCollapsed && (
            <div className="mb-6 p-3 bg-white/10 border border-white/20 rounded">
              <div className="flex gap-2">
                <Button
                  variant={userRole === 'user' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setUserRole('user')}
                  className={`flex-1 text-xs ${userRole === 'user' ? 'bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800' : 'text-orange-300 hover:text-white'}`}
                >
                  <User className="w-3 h-3 mr-1" />
                  USUÁRIO
                </Button>
                <Button
                  variant={userRole === 'coordinator' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setUserRole('coordinator')}
                  className={`flex-1 text-xs ${userRole === 'coordinator' ? 'bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800' : 'text-orange-300 hover:text-white'}`}
                >
                  <UserCog className="w-3 h-3 mr-1" />
                  COORDENADOR
                </Button>
              </div>
            </div>
          )}

          {/* User Info & Logout */}
          {!sidebarCollapsed && session && (
            <div className="mb-6 p-3 bg-white/10 border border-white/20 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-white">
                  <div className="font-medium">{session.user?.name}</div>
                  <div className="text-blue-200">{session.user?.email}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-blue-300 hover:text-red-400"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: Monitor, label: 'DASHBOARD' },
              { id: 'tickets', icon: Target, label: 'CHAMADOS' },
              { id: 'knowledge', icon: Shield, label: 'KNOWLEDGE BASE' },
              { id: 'users', icon: Users, label: 'USUÁRIOS & APOIO' },
              { id: 'systems', icon: Settings, label: 'CONFIGURAÇÕES' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className="w-full flex items-center gap-3 p-3 rounded transition-colors text-orange-300 hover:text-white hover:bg-white/10"
              >
                <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col ${!sidebarCollapsed ? 'md:ml-0' : ''}`}
      >
        {/* Top Toolbar */}
        <div className="h-16 bg-white/10 backdrop-blur-lg border-b border-white/20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-orange-200">
              CURSO ADMINISTRAÇÃO UFSM /{' '}
              <span className="text-orange-300">HOME</span>
            </div>
            <Badge
              className={`${userRole === 'coordinator' ? 'bg-orange-600/20 text-orange-300' : 'bg-white/20 text-white'}`}
            >
              {userRole === 'coordinator' ? 'COORDENADOR' : 'USUÁRIO'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-orange-200">
              ÚLTIMA ATUALIZAÇÃO:{' '}
              {new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}{' '}
              {new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-orange-300 hover:text-white"
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-orange-300 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Dashboard do Sistema
            </h2>
            <p className="text-orange-200">Visão geral em tempo real</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-200 tracking-wider">
                      TOTAL CHAMADOS
                    </p>
                    <p className="text-2xl font-bold text-white font-mono">
                      247
                    </p>
                  </div>
                  <Ticket className="w-8 h-8 text-orange-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-200 tracking-wider">
                      CHAMADOS ABERTOS
                    </p>
                    <p className="text-2xl font-bold text-orange-400 font-mono">
                      23
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-200 tracking-wider">
                      EM ANDAMENTO
                    </p>
                    <p className="text-2xl font-bold text-yellow-400 font-mono">
                      45
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-200 tracking-wider">
                      RESOLVIDOS
                    </p>
                    <p className="text-2xl font-bold text-green-400 font-mono">
                      179
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-200 tracking-wider">
                      TOTAL USUÁRIOS
                    </p>
                    <p className="text-2xl font-bold text-orange-300 font-mono">
                      156
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-orange-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-200 tracking-wider">
                      USUÁRIOS ATIVOS
                    </p>
                    <p className="text-2xl font-bold text-green-400 font-mono">
                      142
                    </p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-200 tracking-wider">
                      NOVOS ESTE MÊS
                    </p>
                    <p className="text-2xl font-bold text-orange-400 font-mono">
                      8
                    </p>
                  </div>
                  <UserPlus className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-200 tracking-wider">
                      CONTATOS SUPORTE
                    </p>
                    <p className="text-2xl font-bold text-purple-400 font-mono">
                      12
                    </p>
                  </div>
                  <Headphones className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
