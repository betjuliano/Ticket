"use client"

import { useState } from "react"
import { ChevronRight, Monitor, Settings, Shield, Target, Users, Bell, RefreshCw, User, UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import DashboardPage from "./dashboard/page"
import TicketsPage from "./tickets/page"
import KnowledgePage from "./knowledge/page"
import UsersPage from "./users/page"
import SystemsPage from "./systems/page"

export default function TicketingDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState("coordinator") // "user" or "coordinator"

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-orange-500 font-bold text-lg tracking-wider">TICKET SYSTEM</h1>
              <p className="text-neutral-500 text-xs">v2.1.7 SUPPORT</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-orange-500"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          {/* Role Switcher */}
          {!sidebarCollapsed && (
            <div className="mb-6 p-3 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex gap-2">
                <Button
                  variant={userRole === "user" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setUserRole("user")}
                  className={`flex-1 text-xs ${userRole === "user" ? "bg-orange-500 hover:bg-orange-600" : "text-neutral-400 hover:text-white"}`}
                >
                  <User className="w-3 h-3 mr-1" />
                  USUÁRIO
                </Button>
                <Button
                  variant={userRole === "coordinator" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setUserRole("coordinator")}
                  className={`flex-1 text-xs ${userRole === "coordinator" ? "bg-orange-500 hover:bg-orange-600" : "text-neutral-400 hover:text-white"}`}
                >
                  <UserCog className="w-3 h-3 mr-1" />
                  COORDENADOR
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
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  activeSection === item.id
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SISTEMA ONLINE</span>
              </div>
              <div className="text-xs text-neutral-500">
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
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              TICKET SYSTEM / <span className="text-orange-500">{activeSection.toUpperCase()}</span>
            </div>
            <Badge
              className={`${userRole === "coordinator" ? "bg-orange-500/20 text-orange-500" : "bg-white/20 text-white"}`}
            >
              {userRole === "coordinator" ? "COORDENADOR" : "USUÁRIO"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-neutral-500">LAST UPDATE: 17/06/2025 20:00 UTC</div>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          {activeSection === "dashboard" && <DashboardPage userRole={userRole} />}
          {activeSection === "tickets" && <TicketsPage userRole={userRole} />}
          {activeSection === "knowledge" && <KnowledgePage userRole={userRole} />}
          {activeSection === "users" && <UsersPage userRole={userRole} />}
          {activeSection === "systems" && <SystemsPage userRole={userRole} />}
        </div>
      </div>
    </div>
  )
}
