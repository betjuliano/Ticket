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

    // Criar alguns artigos na Knowledge Base (como coordenador)
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

      // Criar artigos
      const articles = await Promise.all([
        prisma.knowledgeArticle.create({
          data: {
            title: 'Como fazer login no sistema',
            content: `# Como fazer login no sistema

## Passo a passo

1. Acesse o site do sistema
2. Clique em "Entrar"
3. Digite seu email institucional
4. Digite sua senha
5. Clique em "Entrar no Sistema"

## Problemas comuns

- **Esqueci minha senha**: Use a opção "Esqueci minha senha"
- **Email não reconhecido**: Verifique se está usando o email institucional
- **Conta bloqueada**: Entre em contato com o suporte

## Precisa de ajuda?

Se ainda tiver problemas, abra um chamado no sistema de tickets.`,
            categoryId: category.id,
            authorId: coordenador.id,
            isPublished: true,
            isFeatured: true,
            tags: ['login', 'acesso', 'tutorial'],
            slug: 'como-fazer-login-no-sistema',
            excerpt: 'Tutorial completo sobre como fazer login no sistema',
          },
        }),
        prisma.knowledgeArticle.create({
          data: {
            title: 'Política de uso de equipamentos',
            content: `# Política de uso de equipamentos

## Diretrizes gerais

Os equipamentos fornecidos pela instituição devem ser utilizados exclusivamente para atividades acadêmicas e administrativas.

## Responsabilidades do usuário

- Manter o equipamento em bom estado
- Reportar problemas imediatamente
- Não instalar software não autorizado
- Fazer backup regular dos dados

## Solicitação de equipamentos

Para solicitar novos equipamentos:

1. Abra um chamado no sistema
2. Justifique a necessidade
3. Aguarde aprovação
4. Retire o equipamento no local indicado

## Manutenção

- Manutenção preventiva: trimestral
- Manutenção corretiva: sob demanda
- Garantia: conforme fabricante`,
            categoryId: category.id,
            authorId: coordenador.id,
            isPublished: true,
            isFeatured: false,
            tags: ['equipamentos', 'política', 'diretrizes'],
            slug: 'politica-uso-equipamentos',
            excerpt: 'Política institucional para uso de equipamentos',
          },
        }),
      ]);

      console.log(`✅ ${articles.length} artigos criados na Knowledge Base`);
    }
  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
