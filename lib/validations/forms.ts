import { z } from 'zod';

/**
 * Sistema de Validação Robusto para Formulários
 * 
 * Este módulo centraliza todas as validações de formulários do sistema,
 * garantindo consistência e tratamento de erros padronizado.
 * 
 * Características:
 * - Validação com Zod para type safety
 * - Mensagens de erro em português
 * - Sanitização de dados
 * - Validação em tempo real
 * - Tratamento de erros específicos
 */

// ========================================
// VALIDAÇÕES DE TICKETS
// ========================================

/**
 * Schema para criação de tickets com validação robusta
 * 
 * Inclui validações para:
 * - Título: mínimo 5, máximo 200 caracteres
 * - Descrição: mínimo 10, máximo 2000 caracteres
 * - Prioridade: valores permitidos
 * - Categoria: obrigatória
 * - Tags: array opcional
 * - Datas: formato ISO válido
 */
export const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título muito longo (máximo 200 caracteres)')
    .trim()
    .refine((val) => !/^\s*$/.test(val), 'Título não pode ser apenas espaços'),
  
  description: z
    .string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(2000, 'Descrição muito longa (máximo 2000 caracteres)')
    .trim()
    .refine((val) => !/^\s*$/.test(val), 'Descrição não pode ser apenas espaços'),
  
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
      errorMap: () => ({ message: 'Prioridade deve ser: Baixa, Média, Alta ou Urgente' })
    })
    .default('MEDIUM'),
  
  category: z
    .string()
    .min(1, 'Categoria é obrigatória')
    .max(50, 'Categoria muito longa (máximo 50 caracteres)')
    .trim(),
  
  tags: z
    .array(z.string().min(1).max(20))
    .max(10, 'Máximo 10 tags permitidas')
    .default([]),
  
  estimatedHours: z
    .number()
    .positive('Horas estimadas devem ser positivas')
    .max(1000, 'Horas estimadas muito altas')
    .optional(),
  
  dueDate: z
    .string()
    .datetime('Data de vencimento deve estar no formato ISO')
    .refine((val) => new Date(val) > new Date(), 'Data de vencimento deve ser futura')
    .optional(),
  
  assignedToId: z
    .string()
    .cuid('ID do usuário deve ser válido')
    .optional(),
  
  createdBy: z
    .string()
    .cuid('ID do criador deve ser válido')
    .min(1, 'Criador é obrigatório'),
});

/**
 * Schema para atualização de tickets
 * 
 * Permite atualização parcial com validações específicas
 */
export const updateTicketSchema = z.object({
  title: z
    .string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título muito longo')
    .trim()
    .optional(),
  
  description: z
    .string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(2000, 'Descrição muito longa')
    .trim()
    .optional(),
  
  status: z
    .enum([
      'OPEN',
      'IN_PROGRESS', 
      'WAITING_FOR_USER',
      'WAITING_FOR_THIRD_PARTY',
      'RESOLVED',
      'CLOSED',
      'CANCELLED'
    ], {
      errorMap: () => ({ message: 'Status inválido' })
    })
    .optional(),
  
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .optional(),
  
  category: z
    .string()
    .min(1, 'Categoria é obrigatória')
    .max(50, 'Categoria muito longa')
    .trim()
    .optional(),
  
  tags: z
    .array(z.string().min(1).max(20))
    .max(10, 'Máximo 10 tags permitidas')
    .optional(),
  
  estimatedHours: z
    .number()
    .positive('Horas estimadas devem ser positivas')
    .max(1000, 'Horas estimadas muito altas')
    .optional(),
  
  actualHours: z
    .number()
    .positive('Horas reais devem ser positivas')
    .max(1000, 'Horas reais muito altas')
    .optional(),
  
  dueDate: z
    .string()
    .datetime('Data de vencimento deve estar no formato ISO')
    .optional(),
  
  assignedToId: z
    .string()
    .cuid('ID do usuário deve ser válido')
    .optional(),
});

// ========================================
// VALIDAÇÕES DE NOTIFICAÇÕES
// ========================================

export const createNotificationSchema = z.object({
  type: z.string().min(1, 'Tipo é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  message: z.string().min(1, 'Mensagem é obrigatória').max(1000, 'Mensagem muito longa'),
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  metadata: z.record(z.any()).optional(),
});

export const markNotificationReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1, 'Pelo menos uma notificação deve ser marcada'),
});

// ========================================
// VALIDAÇÕES DE DOCUMENTAÇÃO
// ========================================

export const createDocsCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
});

export const updateDocsCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  description: z.string().max(500, 'Descrição muito longa').optional(),
});

export const createDocsArticleSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  isPublished: z.boolean().default(false),
});

export const updateDocsArticleSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo').optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório').optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória').optional(),
  isPublished: z.boolean().optional(),
});

export const rateArticleSchema = z.object({
  rating: z.number().min(1, 'Avaliação deve ser entre 1 e 5').max(5, 'Avaliação deve ser entre 1 e 5'),
  comment: z.string().max(500, 'Comentário muito longo').optional(),
});

