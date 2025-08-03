// Tipos para os componentes
export interface Agent {
  id: string;
  name: string;
  status: string;
  location: string;
  lastSeen: string;
  missions: number;
  risk: string;
}

export interface IntelligenceReport {
  id: string;
  title: string;
  classification: string;
  source: string;
  location: string;
  date: string;
  status: string;
  threat: string;
  summary: string;
  tags: string[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  uploadDate: string;
  fileType: string;
  size: string;
  tags: string[];
  content: string;
}

export interface AIMessage {
  type: string;
  content: string;
  timestamp: string;
  sources?: string[];
}

export interface Operation {
  id: string;
  name: string;
  status: string;
  priority: string;
  location: string;
  agents: number;
  progress: number;
  startDate: string;
  estimatedCompletion: string;
  description: string;
  objectives: string[];
}

// Extensão dos tipos do NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }

  interface User {
    id: string;
    role?: string;
  }
}

// Adicionar interfaces para Users
export interface UserEmployee {
  id: string;
  name: string;
  matricula: string;
  email: string;
  phone: string;
  sector: string;
  admissionDate: string;
  status: string;
  ticketsCount: number;
  lastTicket: string;
}

export interface UserSupport {
  id: string;
  name: string;
  sector: string;
  email: string;
  phone: string;
  specialties: string[];
  status: string;
}
