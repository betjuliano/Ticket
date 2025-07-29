const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuários de exemplo
  const users = [
    {
      email: 'admin@ticket.local',
      name: 'Administrador',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN'
    },
    {
      email: 'coordenador@ticket.local', 
      name: 'Coordenador TI',
      password: await bcrypt.hash('coord123', 10),
      role: 'COORDINATOR'
    },
    {
      email: 'usuario@ticket.local',
      name: 'Usuário Teste', 
      password: await bcrypt.hash('user123', 10),
      role: 'USER'
    },
    {
      email: 'admjulianoo@gmail.com',
      name: 'Juliano Admin',
      password: await bcrypt.hash('Adm4125', 10),
      role: 'ADMIN'
    },
    {
      email: 'coordadm@ufsm.br',
      name: 'Coordenação UFSM',
      password: await bcrypt.hash('Adm4125', 10),
      role: 'COORDINATOR'
    },
    {
      email: 'alunoadm@ufsm.br',
      name: 'Aluno Admin UFSM',
      password: await bcrypt.hash('teste123', 10),
      role: 'USER'
    }
  ]

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: userData.password,
        role: userData.role
      },
      create: userData
    })
    console.log(`✅ Usuário criado/atualizado: ${user.name} (${user.email})`);
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