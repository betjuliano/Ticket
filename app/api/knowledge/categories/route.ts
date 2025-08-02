import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createKnowledgeCategorySchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils'

// GET /api/knowledge/categories - Listar categorias
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401)
    }

    const { searchParams } = new URL(request.url)
    const includeArticleCount = searchParams.get('includeArticleCount') === 'true'

    // Buscar categorias
    const categories = await prisma.knowledgeCategory.findMany({
      orderBy: { order: 'asc' },
      include: includeArticleCount ? {
        _count: {
          select: {
            articles: session.user.role === 'USER' 
              ? { where: { published: true } }
              : true
          }
        }
      } : undefined
    })

    // Formatar resposta
    const formattedCategories = categories.map(category => ({
      ...category,
      articleCount: includeArticleCount ? category._count?.articles : undefined,
      _count: undefined
    }))

    return createSuccessResponse(formattedCategories)

  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return createErrorResponse('Erro interno do servidor', 500)
  }
}

// POST /api/knowledge/categories - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401)
    }

    // Apenas coordenadores e admins podem criar categorias
    if (session.user.role === 'USER') {
      return createErrorResponse('Sem permissão para criar categorias', 403)
    }

    const body = await request.json()

    // Validar dados
    const validationResult = createKnowledgeCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return createErrorResponse('Dados inválidos', 400, validationResult.error.errors)
    }

    const { name, description, icon, color, order } = validationResult.data

    // Verificar se nome já existe
    const existingCategory = await prisma.knowledgeCategory.findUnique({
      where: { name }
    })

    if (existingCategory) {
      return createErrorResponse('Já existe uma categoria com este nome', 400)
    }

    // Determinar ordem se não fornecida
    let finalOrder = order
    if (!finalOrder) {
      const lastCategory = await prisma.knowledgeCategory.findFirst({
        orderBy: { order: 'desc' }
      })
      finalOrder = (lastCategory?.order || 0) + 1
    }

    // Criar categoria
    const category = await prisma.knowledgeCategory.create({
      data: {
        name,
        description,
        icon,
        color,
        order: finalOrder,
      }
    })

    return createSuccessResponse(category, 'Categoria criada com sucesso', 201)

  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return createErrorResponse('Erro interno do servidor', 500)
  }
}

