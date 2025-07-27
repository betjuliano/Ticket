import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuários de exemplo
  const users = [
    {
      email: 'admin@ticket.local',
      name: 'Administrador',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN' as const
    },
    {
      email: 'coordenador@ticket.local', 
      name: 'Coordenador TI',
      password: await bcrypt.hash('coord123', 10),
      role: 'COORDINATOR' as const
    },
    {
      email: 'usuario@ticket.local',
      name: 'Usuário Teste', 
      password: await bcrypt.hash('user123', 10),
      role: 'USER' as const
    },
    {
      email: 'admjulianoo@gmail.com',
      name: 'Juliano Admin',
      password: await bcrypt.hash('123456', 10),
      role: 'ADMIN' as const
    },
    {
      email: 'coordadm@ufsm.br',
      name: 'Coordenação UFSM',
      password: await bcrypt.hash('Adm4125', 10),
      role: 'COORDINATOR' as const
    },
    {
      email: 'alunoadm@ufsm.br',
      name: 'Aluno Admin UFSM',
      password: await bcrypt.hash('teste123', 10),
      role: 'USER' as const
    }
  ]

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData
    })
    console.log(`✅ Usuário criado: ${user.name} (${user.email})`)
  }

  console.log('🎉 Seed concluído!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })