import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createKnowledgeArticleSchema } from '@/lib/validations';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

// GET /api/knowledge/articles - Listar artigos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const published = searchParams.get('published');

    // Construir filtros
    const where: any = {};

    // Usuários comuns só veem artigos publicados
    if (session.user.role === 'USER') {
      where.published = true;
    } else if (published !== null && published !== '') {
      where.published = published === 'true';
    }

    // Filtro por categoria
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filtro de busca
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    // Buscar artigos com paginação
    const [articles, total] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where,
        include: {
          category: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.knowledgeArticle.count({ where }),
    ]);

    return createSuccessResponse(articles, undefined, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao buscar artigos:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}

// POST /api/knowledge/articles - Criar novo artigo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    // Apenas coordenadores e admins podem criar artigos
    if (session.user.role === 'USER') {
      return createErrorResponse('Sem permissão para criar artigos', 403);
    }

    const body = await request.json();

    // Validar dados
    const validationResult = createKnowledgeArticleSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(
        'Dados inválidos',
        400,
        validationResult.error.errors
      );
    }

    const {
      title,
      content,
      categoryId,
      tags,
      published,
      featured,
      metaDescription,
    } = validationResult.data;

    // Verificar se categoria existe
    const category = await prisma.knowledgeCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return createErrorResponse('Categoria não encontrada', 404);
    }

    // Gerar slug único
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;

    while (await prisma.knowledgeArticle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Criar artigo
    const article = await prisma.knowledgeArticle.create({
      data: {
        title,
        slug,
        content,
        categoryId,
        authorId: session.user.id,
        tags: tags || [],
        published: published || false,
        featured: featured || false,
        metaDescription,
        viewCount: 0,
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return createSuccessResponse(article, 'Artigo criado com sucesso', 201);
  } catch (error) {
    console.error('Erro ao criar artigo:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}
