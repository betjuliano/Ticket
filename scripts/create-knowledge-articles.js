const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createKnowledgeArticles() {
  try {
    console.log('📚 Criando artigos na Knowledge Base...')

    // Buscar coordenador
    const coordenador = await prisma.user.findFirst({
      where: { role: 'COORDINATOR' }
    })

    if (!coordenador) {
      console.log('❌ Nenhum coordenador encontrado')
      return
    }

    // Criar categoria
    const category = await prisma.knowledgeCategory.upsert({
      where: { name: 'Tutoriais' },
      update: {},
      create: {
        name: 'Tutoriais',
        description: 'Guias e tutoriais para usuários',
        icon: '📚',
        color: '#3B82F6'
      }
    })

    console.log('✅ Categoria criada:', category.name)

    // Verificar se artigos já existem
    const existingArticles = await prisma.knowledgeArticle.findMany({
      where: {
        slug: {
          in: ['como-fazer-login-no-sistema', 'politica-uso-equipamentos']
        }
      }
    })

    if (existingArticles.length > 0) {
      console.log('✅ Artigos já existem na Knowledge Base')
      return
    }

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
          excerpt: 'Tutorial completo sobre como fazer login no sistema'
        }
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
          excerpt: 'Política institucional para uso de equipamentos'
        }
      }),
      prisma.knowledgeArticle.create({
        data: {
          title: 'FAQ - Perguntas Frequentes',
          content: `# Perguntas Frequentes

## Sistema de Tickets

### Como abrir um chamado?
1. Faça login no sistema
2. Clique em "Novo Chamado"
3. Preencha o formulário
4. Anexe arquivos se necessário
5. Clique em "Criar Chamado"

### Como acompanhar meu chamado?
- Acesse a seção "Meus Chamados"
- Clique no ticket desejado
- Veja o histórico de comentários
- Receba notificações por email

## Problemas Técnicos

### Sistema lento
- Verifique sua conexão com a internet
- Limpe o cache do navegador
- Tente usar outro navegador

### Erro de login
- Verifique suas credenciais
- Use a opção "Esqueci minha senha"
- Entre em contato com o suporte

## Equipamentos

### Como solicitar equipamentos?
- Abra um chamado na categoria "Equipamentos"
- Justifique a necessidade
- Aguarde aprovação da coordenação

### Problemas com equipamentos
- Reporte imediatamente via chamado
- Não tente consertar sozinho
- Aguarde orientações do suporte`,
          categoryId: category.id,
          authorId: coordenador.id,
          isPublished: true,
          isFeatured: true,
          tags: ['faq', 'dúvidas', 'ajuda'],
          slug: 'faq-perguntas-frequentes',
          excerpt: 'Respostas para as dúvidas mais comuns dos usuários'
        }
      })
    ])

    console.log(`✅ ${articles.length} artigos criados na Knowledge Base`)

  } catch (error) {
    console.error('❌ Erro ao criar artigos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createKnowledgeArticles()

