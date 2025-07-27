"use client"

import { useState, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ChevronRight, Monitor, Settings, Shield, Target, Users, Bell, RefreshCw, User, UserCog, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<"user" | "coordinator">("coordinator")

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  const handleNavigation = (section: string) => {
    router.push(`/${section}`)
  }

  // Redirect to dashboard by default
  useEffect(() => {
    if (status === "authenticated") {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        router.push('/dashboard')
      }, 0)
    } else if (status === "unauthenticated") {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        router.push('/auth/signin')
      }, 0)
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900">
        <div className="text-orange-500">Carregando...</div>
      </div>
    )
  }

  // Remove the direct router.push call from render
  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900">
        <div className="text-orange-500">Redirecionando...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-white/10 backdrop-blur-lg border-r border-white/20 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-blue-300 font-bold text-lg tracking-wider">TICKET SYSTEM</h1>
              <p className="text-blue-200 text-xs">v2.1.7 SUPPORT</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-blue-300 hover:text-white"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          {/* Role Switcher */}
          {!sidebarCollapsed && (
            <div className="mb-6 p-3 bg-white/10 border border-white/20 rounded">
              <div className="flex gap-2">
                <Button
                  variant={userRole === "user" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setUserRole("user")}
                  className={`flex-1 text-xs ${userRole === "user" ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" : "text-blue-300 hover:text-white"}`}
                >
                  <User className="w-3 h-3 mr-1" />
                  USUÁRIO
                </Button>
                <Button
                  variant={userRole === "coordinator" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setUserRole("coordinator")}
                  className={`flex-1 text-xs ${userRole === "coordinator" ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" : "text-blue-300 hover:text-white"}`}
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
              { id: "dashboard", icon: Monitor, label: "DASHBOARD" },
              { id: "tickets", icon: Target, label: "CHAMADOS" },
              { id: "knowledge", icon: Shield, label: "KNOWLEDGE BASE" },
              { id: "users", icon: Users, label: "USUÁRIOS & APOIO" },
              { id: "systems", icon: Settings, label: "CONFIGURAÇÕES" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className="w-full flex items-center gap-3 p-3 rounded transition-colors text-blue-300 hover:text-white hover:bg-white/10"
              >
                <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-white/10 border border-white/20 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SISTEMA ONLINE</span>
              </div>
              <div className="text-xs text-blue-200">
                <div>UPTIME: 72:14:33</div>
                <div>TICKETS: 23 ABERTOS</div>
                <div>USUÁRIOS: 847 ATIVOS</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!sidebarCollapsed ? "md:ml-0" : ""}`}>
        {/* Top Toolbar */}
        <div className="h-16 bg-white/10 backdrop-blur-lg border-b border-white/20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-blue-200">
              TICKET SYSTEM / <span className="text-blue-300">HOME</span>
            </div>
            <Badge
              className={`${userRole === "coordinator" ? "bg-blue-600/20 text-blue-300" : "bg-white/20 text-white"}`}
            >
              {userRole === "coordinator" ? "COORDENADOR" : "USUÁRIO"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-blue-200">LAST UPDATE: 17/06/2025 20:00 UTC</div>
            <Button variant="ghost" size="icon" className="text-blue-300 hover:text-white">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-blue-300 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Welcome Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Bem-vindo ao Sistema de Tickets</h2>
            <p className="text-blue-200 mb-6">Selecione uma seção no menu lateral para começar</p>
            <Button 
              onClick={() => handleNavigation('dashboard')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              Ir para Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
