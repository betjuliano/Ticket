import { z } from 'zod'

// Schema para criação de ticket
export const createTicketSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(200, 'Título muito longo'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(2000, 'Descrição muito longa'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  category: z.string().min(1, 'Categoria é obrigatória').max(50, 'Categoria muito longa'),
  assignedTo: z.string().optional(),
  createdBy: z.string().min(1, 'Criador é obrigatório'),
})

// Schema para atualização de ticket
export const updateTicketSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.string().min(1).max(50).optional(),
  assignedTo: z.string().optional(),
})

// Schema para filtros de busca
export const ticketFiltersSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedTo: z.string().optional(),
  category: z.string().optional(),
  createdBy: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
})

// Schema para usuário
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['user', 'coordinator', 'admin']),
  department: z.string().optional(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema para criação de usuário
export const userCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['user', 'coordinator', 'admin']),
  department: z.string().optional(),
  active: z.boolean().default(true),
  matricula: z.string().optional(),
  telefone: z.string().optional(),
})

// Schema para atualização de usuário
export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['user', 'coordinator', 'admin']).optional(),
  department: z.string().optional(),
  active: z.boolean().optional(),
  matricula: z.string().optional(),
  telefone: z.string().optional(),
})

// Schema para autenticação
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  confirmPassword: z.string(),
  department: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
})

// Schema para estatísticas do dashboard
export const dashboardStatsSchema = z.object({
  period: z.enum(['1d', '7d', '30d', '90d']).default('7d'),
})

// Schema para comentários
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório').max(1000, 'Conteúdo muito longo'),
  ticketId: z.string().min(1, 'ID do ticket é obrigatório'),
  isInternal: z.boolean().default(false)
})

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(1000).optional(),
  isInternal: z.boolean().optional()
})

// Schema para base de conhecimento
export const createKnowledgeSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(200, 'Título muito longo'),
  content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  category: z.string().min(1, 'Categoria é obrigatória').max(50, 'Categoria muito longa'),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false)
})

export const updateKnowledgeSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(10).optional(),
  category: z.string().min(1).max(50).optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional()
})

export const knowledgeFiltersSchema = z.object({
  category: z.string().optional(),
  published: z.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10)
})

// Schema para anexos
export const attachmentSchema = z.object({
  filename: z.string().min(1, 'Nome do arquivo é obrigatório'),
  originalName: z.string().min(1, 'Nome original é obrigatório'),
  mimeType: z.string().min(1, 'Tipo MIME é obrigatório'),
  size: z.number().min(1, 'Tamanho deve ser maior que 0'),
  ticketId: z.string().optional(),
  knowledgeId: z.string().optional()
})

// Filtros para usuários
export const userFiltersSchema = z.object({
  role: z.enum(['user', 'coordinator', 'admin']).optional(),
  department: z.string().optional(),
  active: z.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10)
})

// Tipos TypeScript derivados dos schemas
export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>
export type TicketFilters = z.infer<typeof ticketFiltersSchema>
export type User = z.infer<typeof userSchema>
export type CreateUserInput = z.infer<typeof userCreateSchema>
export type UpdateUserInput = z.infer<typeof userUpdateSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type DashboardStatsInput = z.infer<typeof dashboardStatsSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
export type CreateKnowledgeInput = z.infer<typeof createKnowledgeSchema>
export type UpdateKnowledgeInput = z.infer<typeof updateKnowledgeSchema>
export type KnowledgeFilters = z.infer<typeof knowledgeFiltersSchema>
export type AttachmentInput = z.infer<typeof attachmentSchema>
export type UserFilters = z.infer<typeof userFiltersSchema>