// ========================================
// VALIDAÇÕES DE USUÁRIOS
// ========================================

export const userCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').trim(),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'COORDINATOR', 'USER']).default('USER'),
  matricula: z.string().optional(),
  telefone: z.string().optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'COORDINATOR', 'USER']).optional(),
  matricula: z.string().optional(),
  telefone: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ========================================
// VALIDAÇÕES DE SENHAS
// ========================================

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

// ========================================
// VALIDAÇÕES DE RELATÓRIOS
// ========================================

export const reportFiltersSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  category: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assignedTo: z.string().optional(),
});

// ========================================
// VALIDAÇÕES DE UPLOAD
// ========================================

export const uploadSchema = z.object({
  ticketId: z.string().min(1, 'ID do ticket é obrigatório'),
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
});

// ========================================
// VALIDAÇÕES DE COMENTÁRIOS
// ========================================

/**
 * Schema para criação de comentários
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comentário não pode estar vazio')
    .max(1000, 'Comentário muito longo (máximo 1000 caracteres)')
    .trim()
    .refine((val) => !/^\s*$/.test(val), 'Comentário não pode ser apenas espaços'),
  
  ticketId: z
    .string()
    .cuid('ID do ticket deve ser válido')
    .min(1, 'ID do ticket é obrigatório'),
  
  isInternal: z
    .boolean()
    .default(false),
});

/**
 * Schema para atualização de comentários
 */
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comentário não pode estar vazio')
    .max(1000, 'Comentário muito longo')
    .trim()
    .refine((val) => !/^\s*$/.test(val), 'Comentário não pode ser apenas espaços'),
});

// ========================================
// VALIDAÇÕES DE FILTROS
// ========================================

/**
 * Schema para filtros de tickets
 */
export const ticketFiltersSchema = z.object({
  search: z
    .string()
    .max(100, 'Termo de busca muito longo')
    .optional(),
  
  status: z
    .enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_THIRD_PARTY', 'RESOLVED', 'CLOSED', 'CANCELLED', 'all'])
    .optional(),
  
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'all'])
    .optional(),
  
  category: z
    .string()
    .max(50, 'Categoria muito longa')
    .optional(),
  
  assignedTo: z
    .string()
    .cuid('ID do usuário deve ser válido')
    .optional(),
  
  createdBy: z
    .string()
    .cuid('ID do criador deve ser válido')
    .optional(),
  
  dateFrom: z
    .string()
    .datetime('Data inicial deve estar no formato ISO')
    .optional(),
  
  dateTo: z
    .string()
    .datetime('Data final deve estar no formato ISO')
    .optional(),
  
  page: z
    .coerce.number()
    .int('Página deve ser um número inteiro')
    .min(1, 'Página deve ser maior que 0')
    .default(1),
  
  limit: z
    .coerce.number()
    .int('Limite deve ser um número inteiro')
    .min(1, 'Limite deve ser maior que 0')
    .max(100, 'Limite máximo é 100')
    .default(10),
});

// ========================================
// VALIDAÇÕES DE AUTENTICAÇÃO
// ========================================

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(1, 'Senha é obrigatória'),
  rememberMe: z.boolean().default(false),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').trim(),
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha muito longa'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  matricula: z.string().optional(),
  telefone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha muito longa'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').trim(),
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha muito longa'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  role: z.enum(['ADMIN', 'COORDINATOR', 'USER']).default('USER'),
  matricula: z.string().optional(),
  telefone: z.string().optional(),
  isActive: z.boolean().default(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').trim().optional(),
  email: z.string().email('Email inválido').toLowerCase().trim().optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha muito longa').optional(),
  role: z.enum(['ADMIN', 'COORDINATOR', 'USER']).optional(),
  matricula: z.string().optional(),
  telefone: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Função para sanitizar dados de entrada
 * Remove caracteres perigosos e normaliza strings
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
}

/**
 * Função para validar e sanitizar dados
 * Combina validação Zod com sanitização
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    // Sanitizar strings se for um objeto
    if (typeof data === 'object' && data !== null) {
      const sanitizedData = sanitizeObject(data as Record<string, any>);
      const result = schema.parse(sanitizedData);
      return { success: true, data: result };
    } else {
      const result = schema.parse(data);
      return { success: true, data: result };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message);
      return { success: false, errors };
    }
    return { success: false, errors: ['Erro de validação desconhecido'] };
  }
}

/**
 * Função para sanitizar objeto recursivamente
 */
function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Função para formatar erros de validação
 * Converte erros Zod em mensagens amigáveis
 */
export function formatValidationErrors(errors: z.ZodError['errors']): string[] {
  return errors.map(error => {
    const field = error.path.join('.');
    return `${field}: ${error.message}`;
  });
}

// ========================================
// TIPOS EXPORTADOS
// ========================================

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type TicketFilters = z.infer<typeof ticketFiltersSchema>; 