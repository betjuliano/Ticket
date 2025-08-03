const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('🚀 Criando usuários específicos...');

    // Usuários a serem criados
    const users = [
      {
        email: 'admjulianoo@gmail.com',
        name: 'Administrador Sistema',
        password: 'Adm4125',
        role: 'ADMIN',
        matricula: 'ADM001',
      },
      {
        email: 'coordadmnoturno.ccsh@ufsm.br',
        name: 'Coordenador Administrativo Noturno',
        password: 'curso515',
        role: 'COORDINATOR',
        matricula: 'COORD001',
      },
      {
        email: 'coordadmdiurno.ccsh@ufsm.br',
        name: 'Coordenador Administrativo Diurno',
        password: 'curso501',
        role: 'COORDINATOR',
        matricula: 'COORD002',
      },
    ];

    for (const userData of users) {
      // Verificar se usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⚠️  Usuário ${userData.email} já existe, atualizando...`);

        // Atualizar usuário existente
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            name: userData.name,
            password: hashedPassword,
            role: userData.role,
            matricula: userData.matricula,
            isActive: true,
          },
        });

        console.log(`✅ Usuário ${userData.email} atualizado com sucesso!`);
      } else {
        // Criar novo usuário
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: hashedPassword,
            role: userData.role,
            matricula: userData.matricula,
            isActive: true,
          },
        });

        console.log(`✅ Usuário ${userData.email} criado com sucesso!`);
      }
    }

    // Criar categorias padrão para Knowledge Base
    console.log('📚 Criando categorias padrão para Knowledge Base...');

    const categories = [
      {
        name: 'Procedimentos Administrativos',
        description: 'Documentação sobre processos administrativos',
        icon: '📋',
        color: '#3B82F6',
        order: 1,
      },
      {
        name: 'Sistemas e Tecnologia',
        description: 'Guias sobre sistemas e ferramentas tecnológicas',
        icon: '💻',
        color: '#10B981',
        order: 2,
      },
      {
        name: 'Políticas e Regulamentos',
        description: 'Políticas institucionais e regulamentos',
        icon: '📜',
        color: '#F59E0B',
        order: 3,
      },
      {
        name: 'FAQ - Perguntas Frequentes',
        description: 'Respostas para dúvidas mais comuns',
        icon: '❓',
        color: '#EF4444',
        order: 4,
      },
    ];

    for (const categoryData of categories) {
      const existingCategory = await prisma.knowledgeCategory.findUnique({
        where: { name: categoryData.name },
      });

      if (!existingCategory) {
        await prisma.knowledgeCategory.create({
          data: categoryData,
        });
        console.log(`✅ Categoria "${categoryData.name}" criada!`);
      } else {
        console.log(`⚠️  Categoria "${categoryData.name}" já existe`);
      }
    }

    console.log(
      '🎉 Todos os usuários e categorias foram criados/atualizados com sucesso!'
    );

    // Exibir resumo
    const totalUsers = await prisma.user.count();
    const totalCategories = await prisma.knowledgeCategory.count();

    console.log('\n📊 RESUMO:');
    console.log(`👥 Total de usuários: ${totalUsers}`);
    console.log(`📚 Total de categorias: ${totalCategories}`);

    console.log('\n🔑 CREDENCIAIS DE ACESSO:');
    console.log('👨‍💼 ADMIN: admjulianoo@gmail.com / Adm4125');
    console.log('👨‍🏫 COORD NOTURNO: coordadmnoturno.ccsh@ufsm.br / curso515');
    console.log('👨‍🏫 COORD DIURNO: coordadmdiurno.ccsh@ufsm.br / curso501');
  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();
