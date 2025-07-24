import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, identificationType, matricula, telefone, password } = await request.json()

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(matricula ? [{ matricula }] : []),
          ...(telefone ? [{ telefone }] : [])
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email, matrícula ou telefone já cadastrados' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        matricula: matricula || null,
        telefone: telefone || null,
        password: hashedPassword,
        role: 'USER'
      }
    })

    return NextResponse.json(
      { message: 'Usuário criado com sucesso', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}