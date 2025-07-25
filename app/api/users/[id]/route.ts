import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userUpdateSchema } from '@/lib/validations'
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-utils'
import { getServerSession } from 'next-auth'
import { authOptions, hashPassword } from '@/lib/auth'

// GET - Buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Não autenticado', 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
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

    if (!user) {
      return createErrorResponse('Usuário não encontrado', 404)
    }

    return createSuccessResponse(user)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'COORDINATOR' && session.user.id !== params.id)) {
      return createErrorResponse('Acesso negado', 403)
    }

    const body = await request.json()
    const validatedData = userUpdateSchema.parse(body)

    // Se está alterando senha, fazer hash
    if (validatedData.password) {
      validatedData.password = await hashPassword(validatedData.password)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        matricula: true,
        telefone: true,
        isActive: true,
        updatedAt: true
      }
    })

    return createSuccessResponse(updatedUser, 'Usuário atualizado com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Desativar usuário (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'COORDINATOR') {
      return createErrorResponse('Acesso negado', 403)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    })

    return createSuccessResponse(updatedUser, 'Usuário desativado com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}