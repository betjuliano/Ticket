import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils'
import { readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET /api/attachments/[id] - Download do anexo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401)
    }

    const attachmentId = params.id

    // Buscar anexo
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: {
          include: {
            createdBy: true,
            assignedTo: true,
          }
        }
      }
    })

    if (!attachment) {
      return createErrorResponse('Anexo não encontrado', 404)
    }

    // Verificar permissões
    const userRole = session.user.role
    const userId = session.user.id
    const canDownload = 
      userRole === 'ADMIN' || 
      userRole === 'COORDINATOR' || 
      attachment.ticket.createdById === userId || 
      attachment.ticket.assignedToId === userId ||
      attachment.userId === userId

    if (!canDownload) {
      return createErrorResponse('Sem permissão para baixar este anexo', 403)
    }

    // Verificar se arquivo existe
    const fullPath = join(process.cwd(), 'uploads', 'attachments', attachment.filename)
    if (!existsSync(fullPath)) {
      return createErrorResponse('Arquivo não encontrado no servidor', 404)
    }

    // Ler arquivo
    const fileBuffer = await readFile(fullPath)

    // Retornar arquivo
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimetype,
        'Content-Disposition': `attachment; filename="${attachment.originalName}"`,
        'Content-Length': attachment.filesize.toString(),
      },
    })

  } catch (error) {
    console.error('Erro ao fazer download:', error)
    return createErrorResponse('Erro interno do servidor', 500)
  }
}

// DELETE /api/attachments/[id] - Deletar anexo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401)
    }

    const attachmentId = params.id

    // Buscar anexo
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: true
      }
    })

    if (!attachment) {
      return createErrorResponse('Anexo não encontrado', 404)
    }

    // Verificar permissões
    const userRole = session.user.role
    const userId = session.user.id
    const canDelete = 
      userRole === 'ADMIN' || 
      attachment.userId === userId

    if (!canDelete) {
      return createErrorResponse('Sem permissão para deletar este anexo', 403)
    }

    // Deletar arquivo do sistema de arquivos
    const fullPath = join(process.cwd(), 'uploads', 'attachments', attachment.filename)
    if (existsSync(fullPath)) {
      try {
        await unlink(fullPath)
      } catch (error) {
        console.error('Erro ao deletar arquivo:', error)
        // Continua mesmo se não conseguir deletar o arquivo físico
      }
    }

    // Deletar do banco de dados
    await prisma.attachment.delete({
      where: { id: attachmentId }
    })

    // Criar log de atividade
    await prisma.ticketLog.create({
      data: {
        ticketId: attachment.ticketId,
        action: 'ATTACHMENT_DELETED',
        details: `Anexo removido: ${attachment.originalName}`,
        userId,
      }
    })

    return createSuccessResponse(null, 'Anexo deletado com sucesso')

  } catch (error) {
    console.error('Erro ao deletar anexo:', error)
    return createErrorResponse('Erro interno do servidor', 500)
  }
}

