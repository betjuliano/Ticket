import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Tipos para respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Função para criar respostas de sucesso
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: ApiResponse['meta']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message: message || '',
    meta,
  } as ApiResponse<T>);
}

// Função para criar respostas de erro
export function createErrorResponse(
  error: string,
  status: number = 400,
  validationErrors?: any[]
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      validationErrors,
    },
    { status }
  );
}

// Função para tratar erros de validação do Zod
export function handleValidationError(
  error: ZodError
): NextResponse<ApiResponse> {
  const errorMessages = error.errors
    .map(err => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    })
    .join(', ');

  return createErrorResponse(`Erro de validação: ${errorMessages}`, 400);
}

// Função para tratar erros gerais
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('Erro na API:', error);

  if (error instanceof ZodError) {
    return handleValidationError(error);
  }

  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }

  return createErrorResponse('Erro interno do servidor', 500);
}

// Middleware para logging de requisições
export function logRequest(method: string, url: string, body?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${url}`, body ? { body } : '');
}

// Função para validar autenticação (mock)
export function validateAuth(request: Request): {
  isValid: boolean;
  user?: any;
} {
  // Em produção, implementar validação real de JWT/session
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false };
  }

  // Mock de usuário autenticado
  return {
    isValid: true,
    user: {
      id: 'user1',
      email: 'user@example.com',
      role: 'coordinator',
      name: 'Usuário Teste',
    },
  };
}

// Função para validar permissões
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    user: 1,
    coordinator: 2,
    admin: 3,
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel =
    roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
}

// Função para sanitizar dados de entrada
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

// Função para paginação
export function paginate<T>(
  items: T[],
  page: number = 1,
  limit: number = 10
): {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} {
  const offset = (page - 1) * limit;
  const paginatedItems = items.slice(offset, offset + limit);

  return {
    data: paginatedItems,
    meta: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
    },
  };
}

// Função para gerar IDs únicos (em produção, usar UUID)
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Função para formatar datas
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}
