'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  matricula?: string;
  phone?: string;
  sector: string;
  admissionDate: string;
  status: string;
  ticketsCount: number;
  lastTicket?: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isAdminOrCoordinator =
    userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'COORDINATOR';
  const isRegularUser = userRole === 'USER';
  const router = useRouter();
  
  // Estados para dados reais
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Estados para modais
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
    matricula: '',
    telefone: '',
    password: '',
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedRole !== 'all') params.append('role', selectedRole);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      const response = await fetch(`/api/users?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data);
      } else {
        setError(result.error || 'Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedRole, selectedStatus]);

  // Carregar usuários quando a página carrega ou filtros mudam
  useEffect(() => {
    fetchUsers();
  }, [searchTerm, selectedRole, selectedStatus, fetchUsers]);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role || 'USER',
      matricula: user.matricula || '',
      telefone: user.phone || '',
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          fetchUsers(); // Recarregar lista
        } else {
          alert('Erro ao excluir usuário');
        }
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário');
      }
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsCreateDialogOpen(false);
        setFormData({
          name: '',
          email: '',
          role: 'USER',
          matricula: '',
          telefone: '',
          password: '',
        });
        fetchUsers(); // Recarregar lista
      } else {
        alert(result.error || 'Erro ao criar usuário');
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário');
    }
  };

  const handleUserActions = (user: User) => {
    console.log('Ações para usuário:', user);
    // Aqui você pode implementar um menu dropdown com mais ações
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // "users" or "support"

  // Dados de exemplo para contatos de suporte (mantidos como estão)
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

  // Filtrar usuários
  const filteredUsersList = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.matricula?.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.sector.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      selectedRole === 'all' ||
      user.role.toLowerCase() === selectedRole.toLowerCase();

    const matchesStatus =
      selectedStatus === 'all' ||
      user.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtrar contatos de suporte
  const filteredSupport = supportContacts.filter(contact => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      selectedRole === 'all' ||
      contact.sector.toLowerCase() === selectedRole.toLowerCase();

    return matchesSearch && matchesRole;
  });

  // Interface para usuários regulares (USER)
  if (isRegularUser) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Contatos de Suporte</h1>
              <p className="text-neutral-400">
                Encontre contatos de suporte técnico
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-slate-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, setor ou especialidade..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-neutral-600 text-white"
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48 bg-slate-800 border-neutral-600 text-white">
                  <SelectValue placeholder="Filtrar por setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Setores</SelectItem>
                  <SelectItem value="secretaria">Secretaria</SelectItem>
                  <SelectItem value="reitoria">Reitoria</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="terceiros">Terceiros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Contatos de Suporte */}
        <Card className="bg-slate-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white">Contatos de Suporte Técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      NOME
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      SETOR
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      CONTATO
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      ESPECIALIDADES
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSupport.map((contact, index) => (
                    <tr
                      key={contact.id}
                      className={`border-b border-neutral-800 hover:bg-slate-800 transition-colors ${
                        index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-850'
                      }`}
                    >
                      <td className="py-3 px-4 text-sm text-blue-200">
                        {contact.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-blue-200">
                        {contact.sector}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-blue-300">
                            <Mail className="w-3 h-3" />
                            <span>{contact.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-blue-300">
                            <Phone className="w-3 h-3" />
                            <span>{contact.phone}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-2 text-xs text-orange-500 hover:text-orange-400"
                              onClick={() => navigator.clipboard.writeText(contact.phone)}
                            >
                              Copiar
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {contact.specialties.map((spec: string) => (
                            <Badge
                              key={spec}
                              className="bg-orange-500/20 text-orange-500 text-xs"
                            >
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`${
                            contact.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {contact.status === 'active' ? 'ATIVO' : 'INATIVO'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interface para administradores e coordenadores
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Gestão de Usuários</h1>
            <p className="text-neutral-400">
              {activeTab === 'users'
                ? 'Gerenciar usuários do sistema'
                : 'Contatos de suporte técnico'}
            </p>
          </div>
        </div>
        {isAdminOrCoordinator && (
          <div className="flex gap-2">
            <Button
              onClick={() => setActiveTab('users')}
              variant={activeTab === 'users' ? 'default' : 'outline'}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </Button>
            <Button
              onClick={() => setActiveTab('support')}
              variant={activeTab === 'support' ? 'default' : 'outline'}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <User className="w-4 h-4 mr-2" />
              Suporte
            </Button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <Card className="bg-slate-800 border-neutral-700">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou matrícula..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-neutral-600 text-white"
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
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48 bg-slate-800 border-neutral-600 text-white">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card className="bg-slate-800 border-neutral-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              {activeTab === 'users' ? 'Usuários do Sistema' : 'Contatos de Suporte'}
            </CardTitle>
            {isAdminOrCoordinator && activeTab === 'users' && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Adicionar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-neutral-600">
                  <DialogHeader>
                    <DialogTitle className="text-white">Adicionar Novo Usuário</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Nome</Label>
                      <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="bg-slate-700 border-neutral-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="bg-slate-700 border-neutral-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={value => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger className="bg-slate-700 border-neutral-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">Usuário</SelectItem>
                          <SelectItem value="AGENT">Agente</SelectItem>
                          <SelectItem value="MANAGER">Gerente</SelectItem>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white">Matrícula</Label>
                      <Input
                        value={formData.matricula}
                        onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                        className="bg-slate-700 border-neutral-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Telefone</Label>
                      <Input
                        value={formData.telefone}
                        onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                        className="bg-slate-700 border-neutral-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Senha</Label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="bg-slate-700 border-neutral-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateUser} className="bg-blue-500 hover:bg-blue-600 text-white">
                      Criar Usuário
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="text-neutral-400 hover:text-white"
                    >
                      Cancelar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          )}
          {!loading && error && (
            <div className="text-center py-8 text-red-400">
              {error}
            </div>
          )}
          {!loading && !error && (
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
                      <>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                          TICKETS
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                          STATUS
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                          ESPECIALIDADES
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                          STATUS
                        </th>
                      </>
                    )}
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      AÇÕES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'users' ? filteredUsersList : filteredSupport).map(
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
                                Último: {item.lastTicket ? new Date(item.lastTicket).toLocaleDateString() : 'N/A'}
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
                              onClick={() => handleEditUser(item as User)}
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
                              onClick={() => handleUserActions(item as User)}
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
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      {isEditDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-neutral-600 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white">Editar Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-700 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-700 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Telefone</Label>
                  <Input
                    value={formData.telefone}
                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                    className="bg-slate-700 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Senha</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Nova senha (opcional)"
                    className="bg-slate-700 border-neutral-600 text-white"
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
