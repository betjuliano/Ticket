const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCRUD() {
  try {
    console.log('🔍 Testando operações CRUD...')
    
    // Criar um usuário
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Usuário Teste',
        password: 'senha123',
        role: 'USER'
      }
    })
    console.log('✅ Usuário criado:', user.id)
    
    // Listar usuários
    const users = await prisma.user.findMany()
    console.log('📋 Total de usuários:', users.length)
    
    // Criar um ticket
    const ticket = await prisma.ticket.create({
      data: {
        title: 'Ticket de Teste',
        description: 'Descrição do ticket de teste',
        category: 'Suporte',
        createdById: user.id
      }
    })
    console.log('🎫 Ticket criado:', ticket.id)
    
    console.log('✅ Todas as operações CRUD funcionaram!')
    
  } catch (error) {
    console.error('❌ Erro nas operações CRUD:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testCRUD()