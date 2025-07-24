import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, handleApiError, logRequest } from '@/lib/api-utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// POST - Upload de arquivo
export async function POST(request: NextRequest) {
  try {
    logRequest('POST', '/api/attachments')
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Não autenticado', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const ticketId = formData.get('ticketId') as string

    if (!file || !ticketId) {
      return createErrorResponse('Arquivo e ticketId são obrigatórios', 400)
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse('Tipo de arquivo não permitido', 400)
    }

    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return createErrorResponse('Arquivo muito grande (máximo 5MB)', 400)
    }

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    const filepath = join(uploadDir, filename)

    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Salvar no banco
    const attachment = await prisma.attachment.create({
      data: {
        filename: file.name,
        filepath: `/uploads/${filename}`,
        filesize: file.size,
        mimetype: file.type,
        ticketId,
        userId: session.user.id
      }
    })

    return createSuccessResponse(attachment, 'Arquivo enviado com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

// GET - Listar anexos de um ticket
export async function GET(request: NextRequest) {
  try {
    logRequest('GET', '/api/attachments')
    
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('Não autenticado', 401)
    }

    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticketId')
    
    if (!ticketId) {
      return createErrorResponse('ticketId é obrigatório', 400)
    }

    const attachments = await prisma.attachment.findMany({
      where: { ticketId },
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return createSuccessResponse(attachments)
  } catch (error) {
    return handleApiError(error)
  }
}