import { NextRequest, NextResponse } from 'next/server';
import { extractKeyFromUrl, getSignedDownloadUrl } from '@/lib/minio-service';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, canUserAccessTicket, verifyJWT } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const attachmentId = params.id;

    console.log(`📥 Solicitação de download para anexo: ${attachmentId}`);

    const session = await getServerSession(authOptions);
    let user = null;

    if (session?.user) {
      user = { id: session.user.id, role: session.user.role };
    } else {
      const authHeader = request.headers.get('Authorization');
      let token: string | null = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
      if (token) {
        try {
          const decoded = verifyJWT(token);
          user = { id: decoded.id, role: decoded.role };
        } catch (err) {
          // Token inválido será tratado como não autenticado
          console.error('Erro ao verificar JWT:', err);
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar anexo no banco de dados
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            createdById: true,
            assignedToId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!attachment) {
      console.log(`❌ Anexo não encontrado: ${attachmentId}`);
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      );
    }

    console.log(`📁 Anexo encontrado: ${attachment.originalName}`);
    console.log(`🎫 Ticket: ${attachment.ticket.title}`);
    console.log(`👤 Usuário: ${attachment.user.name}`);

    const hasAccess = await canUserAccessTicket(
      user.id,
      user.role,
      attachment.ticketId
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    try {
      // Extrair key do path do arquivo
      const key = attachment.path;
      console.log(`🔑 Key extraída: ${key}`);

      // Gerar URL assinada para download (válida por 1 hora)
      const signedUrl = await getSignedDownloadUrl(key, 3600);
      console.log(`✅ URL assinada gerada`);

      // Log da ação de download
      try {
        await prisma.ticketLog.create({
          data: {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ticketId: attachment.ticketId,
            action: 'ATTACHMENT_DOWNLOADED',
            details: `Anexo "${attachment.originalName}" foi baixado`,
            userId: user.id,
            createdAt: new Date(),
          },
        });
        console.log('✅ Log de download criado');
      } catch (logError) {
        console.warn(
          '⚠️ Erro ao criar log de download (não crítico):',
          logError
        );
      }

      // Redirecionar para a URL assinada
      return NextResponse.redirect(signedUrl);
    } catch (minioError) {
      console.error('❌ Erro ao gerar URL de download do MinIO:', minioError);

      return NextResponse.json(
        {
          error: 'Erro ao acessar arquivo',
          details: 'Não foi possível gerar link de download',
          hint: 'Verifique se o MinIO está rodando e o arquivo existe',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('❌ Erro no download:', error);

    // Erro de banco de dados
    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json(
        {
          error: 'Erro no banco de dados',
          details: 'Não foi possível acessar informações do anexo',
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

// Método para obter informações do anexo sem fazer download
export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    let user = null;

    if (session?.user) {
      user = { id: session.user.id, role: session.user.role };
    } else {
      const authHeader = request.headers.get('Authorization');
      let token: string | null = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
      if (token) {
        try {
          const decoded = verifyJWT(token);
          user = { id: decoded.id, role: decoded.role };
        } catch (err) {
          // Token inválido
          console.error('Erro ao verificar JWT:', err);
        }
      }
    }

    if (!user) {
      return new NextResponse(null, { status: 401 });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
        ticketId: true,
      },
    });

    if (!attachment) {
      return new NextResponse(null, { status: 404 });
    }

    const hasAccess = await canUserAccessTicket(
      user.id,
      user.role,
      attachment.ticketId
    );

    if (!hasAccess) {
      return new NextResponse(null, { status: 403 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Length': attachment.size.toString(),
        'Content-Disposition': `attachment; filename="${attachment.originalName}"`,
        'Last-Modified': attachment.createdAt.toUTCString(),
      },
    });
  } catch (error) {
    console.error('❌ Erro ao obter informações do anexo:', error);
    return new NextResponse(null, { status: 500 });
  }
}
