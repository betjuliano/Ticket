import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createUserSchema, updateUserSchema } from '@/lib/validations'
import { createSuccessResponse, createErrorResponse, handleApiError, logRequest } from '@/lib/api-utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Listar usuários
export async function GET(request: NextRequest) {
  try {
    logRequest('GET', '/api/users')
    
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COORDINATOR') {
      return createErrorResponse('Acesso negado', 403)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const role = searchParams.get('role')
    const active = searchParams.get('active')

    const where: any = {}
    if (role) where.role = role
    if (active !== null) where.isActive = active === 'true'

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        matricula: true,
        telefone: true,
        isActive: true,
        createdAt: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.user.count({ where })

    return createSuccessResponse(users, undefined, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Criar usuário
export async function POST(request: NextRequest) {
  try {
    logRequest('POST', '/api/users')
    
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COORDINATOR') {
      return createErrorResponse('Acesso negado', 403)
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { matricula: validatedData.matricula },
          { telefone: validatedData.telefone }
        ]
      }
    })

    if (existingUser) {
      return createErrorResponse('Usuário já existe com estes dados', 409)
    }

    const hashedPassword = await hashPassword(validatedData.password)

    const newUser = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        matricula: true,
        telefone: true,
        isActive: true,
        createdAt: true
      }
    })

    return createSuccessResponse(newUser, 'Usuário criado com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}