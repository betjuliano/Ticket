import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createDocsCategorySchema } from '@/lib/validations';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

// GET /api/knowledge/categories - Listar categorias
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    const { searchParams } = new URL(request.url);
    const includeArticleCount =
      searchParams.get('includeArticleCount') === 'true';

    // Buscar categorias
    const categories = await prisma.docsCategory.findMany({
      orderBy: { name: 'asc' },
      include: includeArticleCount
        ? {
            _count: {
              select: {
                articles:
                  session.user.role === 'USER'
                    ? { where: { isPublished: true } }
                    : true,
              },
            },
          }
        : null,
    });

    // Formatar resposta
    const formattedCategories = categories.map((category: any) => ({
      ...category,
      articleCount: includeArticleCount ? category._count?.articles : undefined,
      _count: undefined,
    }));

    return createSuccessResponse(formattedCategories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}

// POST /api/knowledge/categories - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    // Apenas coordenadores e admins podem criar categorias
    if (session.user.role === 'USER') {
      return createErrorResponse('Sem permissão para criar categorias', 403);
    }

    const body = await request.json();

    // Validar dados
    const validationResult = createDocsCategorySchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(
        'Dados inválidos',
        400,
        validationResult.error.errors
      );
    }

    const { name, description } = validationResult.data;

    // Verificar se nome já existe
    const existingCategory = await prisma.docsCategory.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return createErrorResponse('Já existe uma categoria com este nome', 400);
    }

    // Criar categoria
    const category = await prisma.docsCategory.create({
      data: {
        name,
        description: description || null,
      },
    });

    return createSuccessResponse(category, 'Categoria criada com sucesso');
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}
