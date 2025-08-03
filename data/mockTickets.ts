import { Ticket, TicketUser } from '@/types/ticket';

export const mockUsers: TicketUser[] = [
  {
    id: 'user1',
    name: 'João Silva',
    matricula: '12345',
    email: 'joao.silva@empresa.com',
    phone: '(11) 99999-9999',
    sector: 'TI',
    admissionDate: '2023-01-15',
    avatar: '/placeholder-user.jpg',
  },
  {
    id: 'user2',
    name: 'Maria Santos',
    matricula: '12346',
    email: 'maria.santos@empresa.com',
    phone: '(11) 88888-8888',
    sector: 'Financeiro',
    admissionDate: '2022-08-20',
  },
  {
    id: 'user3',
    name: 'Pedro Costa',
    matricula: '12347',
    email: 'pedro.costa@empresa.com',
    phone: '(11) 77777-7777',
    sector: 'RH',
    admissionDate: '2023-03-10',
  },
];

export const mockTickets: Ticket[] = [
  {
    id: '1',
    title: 'Sistema de login não funciona',
    description:
      'Usuários não conseguem fazer login no sistema desde esta manhã. O erro aparece após inserir as credenciais.',
    status: 'open',
    priority: 'high',
    category: 'Sistema',
    createdBy: 'user1',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
    user: mockUsers[0],
  },
  {
    id: '2',
    title: 'Lentidão na rede',
    description:
      'Rede corporativa está muito lenta, afetando o trabalho de toda a equipe.',
    status: 'in_progress',
    priority: 'medium',
    category: 'Rede',
    assignedTo: 'tech1',
    createdBy: 'user2',
    createdAt: '2025-01-19T14:30:00Z',
    updatedAt: '2025-01-20T09:15:00Z',
    user: mockUsers[1],
  },
  {
    id: '3',
    title: 'Impressora não funciona',
    description:
      'Impressora do setor financeiro não está imprimindo documentos.',
    status: 'resolved',
    priority: 'low',
    category: 'Hardware',
    assignedTo: 'tech2',
    createdBy: 'user3',
    createdAt: '2025-01-18T09:00:00Z',
    updatedAt: '2025-01-19T16:30:00Z',
    user: mockUsers[2],
  },
];

export const mockStats = {
  tickets: {
    total: 156,
    open: 23,
    inProgress: 18,
    resolved: 89,
    closed: 26,
    byPriority: {
      low: 45,
      medium: 67,
      high: 32,
      critical: 12,
    },
    byCategory: {
      Sistema: 45,
      Rede: 32,
      Hardware: 28,
      Software: 35,
      Segurança: 16,
    },
  },
  users: {
    total: 1247,
    active: 847,
    coordinators: 12,
  },
  performance: {
    avgResolutionTime: 4.2,
    satisfactionRate: 94.5,
    responseTime: 12,
  },
};
