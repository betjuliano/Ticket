import { NextRequest, NextResponse } from 'next/server';

// Interface para estatísticas
interface DashboardStats {
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byPriority: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    byCategory: Record<string, number>;
  };
  users: {
    total: number;
    active: number;
    coordinators: number;
  };
  system: {
    uptime: string;
    lastUpdate: string;
    version: string;
    status: 'online' | 'maintenance' | 'offline';
  };
  performance: {
    avgResolutionTime: number; // em horas
    satisfactionRate: number; // percentual
    responseTime: number; // em minutos
  };
}

// Mock data - em produção, isso viria do banco de dados
function generateMockStats(): DashboardStats {
  const now = new Date();
  const uptimeHours = 72;
  const uptimeMinutes = 14;
  const uptimeSeconds = 33;

  return {
    tickets: {
      total: 156,
      open: 23,
      inProgress: 18,
      resolved: 89,
      closed: 26,
      byPriority: {
        low: 45,
        medium: 67,
        high: 32,
        critical: 12,
      },
      byCategory: {
        Sistema: 45,
        Rede: 32,
        Hardware: 28,
        Software: 35,
        Segurança: 16,
      },
    },
    users: {
      total: 1247,
      active: 847,
      coordinators: 12,
    },
    system: {
      uptime: `${uptimeHours}:${uptimeMinutes.toString().padStart(2, '0')}:${uptimeSeconds.toString().padStart(2, '0')}`,
      lastUpdate: now.toISOString(),
      version: '2.1.7',
      status: 'online',
    },
    performance: {
      avgResolutionTime: 4.2,
      satisfactionRate: 94.5,
      responseTime: 12,
    },
  };
}

// GET - Obter estatísticas do dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 1d, 7d, 30d, 90d

    // Em produção, filtrar dados baseado no período
    const stats = generateMockStats();

    // Adicionar informações específicas do período
    const periodInfo = {
      period,
      generatedAt: new Date().toISOString(),
      timezone: 'UTC',
    };

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        meta: periodInfo,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Atualizar estatísticas (para sistemas externos)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação de autenticação/autorização aqui
    // Em produção, verificar se o usuário tem permissão para atualizar stats

    // Processar atualizações específicas
    if (body.action === 'refresh') {
      const stats = generateMockStats();

      return NextResponse.json({
        success: true,
        message: 'Estatísticas atualizadas com sucesso',
        data: stats,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Ação não reconhecida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
