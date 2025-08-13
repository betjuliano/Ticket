import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Configurações de upload
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'attachments');

// GET /api/tickets/[id]/attachments - Listar anexos do ticket
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

    const ticketId = params.id;

    // Verificar se o ticket existe
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: true,
        assignedTo: true,
      },
    });

    if (!ticket) {
      return createErrorResponse('Ticket não encontrado', 404);
    }

    // Verificar permissões
    const userRole = session.user.role;
    const userId = session.user.id;
    const canViewTicket =
      userRole === 'ADMIN' ||
      userRole === 'COORDINATOR' ||
      ticket.createdById === userId ||
      ticket.assignedToId === userId;

    if (!canViewTicket) {
      return createErrorResponse(
        'Sem permissão para visualizar este ticket',
        403
      );
    }

    // Buscar anexos
    const attachments = await prisma.attachment.findMany({
      where: { ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return createSuccessResponse(attachments);
  } catch (error) {
    console.error('Erro ao buscar anexos:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}

// POST /api/tickets/[id]/attachments - Upload de novo anexo
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse('Não autorizado', 401);
    }

    const ticketId = params.id;

    // Verificar se o ticket existe
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: true,
        assignedTo: true,
      },
    });

    if (!ticket) {
      return createErrorResponse('Ticket não encontrado', 404);
    }

    // Verificar permissões
    const userRole = session.user.role;
    const userId = session.user.id;
    const canUpload =
      userRole === 'ADMIN' ||
      userRole === 'COORDINATOR' ||
      ticket.createdById === userId ||
      ticket.assignedToId === userId;

    if (!canUpload) {
      return createErrorResponse(
        'Sem permissão para anexar arquivos neste ticket',
        403
      );
    }

    // Processar FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return createErrorResponse('Nenhum arquivo enviado', 400);
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return createErrorResponse(
        `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_TYPES.join(', ')}`,
        400
      );
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse(
        `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        400
      );
    }

    // Criar diretório se não existir
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}_${randomString}.${fileExtension}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Verificar se é imagem
    const isImage = file.type.startsWith('image/');

    // Salvar no banco de dados
    const attachment = await prisma.attachment.create({
      data: {
        filename,
        originalName: file.name,
        path: `/uploads/attachments/${filename}`,
        size: file.size,
        mimeType: file.type,
        ticketId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Atualizar timestamp do ticket
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    // Criar log de atividade
    await prisma.ticketLog.create({
      data: {
        ticketId,
        action: 'ATTACHMENT_ADDED',
        details: `Anexo adicionado: ${file.name}`,
        userId,
      },
    });

    return createSuccessResponse(
      attachment,
      'Arquivo enviado com sucesso'
    );
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}
