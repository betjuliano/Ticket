const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Criar usuário admin
    const user = await prisma.user.create({
      data: {
        name: 'Administrador Sistema',
        email: 'admin@ticket.local',
        password: hashedPassword,
        role: 'ADMIN',
        matricula: '123456',
        isActive: true
      }
    })
    
    console.log('Usuário criado com sucesso:', user)
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

