import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, handleApiError, logRequest } from '@/lib/api-utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const createKnowledgeSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true)
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

    const where: any = { isPublic: true }
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

    const newArticle = await prisma.knowledgeArticle.create({
      data: {
        ...validatedData,
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