'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Monitor, Target, Shield, Users, Settings, LogOut, Menu, X, Bell, RefreshCw } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  const handleNavigation = (section: string) => {
    router.push(`/${section}`)
  }

  const menuItems = [
    { id: "dashboard", icon: Monitor, label: "DASHBOARD" },
    { id: "tickets", icon: Target, label: "CHAMADOS" },
    { id: "knowledge", icon: Shield, label: "KNOWLEDGE BASE" },
    { id: "users", icon: Users, label: "USUÁRIOS & APOIO" },
    { id: "systems", icon: Settings, label: "CONFIGURAÇÕES" },
  ]

  const getCurrentSection = () => {
    const path = pathname.split('/')[1]
    return path || 'dashboard'
  }

  const userRole = session?.user?.role === 'COORDINATOR' ? 'coordinator' : 'user'

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-sm font-bold text-orange-500 tracking-wider">SISTEMA UFSM</h2>
                <p className="text-xs text-neutral-400">Atendimento</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-orange-500"
            >
              {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* User Info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-black">
                  {session?.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {session?.user?.name || 'Usuário'}
                </p>
                <Badge className={`text-xs ${userRole === 'coordinator' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {userRole === 'coordinator' ? 'COORDENADOR' : 'USUÁRIO'}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-neutral-400 hover:text-red-500"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = getCurrentSection() === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30'
                    : 'text-neutral-400 hover:text-orange-500 hover:bg-neutral-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {!sidebarCollapsed && (
                  <span className="text-xs font-medium tracking-wider">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-neutral-900 border-b border-neutral-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SISTEMA ONLINE</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-neutral-500">LAST UPDATE: {new Date().toLocaleString()}</div>
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}