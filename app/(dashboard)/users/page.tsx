"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  User,
  Users,
  Phone,
  Mail,
  Building,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  ArrowLeft,
  Home
} from "lucide-react"

// Remove this interface as it's not needed
// interface UsersPageProps {
//   userRole: "user" | "coordinator"
// }

export default function UsersPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role === 'COORDINATOR' ? 'coordinator' : 'user'
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "USER",
    matricula: "",
    telefone: ""
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeTab, setActiveTab] = useState("users") // "users" or "support"

  const users = [
    {
      id: "USR-001",
      name: "João Silva",
      matricula: "12345",
      email: "joao.silva@empresa.com",
      phone: "5511999999999",
      sector: "TI",
      admissionDate: "2020-03-15",
      status: "active",
      ticketsCount: 15,
      lastTicket: "2025-06-17",
    },
    {
      id: "USR-002",
      name: "Maria Santos",
      matricula: "67890",
      email: "maria.santos@empresa.com",
      phone: "5511888888888",
      sector: "Financeiro",
      admissionDate: "2019-08-22",
      status: "active",
      ticketsCount: 8,
      lastTicket: "2025-06-16",
    },
    {
      id: "USR-003",
      name: "Pedro Costa",
      matricula: "54321",
      email: "pedro.costa@empresa.com",
      phone: "5511777777777",
      sector: "RH",
      admissionDate: "2021-01-10",
      status: "inactive",
      ticketsCount: 3,
      lastTicket: "2025-05-20",
    },
  ]

  const supportContacts = [
    {
      id: "SUP-001",
      name: "Ana Oliveira",
      sector: "Secretaria",
      email: "ana.oliveira@empresa.com",
      phone: "5511666666666",
      specialties: ["Documentos", "Processos"],
      status: "active",
    },
    {
      id: "SUP-002",
      name: "Carlos Mendes",
      sector: "Reitoria",
      email: "carlos.mendes@empresa.com",
      phone: "5511555555555",
      specialties: ["Decisões", "Políticas"],
      status: "active",
    },
    {
      id: "SUP-003",
      name: "Prof. Roberto Lima",
      sector: "Professor",
      email: "roberto.lima@empresa.com",
      phone: "5511444444444",
      specialties: ["Acadêmico", "Pesquisa"],
      status: "active",
    },
    {
      id: "SUP-004",
      name: "TechSupport Ltda",
      sector: "Terceiros",
      email: "contato@techsupport.com",
      phone: "5511333333333",
      specialties: ["Hardware", "Infraestrutura"],
      status: "active",
    },
  ]

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.matricula.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.sector.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredSupport = supportContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.specialties.some((spec) => spec.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (userRole === "user") {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">ACESSO RESTRITO</h2>
          <p className="text-neutral-400">Esta seção é disponível apenas para coordenadores</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6 space-y-6">
      {/* Header com Navegação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-blue-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">GERENCIAMENTO DE USUÁRIOS</h1>
            <p className="text-sm text-blue-200">Gerencie usuários e contatos de apoio</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-blue-200">
        <Home className="w-4 h-4" />
        <span>/</span>
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-white">Usuários</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "users" ? "default" : "ghost"}
          onClick={() => setActiveTab("users")}
          className={activeTab === "users" ? "bg-orange-500 hover:bg-orange-600" : "text-neutral-400 hover:text-white"}
        >
          <User className="w-4 h-4 mr-2" />
          USUÁRIOS
        </Button>
        <Button
          variant={activeTab === "support" ? "default" : "ghost"}
          onClick={() => setActiveTab("support")}
          className={
            activeTab === "support" ? "bg-orange-500 hover:bg-orange-600" : "text-neutral-400 hover:text-white"
          }
        >
          <UserPlus className="w-4 h-4 mr-2" />
          APOIO
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">USUÁRIOS ATIVOS</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {activeTab === "users"
                    ? users.filter((u) => u.status === "active").length
                    : supportContacts.filter((s) => s.status === "active").length}
                </p>
              </div>
              <User className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {activeTab === "users" ? users.length : supportContacts.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">SETORES</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {activeTab === "users"
                    ? new Set(users.map((u) => u.sector)).size
                    : new Set(supportContacts.map((s) => s.sector)).size}
                </p>
              </div>
              <Building className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TICKETS MÉDIO</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">
                  {activeTab === "users"
                    ? Math.round(users.reduce((acc, u) => acc + u.ticketsCount, 0) / users.length)
                    : "N/A"}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder={
                  activeTab === "users"
                    ? "Buscar por nome, matrícula, email..."
                    : "Buscar por nome, setor, especialidade..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white"
              />
            </div>
            <Select>
              <SelectTrigger className="w-40 bg-neutral-800 border-neutral-600 text-white">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ti">TI</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="rh">RH</SelectItem>
                <SelectItem value="secretaria">Secretaria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users/Support List */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            {activeTab === "users" ? "LISTA DE USUÁRIOS" : "CONTATOS DE APOIO"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">NOME</th>
                  {activeTab === "users" && (
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      MATRÍCULA
                    </th>
                  )}
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">SETOR</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">CONTATO</th>
                  {activeTab === "users" ? (
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">TICKETS</th>
                  ) : (
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      ESPECIALIDADES
                    </th>
                  )}
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">STATUS</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === "users" ? filteredUsers : filteredSupport).map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors ${
                      index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                    }`}
                  >
                    <td className="py-3 px-4 text-sm text-white">{item.name}</td>
                    {activeTab === "users" && 'matricula' in item && (
                      <td className="py-3 px-4 text-sm text-white font-mono">{item.matricula}</td>
                    )}
                    <td className="py-3 px-4 text-sm text-white">{item.sector}</td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-neutral-300">
                          <Mail className="w-3 h-3" />
                          <span>{item.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-300">
                          <Phone className="w-3 h-3" />
                          <span>{item.phone}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 text-neutral-400 hover:text-orange-500"
                            onClick={() => window.open(`https://wa.me/${item.phone}`, "_blank")}
                          >
                            <Phone className="w-2 h-2" />
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {activeTab === "users" && 'ticketsCount' in item ? (
                        <div className="text-sm">
                          <div className="text-white font-mono">{item.ticketsCount}</div>
                          <div className="text-xs text-neutral-400">Último: {item.lastTicket}</div>
                        </div>
                      ) : 'specialties' in item ? (
                        <div className="flex flex-wrap gap-1">
                          {item.specialties.map((spec: string) => (
                            <Badge key={spec} className="bg-orange-500/20 text-orange-500 text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`${
                          item.status === "active" ? "bg-white/20 text-white" : "bg-neutral-500/20 text-neutral-300"
                        }`}
                      >
                        {item.status === "active" ? "ATIVO" : "INATIVO"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-400 hover:text-orange-500">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-400 hover:text-orange-500">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-white tracking-wider">
                {activeTab === "users" ? "NOVO USUÁRIO" : "NOVO CONTATO DE APOIO"}
              </CardTitle>
              <Button
                variant="ghost"
                onClick={() => setShowAddForm(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">NOME</label>
                  <Input placeholder="Nome completo..." className="bg-neutral-800 border-neutral-600 text-white" />
                </div>
                {activeTab === "users" && (
                  <div>
                    <label className="text-sm font-medium text-neutral-300 mb-2 block">MATRÍCULA</label>
                    <Input
                      placeholder="Número da matrícula..."
                      className="bg-neutral-800 border-neutral-600 text-white"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">SETOR</label>
                  <Select>
                    <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTab === "users" ? (
                        <>
                          <SelectItem value="ti">TI</SelectItem>
                          <SelectItem value="financeiro">Financeiro</SelectItem>
                          <SelectItem value="rh">RH</SelectItem>
                          <SelectItem value="administrativo">Administrativo</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="secretaria">Secretaria</SelectItem>
                          <SelectItem value="reitoria">Reitoria</SelectItem>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="terceiros">Terceiros</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">E-MAIL</label>
                  <Input
                    type="email"
                    placeholder="email@empresa.com"
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">TELEFONE</label>
                  <Input placeholder="5511999999999" className="bg-neutral-800 border-neutral-600 text-white" />
                </div>
                {activeTab === "users" && (
                  <div>
                    <label className="text-sm font-medium text-neutral-300 mb-2 block">DATA DE INGRESSO</label>
                    <Input type="date" className="bg-neutral-800 border-neutral-600 text-white" />
                  </div>
                )}
              </div>

              {activeTab === "support" && (
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">ESPECIALIDADES</label>
                  <Input
                    placeholder="Separadas por vírgula: Hardware, Software, Redes..."
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  {activeTab === "users" ? "Adicionar Usuário" : "Adicionar Contato"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6 space-y-6">
      {/* Header com Navegação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-blue-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">GERENCIAMENTO DE USUÁRIOS</h1>
            <p className="text-sm text-blue-200">Gerencie usuários e contatos de apoio</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-blue-200">
        <Home className="w-4 h-4" />
        <span>/</span>
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-white">Usuários</span>
      </div>

      {/* ... resto do código existente com cores azuis ... */}
      
      {/* Dialog para Criar/Editar Usuário */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-slate-900 border-blue-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Criar Novo Usuário</DialogTitle>
          </DialogHeader>
          {/* Formulário de criação */}
        </DialogContent>
      </Dialog>
    </div>
  )
}
