const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔄 Criando usuário de teste...');

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'usuario.teste@ufsm.br' },
    });

    if (existingUser) {
      console.log('✅ Usuário de teste já existe');
      console.log('📧 Email: usuario.teste@ufsm.br');
      console.log('🔑 Senha: teste123');
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('teste123', 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: 'Usuário Teste',
        email: 'usuario.teste@ufsm.br',
        password: hashedPassword,
        role: 'USER',
        matricula: '202300001',
        isActive: true,
      },
    });

    console.log('✅ Usuário de teste criado com sucesso!');
    console.log('📧 Email: usuario.teste@ufsm.br');
    console.log('🔑 Senha: teste123');
    console.log('👤 Role: USER');
    console.log('🆔 ID:', user.id);

    // Criar alguns tickets de exemplo para o usuário
    console.log('🎫 Criando tickets de exemplo...');

    const tickets = await Promise.all([
      prisma.ticket.create({
        data: {
          id: 'TKT-USER-001',
          title: 'Problema com acesso ao sistema',
          description:
            'Não consigo fazer login no sistema acadêmico. Aparece erro de credenciais inválidas.',
          status: 'OPEN',
          priority: 'MEDIUM',
          category: 'ACCOUNT_ACCESS',
          createdById: user.id,
        },
      }),
      prisma.ticket.create({
        data: {
          id: 'TKT-USER-002',
          title: 'Solicitação de equipamento',
          description:
            'Preciso de um novo mouse para minha estação de trabalho. O atual está com defeito.',
          status: 'IN_PROGRESS',
          priority: 'LOW',
          category: 'OTHER',
          createdById: user.id,
        },
      }),
    ]);

    console.log(`✅ ${tickets.length} tickets de exemplo criados`);

    // Criar alguns artigos na Docs e IA da Adm (como coordenador)
    console.log('📚 Criando artigos na Docs e IA da Adm...');

    const coordenador = await prisma.user.findFirst({
      where: { role: 'COORDINATOR' },
    });

    if (coordenador) {
      console.log('📚 Criando artigos na Knowledge Base...');

      // Criar categoria
      const category = await prisma.knowledgeCategory.upsert({
        where: { name: 'Tutoriais' },
        update: {},
        create: {
          name: 'Tutoriais',
          description: 'Guias e tutoriais para usuários',
          icon: '📚',
          color: '#3B82F6',
        },
      });

      const existingArticles = await prisma.docsArticle.findMany({
        take: 1,
      });

      if (existingArticles.length > 0) {
        console.log('✅ Artigos já existem na Docs e IA da Adm');
        return;
      }

      // Criar artigos de exemplo
      const articles = await prisma.docsArticle.createMany({
        data: [
          {
            title: 'Como acessar o sistema de tickets',
            content: 'Guia completo sobre como acessar e usar o sistema de tickets da UFSM...',
            categoryId: category.id,
            authorId: coordenador.id,
            isPublished: true,
          },
          {
            title: 'Procedimentos administrativos',
            content: 'Documentação sobre os principais procedimentos administrativos...',
            categoryId: category.id,
            authorId: coordenador.id,
            isPublished: true,
          },
        ],
      });

      console.log(`✅ ${articles.length} artigos criados na Docs e IA da Adm`);
    }
  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
