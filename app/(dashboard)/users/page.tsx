'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  Home,
} from 'lucide-react';

export default function UsersPage() {
  const { data: session } = useSession();
  const userRole =
    session?.user?.role === 'COORDINATOR' || session?.user?.role === 'ADMIN'
      ? 'coordinator'
      : 'user';
  const isAdminOrCoordinator =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'COORDINATOR';
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
    matricula: '',
    telefone: '',
  });

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role || 'USER',
      matricula: user.matricula || '',
      telefone: user.phone,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      console.log('Deletando usuário:', userId);
      // Aqui você implementaria a lógica de exclusão
    }
  };

  const handleUserActions = (user: any) => {
    console.log('Ações para usuário:', user);
    // Aqui você pode implementar um menu dropdown com mais ações
  };
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // "users" or "support"

  const users = [
    {
      id: 'USR-001',
      name: 'João Silva',
      matricula: '12345',
      email: 'joao.silva@instituicao.edu.br',
      phone: '5511999999999',
      sector: 'Aluno',
      admissionDate: '2020-03-15',
      status: 'active',
      ticketsCount: 15,
      lastTicket: '2025-06-17',
    },
    {
      id: 'USR-002',
      name: 'Maria Santos',
      matricula: '67890',
      email: 'maria.santos@instituicao.edu.br',
      phone: '5511888888888',
      sector: 'Docente',
      admissionDate: '2019-08-22',
      status: 'active',
      ticketsCount: 8,
      lastTicket: '2025-06-16',
    },
    {
      id: 'USR-003',
      name: 'Pedro Costa',
      matricula: '54321',
      email: 'pedro.costa@instituicao.edu.br',
      phone: '5511777777777',
      sector: 'Secretaria',
      admissionDate: '2021-01-10',
      status: 'inactive',
      ticketsCount: 3,
      lastTicket: '2025-05-20',
    },
    {
      id: 'USR-004',
      name: 'Ana Oliveira',
      matricula: '98765',
      email: 'ana.oliveira@empresa.com.br',
      phone: '5511666666666',
      sector: 'Empresa',
      admissionDate: '2022-05-10',
      status: 'active',
      ticketsCount: 12,
      lastTicket: '2025-06-15',
    },
    {
      id: 'USR-005',
      name: 'Carlos Mendes',
      matricula: '13579',
      email: 'carlos.mendes@gmail.com',
      phone: '5511555555555',
      sector: 'Egresso',
      admissionDate: '2018-02-20',
      status: 'active',
      ticketsCount: 5,
      lastTicket: '2025-06-10',
    },
    {
      id: 'USR-006',
      name: 'Roberto Lima',
      matricula: '24680',
      email: 'roberto.lima@outros.com',
      phone: '5511444444444',
      sector: 'Outros',
      admissionDate: '2023-01-15',
      status: 'active',
      ticketsCount: 2,
      lastTicket: '2025-06-05',
    },
  ];

  const supportContacts = [
    {
      id: 'SUP-001',
      name: 'Ana Oliveira',
      sector: 'Secretaria',
      email: 'ana.oliveira@empresa.com',
      phone: '5511666666666',
      specialties: ['Documentos', 'Processos'],
      status: 'active',
    },
    {
      id: 'SUP-002',
      name: 'Carlos Mendes',
      sector: 'Reitoria',
      email: 'carlos.mendes@empresa.com',
      phone: '5511555555555',
      specialties: ['Decisões', 'Políticas'],
      status: 'active',
    },
    {
      id: 'SUP-003',
      name: 'Prof. Roberto Lima',
      sector: 'Professor',
      email: 'roberto.lima@empresa.com',
      phone: '5511444444444',
      specialties: ['Acadêmico', 'Pesquisa'],
      status: 'active',
    },
    {
      id: 'SUP-004',
      name: 'TechSupport Ltda',
      sector: 'Terceiros',
      email: 'contato@techsupport.com',
      phone: '5511333333333',
      specialties: ['Hardware', 'Infraestrutura'],
      status: 'active',
    },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.matricula.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.sector.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      selectedRole === 'all' ||
      user.sector.toLowerCase() === selectedRole.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const filteredSupport = supportContacts.filter(
    contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.specialties.some(spec =>
        spec.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  if (userRole === 'user') {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">ACESSO RESTRITO</h2>
          <p className="text-neutral-400">
            Esta seção é disponível apenas para coordenadores
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6 space-y-6">
      {/* Header com Navegação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-blue-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">
              GERENCIAMENTO DE USUÁRIOS
            </h1>
            <p className="text-sm text-blue-200">
              Gerencie usuários e contatos de apoio
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar {activeTab === 'users' ? 'Usuário' : 'Contato'}
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
          onClick={() => setActiveTab('users')}
          className={
            activeTab === 'users'
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'text-neutral-400 hover:text-white'
          }
          variant={activeTab === 'users' ? 'default' : 'ghost'}
        >
          <User className="w-4 h-4 mr-2" />
          Usuários
        </Button>
        <Button
          onClick={() => setActiveTab('support')}
          className={
            activeTab === 'support'
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'text-neutral-400 hover:text-white'
          }
          variant={activeTab === 'support' ? 'default' : 'ghost'}
        >
          <Users className="w-4 h-4 mr-2" />
          Contatos de Apoio
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  USUÁRIOS ATIVOS
                </p>
                <p className="text-2xl font-bold text-white font-mono">
                  {activeTab === 'users'
                    ? users.filter(u => u.status === 'active').length
                    : supportContacts.filter(s => s.status === 'active').length}
                </p>
              </div>
              <User className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {activeTab === 'users'
                    ? users.length
                    : supportContacts.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  SETORES
                </p>
                <p className="text-2xl font-bold text-white font-mono">
                  {activeTab === 'users'
                    ? new Set(users.map(u => u.sector)).size
                    : new Set(supportContacts.map(s => s.sector)).size}
                </p>
              </div>
              <Building className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  TICKETS MÉDIO
                </p>
                <p className="text-2xl font-bold text-orange-500 font-mono">
                  {activeTab === 'users'
                    ? Math.round(
                        users.reduce((acc, u) => acc + u.ticketsCount, 0) /
                          users.length
                      )
                    : 'N/A'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-slate-900 border-neutral-700">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                placeholder={
                  activeTab === 'users'
                    ? 'Buscar por nome, matrícula, email...'
                    : 'Buscar por nome, setor, especialidade...'
                }
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-neutral-600 text-white"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48 bg-slate-800 border-neutral-600 text-white">
                <SelectValue placeholder="Filtrar por setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="aluno">Aluno</SelectItem>
                <SelectItem value="docente">Docente</SelectItem>
                <SelectItem value="secretaria">Secretaria</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
                <SelectItem value="egresso">Egresso</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            {activeTab === 'users' ? 'LISTA DE USUÁRIOS' : 'CONTATOS DE APOIO'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    NOME
                  </th>
                  {activeTab === 'users' && (
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      MATRÍCULA
                    </th>
                  )}
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    SETOR
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    CONTATO
                  </th>
                  {activeTab === 'users' ? (
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      TICKETS
                    </th>
                  ) : (
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      ESPECIALIDADES
                    </th>
                  )}
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    STATUS
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    AÇÕES
                  </th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'users' ? filteredUsers : filteredSupport).map(
                  (item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-neutral-800 hover:bg-slate-800 transition-colors ${
                        index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-850'
                      }`}
                    >
                      <td className="py-3 px-4 text-sm text-blue-200">
                        {item.name}
                      </td>
                      {activeTab === 'users' && 'matricula' in item && (
                        <td className="py-3 px-4 text-sm text-blue-300 font-mono">
                          {item.matricula}
                        </td>
                      )}
                      <td className="py-3 px-4 text-sm text-blue-200">
                        {item.sector}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-blue-300">
                            <Mail className="w-3 h-3" />
                            <span>{item.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-blue-300">
                            <Phone className="w-3 h-3" />
                            <span>{item.phone}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-2 text-xs text-orange-500 hover:text-orange-400"
                            >
                              Copiar
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {activeTab === 'users' && 'ticketsCount' in item ? (
                          <div className="text-sm">
                            <div className="text-blue-200 font-mono">
                              {item.ticketsCount}
                            </div>
                            <div className="text-xs text-blue-400">
                              Último: {item.lastTicket}
                            </div>
                          </div>
                        ) : 'specialties' in item ? (
                          <div className="flex flex-wrap gap-1">
                            {item.specialties.map((spec: string) => (
                              <Badge
                                key={spec}
                                className="bg-orange-500/20 text-orange-500 text-xs"
                              >
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`${
                            item.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {item.status === 'active' ? 'ATIVO' : 'INATIVO'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-neutral-400 hover:text-orange-500"
                            onClick={() => handleEditUser(item)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-neutral-400 hover:text-red-500"
                            onClick={() => handleDeleteUser(item.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-neutral-400 hover:text-orange-500"
                            onClick={() => handleUserActions(item)}
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Adicionar */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-white tracking-wider">
                ADICIONAR{' '}
                {activeTab === 'users' ? 'USUÁRIO' : 'CONTATO DE APOIO'}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddForm(false)}
                className="text-neutral-400 hover:text-white"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">
                    NOME
                  </label>
                  <Input
                    placeholder="Nome completo..."
                    className="bg-slate-800 border-neutral-600 text-white"
                  />
                </div>
                {activeTab === 'users' && (
                  <div>
                    <label className="text-sm font-medium text-neutral-300 mb-2 block">
                      MATRÍCULA
                    </label>
                    <Input
                      placeholder="Número da matrícula..."
                      className="bg-slate-800 border-neutral-600 text-white"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">
                    SETOR
                  </label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-neutral-600 text-white">
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTab === 'users' ? (
                        <>
                          <SelectItem value="aluno">Aluno</SelectItem>
                          <SelectItem value="docente">Docente</SelectItem>
                          <SelectItem value="secretaria">Secretaria</SelectItem>
                          <SelectItem value="empresa">Empresa</SelectItem>
                          <SelectItem value="egresso">Egresso</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
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
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">
                    E-MAIL
                  </label>
                  <Input
                    type="email"
                    placeholder="email@empresa.com"
                    className="bg-slate-800 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">
                    TELEFONE
                  </label>
                  <Input
                    placeholder="(11) 99999-9999"
                    className="bg-slate-800 border-neutral-600 text-white"
                  />
                </div>
                {activeTab === 'users' && (
                  <div>
                    <label className="text-sm font-medium text-neutral-300 mb-2 block">
                      DATA DE INGRESSO
                    </label>
                    <Input
                      type="date"
                      className="bg-slate-800 border-neutral-600 text-white"
                    />
                  </div>
                )}
              </div>
              {activeTab === 'support' && (
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">
                    ESPECIALIDADES
                  </label>
                  <Input
                    placeholder="Separadas por vírgula: Hardware, Software, Redes..."
                    className="bg-slate-800 border-neutral-600 text-white"
                  />
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar {activeTab === 'users' ? 'Usuário' : 'Contato'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Edição */}
      {isEditDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-white tracking-wider">
                EDITAR {activeTab === 'users' ? 'USUÁRIO' : 'CONTATO DE APOIO'}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditDialogOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">
                    NOME
                  </label>
                  <Input
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nome completo..."
                    className="bg-slate-800 border-neutral-600 text-white"
                  />
                </div>
                {activeTab === 'users' && (
                  <div>
                    <label className="text-sm font-medium text-neutral-300 mb-2 block">
                      MATRÍCULA
                    </label>
                    <Input
                      value={formData.matricula}
                      onChange={e =>
                        setFormData({ ...formData, matricula: e.target.value })
                      }
                      placeholder="Número da matrícula..."
                      className="bg-slate-800 border-neutral-600 text-white"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">
                    SETOR
                  </label>
                  <Select
                    value={selectedUser.sector}
                    onValueChange={value =>
                      setSelectedUser({ ...selectedUser, sector: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-neutral-600 text-white">
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTab === 'users' ? (
                        <>
                          <SelectItem value="Aluno">Aluno</SelectItem>
                          <SelectItem value="Docente">Docente</SelectItem>
                          <SelectItem value="Secretaria">Secretaria</SelectItem>
                          <SelectItem value="Empresa">Empresa</SelectItem>
                          <SelectItem value="Egresso">Egresso</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
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
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">
                    E-MAIL
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@empresa.com"
                    className="bg-slate-800 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">
                    TELEFONE
                  </label>
                  <Input
                    value={formData.telefone}
                    onChange={e =>
                      setFormData({ ...formData, telefone: e.target.value })
                    }
                    placeholder="(11) 99999-9999"
                    className="bg-slate-800 border-neutral-600 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Edit className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
