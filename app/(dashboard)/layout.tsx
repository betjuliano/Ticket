'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Monitor,
  Target,
  Shield,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  RefreshCw,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  const handleNavigation = (section: string) => {
    // Verificar se o usuário tem permissão para acessar a seção
    const hasPermission = allMenuItems
      .find(item => item.id === section)
      ?.roles.includes(session?.user?.role || 'USER');

    if (hasPermission) {
      router.push(`/${section}`);
    } else {
      // Redirecionar para a primeira seção permitida
      const firstAllowedSection = menuItems[0]?.id || 'tickets';
      router.push(`/${firstAllowedSection}`);
    }
  };

  const allMenuItems = [
    {
      id: 'dashboard',
      icon: Monitor,
      label: 'DASHBOARD',
      roles: ['ADMIN', 'COORDINATOR'],
    },
    {
      id: 'tickets',
      icon: Target,
      label: 'CHAMADOS',
      roles: ['ADMIN', 'COORDINATOR', 'USER'],
    },
    {
      id: 'knowledge',
      icon: Shield,
      label: 'KNOWLEDGE BASE',
      roles: ['ADMIN', 'COORDINATOR', 'USER'],
    },
    { id: 'users', icon: Users, label: 'USUÁRIOS & APOIO', roles: ['ADMIN'] },
    { id: 'systems', icon: Settings, label: 'CONFIGURAÇÕES', roles: ['ADMIN'] },
  ];

  // Filtrar itens do menu baseado no role do usuário
  const menuItems = allMenuItems.filter(item =>
    item.roles.includes(session?.user?.role || 'USER')
  );

  // Debug: verificar role do usuário
  console.log('User role:', session?.user?.role);
  console.log(
    'Menu items filtered:',
    menuItems.map(item => item.id)
  );

  const getCurrentSection = () => {
    const path = pathname.split('/')[1];
    return path || 'dashboard';
  };

  const userRole =
    session?.user?.role === 'COORDINATOR' || session?.user?.role === 'ADMIN'
      ? 'coordinator'
      : 'user';

  // Redirecionamento automático para usuários comuns
  useEffect(() => {
    if (session?.user?.role === 'USER') {
      const currentPath = pathname.split('/')[1] || 'dashboard';
      const allowedPaths = ['tickets', 'knowledge'];

      if (!allowedPaths.includes(currentPath)) {
        router.push('/tickets');
      }
    }
  }, [session, pathname, router]);

  return (
    <div className="flex h-screen tactical-bg">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? 'w-16' : 'w-64'} tactical-sidebar border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-sm font-bold text-primary tracking-wider">
                  SISTEMA UFSM
                </h2>
                <p className="text-xs text-muted-foreground">Atendimento</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-muted-foreground hover:text-primary"
            >
              {sidebarCollapsed ? (
                <Menu className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* User Info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {session?.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {session?.user?.name || 'Usuário'}
                </p>
                <Badge
                  className={`text-xs ${userRole === 'coordinator' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary-foreground'}`}
                >
                  {userRole === 'coordinator' ? 'COORDENADOR' : 'USUÁRIO'}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => {
            const isActive = getCurrentSection() === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-primary hover:bg-accent'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {!sidebarCollapsed && (
                  <span className="text-xs font-medium tracking-wider">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="tactical-header p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SISTEMA ONLINE</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground">
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
                className="text-muted-foreground hover:text-primary"
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
