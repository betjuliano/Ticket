import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// Extend global type for Prisma client
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  __prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

// Middleware para logs de performance
prisma.$use(async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `🔍 Query ${params.model ?? 'Unknown'}.${params.action} took ${after - before}ms`
    );
  }

  return result;
});

// Middleware para sanitização de dados
prisma.$use(async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
  // Sanitizar inputs antes de salvar no banco
  if (params.action === 'create' || params.action === 'update') {
    if (params.args?.data && typeof params.args.data === 'object') {
      // Função para sanitizar strings recursivamente
      const sanitizeData = (data: Record<string, unknown>): Record<string, unknown> => {
        const sanitized: Record<string, unknown> = {};
        
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            // Remover caracteres perigosos de strings
            sanitized[key] = value
              .replace(/[<>]/g, '') // Remover < e >
              .trim();
          } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Recursivamente sanitizar objetos aninhados
            sanitized[key] = sanitizeData(value as Record<string, unknown>);
          } else {
            sanitized[key] = value;
          }
        }
        
        return sanitized;
      };

      params.args.data = sanitizeData(params.args.data as Record<string, unknown>);
    }
  }

  return next(params);
});

// Função helper para desconectar o Prisma
export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
};

// Função helper para verificar conexão
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Função helper para executar transações
export const executeTransaction = async <T>(
  fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> => {
  return prisma.$transaction(fn);
};

export default prisma;

