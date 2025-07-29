import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const config = await request.json()
    
    // Salvar configurações no banco de dados ou arquivo
    // Implementar lógica de salvamento
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configurações salvas com sucesso' 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}