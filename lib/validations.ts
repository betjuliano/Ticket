import { z } from 'zod'

// ========================================
// VALIDAÇÕES DE TICKETS
// ========================================

// Schema para criação de ticket
export const createTicketSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(200, 'Título muito longo'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(2000, 'Descrição muito longa'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  category: z.string().min(1, 'Categoria é obrigatória').max(50, 'Categoria muito longa'),
  tags: z.array(z.string()).default([]),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  createdBy: z.string().min(1, 'Criador é obrigatório'),
})

// Schema para atualização de ticket
export const updateTicketSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_THIRD_PARTY', 'RESOLVED', 'CLOSED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.string().min(1).max(50).optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
})

// Schema para filtros de busca
export const ticketFiltersSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_THIRD_PARTY', 'RESOLVED', 'CLOSED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
  category: z.string().optional(),
  createdBy: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
})

// ========================================
// VALIDAÇÕES DE COMENTÁRIOS
// ========================================

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comentário não pode estar vazio').max(1000, 'Comentário muito longo'),
  ticketId: z.string().min(1, 'ID do ticket é obrigatório'),
  isInternal: z.boolean().default(false),
})

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
})

// ========================================
// VALIDAÇÕES DE ANEXOS
// ========================================

export const uploadFileSchema = z.object({
  ticketId: z.string().min(1, 'ID do ticket é obrigatório'),
  file: z.any(), // Será validado no middleware de upload
})

// ========================================
// VALIDAÇÕES DE USUÁRIOS
// ========================================

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'COORDINATOR', 'USER']),
  matricula: z.string().optional(),
  telefone: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const userCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'COORDINATOR', 'USER']).default('USER'),
  matricula: z.string().optional(),
  telefone: z.string().optional(),
})

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'COORDINATOR', 'USER']).optional(),
  matricula: z.string().optional(),
  telefone: z.string().optional(),
  isActive: z.boolean().optional(),
  preferences: z.record(z.any()).optional(),
})

// ========================================
// VALIDAÇÕES DE KNOWLEDGE BASE
// ========================================

export const createKnowledgeCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal').optional(),
  order: z.number().int().min(0).default(0),
})

export const updateKnowledgeCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

export const createKnowledgeArticleSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  excerpt: z.string().max(300).optional(),
  slug: z.string().min(1, 'Slug é obrigatório').max(200),
  tags: z.array(z.string()).default([]),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
})

export const updateKnowledgeArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(10).optional(),
  excerpt: z.string().max(300).optional(),
  slug: z.string().min(1).max(200).optional(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

export const rateArticleSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

// ========================================
// VALIDAÇÕES DE NOTIFICAÇÕES
// ========================================

export const createNotificationSchema = z.object({
  type: z.enum(['TICKET_CREATED', 'TICKET_UPDATED', 'TICKET_ASSIGNED', 'TICKET_COMMENTED', 'TICKET_RESOLVED', 'TICKET_CLOSED', 'SYSTEM_ANNOUNCEMENT', 'KNOWLEDGE_ARTICLE_PUBLISHED']),
  title: z.string().min(1, 'Título é obrigatório').max(100),
  message: z.string().min(1, 'Mensagem é obrigatória').max(500),
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  relatedId: z.string().optional(),
  data: z.record(z.any()).optional(),
})

export const markNotificationReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1, 'Pelo menos uma notificação deve ser marcada'),
})

// ========================================
// VALIDAÇÕES DE RELATÓRIOS
// ========================================

export const reportFiltersSchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  status: z.array(z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_THIRD_PARTY', 'RESOLVED', 'CLOSED', 'CANCELLED'])).optional(),
  priority: z.array(z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])).optional(),
  category: z.array(z.string()).optional(),
  assignedTo: z.array(z.string()).optional(),
  createdBy: z.array(z.string()).optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
})

// ========================================
// VALIDAÇÕES DE AUTENTICAÇÃO
// ========================================

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6),
  matricula: z.string().optional(),
  telefone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
})

// ========================================
// TIPOS TYPESCRIPT DERIVADOS
// ========================================

export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>
export type TicketFilters = z.infer<typeof ticketFiltersSchema>

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>

export type UserCreateInput = z.infer<typeof userCreateSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>

export type CreateKnowledgeCategoryInput = z.infer<typeof createKnowledgeCategorySchema>
export type UpdateKnowledgeCategoryInput = z.infer<typeof updateKnowledgeCategorySchema>
export type CreateKnowledgeArticleInput = z.infer<typeof createKnowledgeArticleSchema>
export type UpdateKnowledgeArticleInput = z.infer<typeof updateKnowledgeArticleSchema>
export type RateArticleInput = z.infer<typeof rateArticleSchema>

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>
export type ReportFilters = z.infer<typeof reportFiltersSchema>

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

