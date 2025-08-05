import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/minio-service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação
const uploadSchema = z.object({
  ticketId: z.string().min(1, 'ID do ticket é obrigatório'),
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
});

// Tipos de arquivo permitidos
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
];

// Tamanho máximo: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Iniciando upload de arquivo...');

    // Parse do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ticketId = formData.get('ticketId') as string;
    const userId = formData.get('userId') as string;

    // Validação básica
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    // Validação dos dados
    const validation = uploadSchema.safeParse({ ticketId, userId });
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    console.log(`📁 Arquivo: ${file.name} (${file.size} bytes)`);
    console.log(`🎫 Ticket: ${ticketId}`);
    console.log(`👤 Usuário: ${userId}`);

    // Validação do tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Arquivo muito grande. Máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          maxSize: MAX_FILE_SIZE,
        },
        { status: 400 }
      );
    }

    // Validação do tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Tipo de arquivo não permitido',
          allowedTypes: ALLOWED_TYPES,
          receivedType: file.type,
        },
        { status: 400 }
      );
    }

    // Verificar se o ticket existe
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, title: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Validações passaram, iniciando upload para MinIO...');

    // Converter arquivo para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || '';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${timestamp}_${randomSuffix}_${sanitizedName}`;

    // Upload para MinIO
    const fileUrl = await uploadFile(buffer, uniqueFileName, file.type, {
      ticketId,
      userId,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    });

    console.log('✅ Upload para MinIO concluído:', fileUrl);

    // Gerar ID único para o anexo
    const attachmentId = `att_${timestamp}_${randomSuffix}`;

    // Salvar no banco de dados
    const attachment = await prisma.attachment.create({
      data: {
        id: attachmentId,
        filename: uniqueFileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: fileUrl,
        ticketId,
        userId,
        createdAt: new Date(),
      },
    });

    console.log('✅ Anexo salvo no banco de dados:', attachment.id);

    // Log da ação
    try {
      await prisma.ticketLog.create({
        data: {
          id: `log_${timestamp}_${randomSuffix}`,
          ticketId,
          action: 'ATTACHMENT_ADDED',
          details: `Anexo "${file.name}" adicionado por ${user.name}`,
          userId,
          createdAt: new Date(),
        },
      });
      console.log('✅ Log de ação criado');
    } catch (logError) {
      console.warn('⚠️ Erro ao criar log (não crítico):', logError);
    }

    // Resposta de sucesso
    return NextResponse.json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      attachment: {
        id: attachment.id,
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        path: attachment.path,
        createdAt: attachment.createdAt,
      },
      ticket: {
        id: ticket.id,
        title: ticket.title,
      },
      user: {
        id: user.id,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('❌ Erro no upload:', error);

    // Erro específico do MinIO
    if (error instanceof Error && error.message.includes('MinIO')) {
      return NextResponse.json(
        {
          error: 'Erro no serviço de armazenamento',
          details:
            'Verifique se o MinIO está rodando e configurado corretamente',
          hint: 'Execute: docker-compose -f docker-compose.minio.yml up -d',
        },
        { status: 503 }
      );
    }

    // Erro de banco de dados
    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json(
        {
          error: 'Erro no banco de dados',
          details: 'Não foi possível salvar as informações do anexo',
        },
        { status: 500 }
      );
    }

    // Erro genérico
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details:
          process.env.NODE_ENV === 'development'
            ? (error instanceof Error ? error.message : 'Erro desconhecido')
            : 'Tente novamente mais tarde',
      },
      { status: 500 }
    );
  }
}

// Método OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
