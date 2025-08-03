import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Middleware para logs
prisma.$use(async (params: any, next: any) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `Query ${params.model}.${params.action} took ${after - before}ms`
    );
  }

  return result;
});

// Middleware para sanitização de dados
prisma.$use(async (params: any, next: any) => {
  // Sanitizar inputs antes de salvar no banco
  if (params.action === 'create' || params.action === 'update') {
    if (params.args.data) {
      // Remover caracteres perigosos de strings
      Object.keys(params.args.data).forEach(key => {
        if (typeof params.args.data[key] === 'string') {
          params.args.data[key] = params.args.data[key]
            .replace(/[<>]/g, '') // Remover < e >
            .trim();
        }
      });
    }
  }

  return next(params);
});

export default prisma;
