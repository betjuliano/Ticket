export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface TicketUser {
  id?: string
  name: string
  matricula?: string
  email: string
  phone?: string
  sector?: string
  admissionDate?: string
  avatar?: string
}

export interface TicketResponse {
  author: string
  message: string
  timestamp: string
  type?: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: string
  createdBy: string
  createdAt: string
  updatedAt: string
  assignedTo?: string
  user: TicketUser
  responses?: TicketResponse[]
}
