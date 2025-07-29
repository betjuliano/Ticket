import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, handleApiError, logRequest } from '@/lib/api-utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Schema para criação de artigos de conhecimento. Observe que a propriedade
// `isPublished` é usada para controlar a visibilidade do artigo. Utilizar
// `tags` como array de strings no esquema, mas convertê-lo para string
// antes de persistir no banco, pois o modelo Prisma define `tags` como
// campo `String`.
const createKnowledgeSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false)
})

// GET - Listar artigos
export async function GET(request: NextRequest) {
  try {
    logRequest('GET', '/api/knowledge')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    // Filtrar apenas artigos publicados. O campo na base de dados é `isPublished`.
    const where: any = { isPublished: true }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (category) where.category = category

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      include: {
        author: {
          select: { name: true, email: true }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.knowledgeArticle.count({ where })

    return createSuccessResponse(articles, undefined, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Criar artigo
export async function POST(request: NextRequest) {
  try {
    logRequest('POST', '/api/knowledge')
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Não autenticado', 401)
    }

    const body = await request.json()
    const validatedData = createKnowledgeSchema.parse(body)

    // Converta tags (array) em string, se fornecido. O modelo do Prisma usa
    // `tags` como campo de texto, então armazenamos como lista separada por vírgula.
    const tagsString = validatedData.tags ? validatedData.tags.join(',') : ''

    const newArticle = await prisma.knowledgeArticle.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        category: validatedData.category,
        tags: tagsString,
        isPublished: validatedData.isPublished,
        authorId: session.user.id
      },
      include: {
        author: {
          select: { name: true, email: true }
        }
      }
    })

    return createSuccessResponse(newArticle, 'Artigo criado com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}