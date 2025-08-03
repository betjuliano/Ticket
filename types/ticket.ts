export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_USER'
  | 'WAITING_FOR_THIRD_PARTY'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TicketUser {
  id?: string;
  name: string;
  matricula?: string;
  email: string;
  phone?: string;
  sector?: string;
  admissionDate?: string;
  avatar?: string;
}

export interface TicketResponse {
  author: string;
  message: string;
  timestamp: string;
  type?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  tags: string;
  createdById: string;
  assignedToId?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;

  // Relacionamentos (quando incluídos)
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface Comment {
  id: string;
  content: string;
  ticketId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relacionamentos (quando incluídos)
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Attachment {
  id: string;
  filename: string;
  filepath: string;
  filesize: number;
  mimetype: string;
  ticketId: string;
  userId: string;
  createdAt: Date;

  // Relacionamentos (quando incluídos)
  user?: {
    id: string;
    name: string;
    email: string;
  };
}
