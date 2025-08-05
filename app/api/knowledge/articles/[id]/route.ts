import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateDocsArticleSchema } from '@/lib/validations';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

// GET /api/knowledge/articles/[id] - Buscar artigo específico
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    const articleId = params.id;

    // Buscar por ID ou slug
    const article = await prisma.docsArticle.findFirst({
      where: {
        id: articleId,
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

    if (!article) {
      return createErrorResponse('Artigo não encontrado', 404);
    }

    // Usuários comuns só podem ver artigos publicados
    if (session.user.role === 'USER' && !article.isPublished) {
      return createErrorResponse('Artigo não encontrado', 404);
    }

    // Incrementar contador de visualizações
    await prisma.docsArticle.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });

    return createSuccessResponse({
      ...article,
      viewCount: article.viewCount + 1,
    });
  } catch (error) {
    console.error('Erro ao buscar artigo:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}

// PUT /api/knowledge/articles/[id] - Atualizar artigo
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    // Apenas coordenadores e admins podem editar artigos
    if (session.user.role === 'USER') {
      return createErrorResponse('Sem permissão para editar artigos', 403);
    }

    const articleId = params.id;
    const body = await request.json();

    // Validar dados
    const validationResult = updateDocsArticleSchema.safeParse(body);
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
      isPublished,
      isFeatured,
      excerpt,
    } = validationResult.data;

    // Buscar artigo
    const existingArticle = await prisma.docsArticle.findUnique({
      where: { id: articleId },
    });

    if (!existingArticle) {
      return createErrorResponse('Artigo não encontrado', 404);
    }

    // Remover lógica de slug já que não existe no modelo
    // let slug = existingArticle.slug;
    // if (title && title !== existingArticle.title) {
    //   slug = title
    //     .toLowerCase()
    //     .replace(/[^a-z0-9\s-]/g, '')
    //     .replace(/\s+/g, '-')
    //     .replace(/-+/g, '-')
    //     .trim();

    //   // Verificar se slug já existe
    //   let counter = 1;
    //   const originalSlug = slug;
    //   while (
    //     await prisma.docsArticle.findFirst({
    //       where: {
    //         slug,
    //         id: { not: articleId },
    //       },
    //     })
    //   ) {
    //     slug = `${originalSlug}-${counter}`;
    //     counter++;
    //   }
    // }

    // Atualizar artigo
    const article = await prisma.docsArticle.update({
      where: { id: articleId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(categoryId && { categoryId }),
        updatedAt: new Date(),
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

    return createSuccessResponse(article, 'Artigo atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar artigo:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}

// DELETE /api/knowledge/articles/[id] - Deletar artigo
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    // Apenas coordenadores e admins podem deletar artigos
    if (session.user.role === 'USER') {
      return createErrorResponse('Sem permissão para deletar artigos', 403);
    }

    const articleId = params.id;

    // Buscar artigo
    const article = await prisma.docsArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return createErrorResponse('Artigo não encontrado', 404);
    }

    // Deletar artigo
    await prisma.docsArticle.delete({
      where: { id: articleId },
    });

    return createSuccessResponse(null, 'Artigo deletado com sucesso');
  } catch (error) {
    console.error('Erro ao deletar artigo:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}
