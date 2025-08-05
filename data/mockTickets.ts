import { Ticket } from '@/types/ticket';

export const mockTickets: Ticket[] = [
  {
    id: '1',
    title: 'Problema com impressora',
    description: 'A impressora da sala 101 não está funcionando corretamente. Preciso de assistência técnica.',
    status: 'OPEN',
    priority: 'HIGH',
    category: 'Hardware',
    tags: 'impressora,hardware,urgente',
    createdById: 'user1',
    createdAt: new Date('2025-01-20T10:00:00Z'),
    updatedAt: new Date('2025-01-20T10:00:00Z'),
    createdBy: {
      id: 'user1',
      name: 'João Silva',
      email: 'joao.silva@ufsm.edu.br',
      role: 'USER',
      matricula: '2021001',
      phone: '(55) 99999-9999',
      sector: 'Administração',
      admissionDate: '2021-03-15'
    }
  },
  {
    id: '2',
    title: 'Solicitação de software',
    description: 'Preciso instalar o software MATLAB na minha máquina para pesquisa.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    category: 'Software',
    tags: 'software,instalação,matlab',
    createdById: 'user2',
    assignedToId: 'tech1',
    createdAt: new Date('2025-01-19T14:30:00Z'),
    updatedAt: new Date('2025-01-20T09:15:00Z'),
    createdBy: {
      id: 'user2',
      name: 'Maria Santos',
      email: 'maria.santos@ufsm.edu.br',
      role: 'USER',
      matricula: '2021002',
      phone: '(55) 88888-8888',
      sector: 'Pesquisa',
      admissionDate: '2021-08-20'
    },
    assignedTo: {
      id: 'tech1',
      name: 'Carlos Tech',
      email: 'carlos.tech@ufsm.edu.br'
    }
  },
  {
    id: '3',
    title: 'Problema de rede',
    description: 'Não consigo acessar a internet no laboratório 3. Parece ser um problema de configuração de rede.',
    status: 'RESOLVED',
    priority: 'LOW',
    category: 'Rede',
    tags: 'rede,internet,laboratório',
    createdById: 'user3',
    assignedToId: 'tech2',
    createdAt: new Date('2025-01-18T09:00:00Z'),
    updatedAt: new Date('2025-01-19T16:30:00Z'),
    createdBy: {
      id: 'user3',
      name: 'Pedro Oliveira',
      email: 'pedro.oliveira@ufsm.edu.br',
      role: 'USER',
      matricula: '2021003',
      phone: '(55) 77777-7777',
      sector: 'Laboratórios',
      admissionDate: '2021-11-10'
    },
    assignedTo: {
      id: 'tech2',
      name: 'Ana Suporte',
      email: 'ana.suporte@ufsm.edu.br'
    }
  }
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
