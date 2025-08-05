const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createKnowledgeArticles() {
  try {
    console.log('�� Criando artigos na Docs e IA da Adm...');

    // Buscar coordenador
    const coordenador = await prisma.user.findFirst({
      where: { role: 'COORDINATOR' },
    });

    if (!coordenador) {
      console.log('❌ Nenhum coordenador encontrado');
      return;
    }

    // Verificar se já existem artigos
    const existingArticles = await prisma.docsArticle.findMany({
      take: 1,
    });

    if (existingArticles.length > 0) {
      console.log('✅ Artigos já existem na Docs e IA da Adm');
      return;
    }

    // Buscar categoria padrão
    const category = await prisma.docsCategory.findFirst({
      where: { name: 'Procedimentos Administrativos' },
    });

    if (!category) {
      console.log('❌ Categoria "Procedimentos Administrativos" não encontrada');
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
  } catch (error) {
    console.error('❌ Erro ao criar artigos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createKnowledgeArticles();
