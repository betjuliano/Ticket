import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não autorizado',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, context, articles, agent, agentPrompt } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    // Simular processamento da IA baseado no contexto e agente
    const response = await processMessageWithContext(message, articles || [], agent, agentPrompt);

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro no chat:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function processMessageWithContext(message: string, articles: any[], agent: string, agentPrompt: string) {
  // Normalizar a mensagem para busca
  const normalizedMessage = message.toLowerCase();
  
  // Buscar artigos relevantes baseado na pergunta
  const relevantArticles = articles.filter(article => {
    const content = (article.title + ' ' + article.content).toLowerCase();
    const keywords = extractKeywords(normalizedMessage);
    
    return keywords.some(keyword => content.includes(keyword));
  });

  // Se não encontrar artigos relevantes, usar todos os artigos
  const contextArticles = relevantArticles.length > 0 ? relevantArticles : articles;

  // Gerar resposta baseada no contexto
  const response = generateResponse(message, contextArticles, agent, agentPrompt);
  
  return response;
}

function extractKeywords(message: string): string[] {
  const commonWords = [
    'sistema', 'tickets', 'chamados', 'procedimentos', 'administrativos',
    'equipamentos', 'política', 'acesso', 'login', 'senha', 'como',
    'quais', 'onde', 'quando', 'quem', 'por que', 'o que'
  ];
  
  const words = message.split(/\s+/);
  return words.filter(word => 
    word.length > 2 && !commonWords.includes(word)
  );
}

function generateResponse(message: string, articles: any[], agent: string, agentPrompt: string): string {
  const normalizedMessage = message.toLowerCase();
  
  // Processar baseado no agente ativo
  if (agent === 'aproveitamentos') {
    return generateAproveitamentosResponse(message, agentPrompt);
  }
  
  if (agent === 'coordenacao') {
    return generateCoordenacaoResponse(message, agentPrompt);
  }
  
  // Agente geral - processamento original
  if (normalizedMessage.includes('sistema') || normalizedMessage.includes('tickets') || normalizedMessage.includes('chamados')) {
    return generateSystemResponse(articles);
  }
  
  if (normalizedMessage.includes('equipamentos') || normalizedMessage.includes('política')) {
    return generateEquipmentResponse(articles);
  }
  
  if (normalizedMessage.includes('procedimentos') || normalizedMessage.includes('administrativos')) {
    return generateProceduresResponse(articles);
  }
  
  if (normalizedMessage.includes('como') || normalizedMessage.includes('acesso') || normalizedMessage.includes('login')) {
    return generateHowToResponse(articles);
  }
  
  // Resposta genérica baseada nos artigos disponíveis
  return generateGenericResponse(articles);
}

function generateSystemResponse(articles: any[]): string {
  const systemArticles = articles.filter(article => 
    article.title.toLowerCase().includes('sistema') || 
    article.content.toLowerCase().includes('tickets')
  );
  
  if (systemArticles.length > 0) {
    const article = systemArticles[0];
    return `Com base na documentação disponível, aqui estão as informações sobre o sistema de tickets:

**${article.title}**

${article.content.substring(0, 300)}...

Para mais detalhes, você pode consultar o artigo completo na base de conhecimento.`;
  }
  
  return `O sistema de tickets da UFSM permite que usuários abram chamados para solicitar suporte técnico, equipamentos ou esclarecimentos sobre procedimentos administrativos.

**Como acessar:**
1. Faça login no sistema com suas credenciais institucionais
2. Clique em "Novo Chamado" 
3. Preencha o formulário com sua solicitação
4. Anexe documentos se necessário
5. Clique em "Criar Chamado"

**Acompanhamento:**
- Você pode acompanhar seus chamados na seção "Meus Chamados"
- Receberá notificações por email sobre atualizações
- O sistema permite comentários e anexos adicionais`;
}

function generateEquipmentResponse(articles: any[]): string {
  const equipmentArticles = articles.filter(article => 
    article.title.toLowerCase().includes('equipamentos') || 
    article.content.toLowerCase().includes('política')
  );
  
  if (equipmentArticles.length > 0) {
    const article = equipmentArticles[0];
    return `**Política de Equipamentos da UFSM**

${article.content.substring(0, 400)}...

**Principais pontos:**
- Equipamentos são para uso exclusivamente acadêmico e administrativo
- Reporte problemas imediatamente via sistema de tickets
- Não instale software não autorizado
- Faça backup regular dos seus dados
- Manutenção preventiva é trimestral`;
  }
  
  return `**Política de Uso de Equipamentos da UFSM**

Os equipamentos fornecidos pela instituição devem ser utilizados exclusivamente para atividades acadêmicas e administrativas.

**Responsabilidades do usuário:**
- Manter o equipamento em bom estado
- Reportar problemas imediatamente via sistema de tickets
- Não instalar software não autorizado
- Fazer backup regular dos dados

**Solicitação de equipamentos:**
1. Abra um chamado no sistema
2. Justifique a necessidade
3. Aguarde aprovação da coordenação
4. Retire o equipamento no local indicado

**Manutenção:**
- Preventiva: trimestral
- Corretiva: sob demanda
- Garantia: conforme fabricante`;
}

function generateProceduresResponse(articles: any[]): string {
  const procedureArticles = articles.filter(article => 
    article.title.toLowerCase().includes('procedimentos') || 
    article.content.toLowerCase().includes('administrativos')
  );
  
  if (procedureArticles.length > 0) {
    const article = procedureArticles[0];
    return `**Procedimentos Administrativos da UFSM**

${article.content.substring(0, 400)}...

**Principais procedimentos:**
- Solicitação de equipamentos via sistema de tickets
- Reporte de problemas técnicos
- Acesso a sistemas institucionais
- Políticas de uso de recursos

Para procedimentos específicos, consulte a documentação completa na base de conhecimento.`;
  }
  
  return `**Procedimentos Administrativos da UFSM**

**Sistema de Tickets:**
- Acesso via login institucional
- Categorização automática por tipo de solicitação
- Acompanhamento em tempo real
- Notificações por email

**Solicitações Comuns:**
1. **Equipamentos**: Justifique necessidade, aguarde aprovação
2. **Suporte Técnico**: Descreva problema detalhadamente
3. **Acesso a Sistemas**: Solicite credenciais via ticket
4. **Documentação**: Consulte base de conhecimento

**Fluxo Padrão:**
1. Abrir chamado no sistema
2. Aguardar atribuição
3. Acompanhar progresso
4. Receber solução/equipamento
5. Confirmar resolução`;
}

function generateHowToResponse(articles: any[]): string {
  return `**Como Acessar o Sistema da UFSM**

**Login:**
1. Acesse o portal da UFSM
2. Use seu email institucional (@ufsm.br)
3. Digite sua senha
4. Clique em "Entrar no Sistema"

**Primeiro Acesso:**
- Use a opção "Esqueci minha senha" se necessário
- Verifique se está usando o email institucional correto
- Entre em contato com suporte se a conta estiver bloqueada

**Navegação:**
- Dashboard: Visão geral do sistema
- Chamados: Abrir e acompanhar tickets
- Docs e IA da Adm: Consultar documentação
- Usuários: Gerenciar perfis (apenas admin)

**Problemas Comuns:**
- **Email não reconhecido**: Verifique se é o email institucional
- **Senha incorreta**: Use "Esqueci minha senha"
- **Conta bloqueada**: Abra um chamado para suporte`;
}

function generateGenericResponse(articles: any[]): string {
  if (articles.length === 0) {
    return `Olá! Sou a IA da Administração da UFSM. 

Posso ajudar você com informações sobre:
- Sistema de tickets e chamados
- Procedimentos administrativos
- Políticas de equipamentos
- Acesso a sistemas institucionais

Faça uma pergunta específica e eu tentarei responder com base na documentação disponível.`;
  }
  
  const randomArticle = articles[Math.floor(Math.random() * articles.length)];
  
  return `Com base na documentação disponível, posso ajudar você com informações sobre procedimentos administrativos da UFSM.

**Artigo Relevante:**
**${randomArticle.title}**

${randomArticle.content.substring(0, 200)}...

Para informações mais específicas, faça uma pergunta direta sobre o que você precisa saber. Posso ajudar com:
- Como acessar sistemas
- Procedimentos administrativos
- Políticas institucionais
- Solicitação de equipamentos
- Suporte técnico`;
}

function generateAproveitamentosResponse(message: string, agentPrompt: string): string {
  const normalizedMessage = message.toLowerCase();
  
  // Simular análise de equivalência de disciplinas
  if (normalizedMessage.includes('programa') || normalizedMessage.includes('disciplina')) {
    if (normalizedMessage.includes('primeiro') || normalizedMessage.includes('cursada')) {
      return `Entendi! Recebi o programa da disciplina cursada. Agora, por favor, envie o programa da disciplina equivalente para que eu possa realizar a análise de equivalência.`;
    }
    
    if (normalizedMessage.includes('segundo') || normalizedMessage.includes('equivalente')) {
      return `Análise de Equivalência:

**Resultado: DEFERIMENTO (85% de equivalência)**

- Carga horária: Atendida (60h ≥ 60h)
- Conteúdos programáticos: 85% de equivalência
- Critérios atendidos: Sim

**Conclusão:** Aproveitamento aprovado com 85% de equivalência.`;
    }
  }
  
  return `Olá! Sou o Agente de Aproveitamentos da UFSM.

**COMO ENCONTRAR AS DISCIPLINAS:**
Para encontrar as disciplinas disponíveis, acesse:
- https://www.ufsm.br/cursos/graduacao/santa-maria/administracao/informacoes-do-curriculo
- https://www.ufsm.br/ementario/disciplinas

**INSTRUÇÕES:**
1. **Cole no chat** o conteúdo completo do programa da disciplina (código, nome, carga horária, ementa, objetivos, etc.)
2. **Primeiro:** Cole o programa da disciplina cursada
3. **Segundo:** Cole o programa da disciplina equivalente

Após receber ambos, farei a análise comparando carga horária e conteúdos programáticos, indicando se há deferimento (≥75%), atendimento parcial (50-75%) ou indeferimento (<50%).

Por favor, cole o primeiro programa de disciplina.`;
}

function generateCoordenacaoResponse(message: string, agentPrompt: string): string {
  const normalizedMessage = message.toLowerCase();
  
  // Simular respostas da coordenação
  if (normalizedMessage.includes('aproveitamento') || normalizedMessage.includes('equivalência')) {
    return `**Solicitação de Aproveitamento de Disciplina**

**Procedimento:**
1. Acesse o sistema acadêmico
2. Preencha o formulário de aproveitamento
3. Anexe o programa da disciplina cursada
4. Anexe o histórico escolar
5. Submeta para análise da coordenação

**Prazo:** 30 dias úteis para análise

**Documentação necessária:**
- Programa da disciplina cursada
- Histórico escolar
- Ementa da disciplina equivalente

**Observação:** A análise é feita pela coordenação do curso.

*As informações apresentadas foram geradas por IA e tem caráter informativo, que conforme o caso precisa ser confirmado via novo chamado à coordenação.*`;
  }
  
  if (normalizedMessage.includes('horário') || normalizedMessage.includes('atendimento')) {
    return `**Horários de Atendimento da Coordenação**

**Segunda a Sexta:**
- Manhã: 8h às 12h
- Tarde: 14h às 18h

**Local:** Sala da Coordenação - Prédio 74A

**Agendamento:** Via sistema de tickets ou presencial

**Observações:**
- Prioridade para alunos com matrícula ativa
- Documentação necessária para atendimento
- Consultas rápidas: 15 minutos máximo

*As informações apresentadas foram geradas por IA e tem caráter informativo, que conforme o caso precisa ser confirmado via novo chamado à coordenação.*`;
  }
  
  if (normalizedMessage.includes('declaração') || normalizedMessage.includes('matrícula')) {
    return `**Solicitação de Declaração de Matrícula**

**Procedimento:**
1. Acesse o sistema acadêmico
2. Vá em "Declarações"
3. Selecione "Declaração de Matrícula"
4. Preencha o período desejado
5. Imprima ou baixe o documento

**Tipos disponíveis:**
- Declaração de matrícula regular
- Declaração de matrícula com histórico
- Declaração de matrícula para estágio

**Prazo:** Imediato (sistema online)

*As informações apresentadas foram geradas por IA e tem caráter informativo, que conforme o caso precisa ser confirmado via novo chamado à coordenação.*`;
  }
  
  if (normalizedMessage.includes('trancamento')) {
    return `**Procedimentos para Trancamento**

**Períodos permitidos:**
- 1º ao 6º semestre: 2 trancamentos
- 7º ao 10º semestre: 1 trancamento

**Procedimento:**
1. Acesse o sistema acadêmico
2. Vá em "Solicitações"
3. Selecione "Trancamento"
4. Preencha o formulário
5. Submeta para análise

**Prazo:** Até 30 dias após início do semestre

**Documentação necessária:**
- Justificativa detalhada
- Comprovantes (se aplicável)

**Observação:** Trancamentos consecutivos podem ser analisados pela coordenação.

*As informações apresentadas foram geradas por IA e tem caráter informativo, que conforme o caso precisa ser confirmado via novo chamado à coordenação.*`;
  }
  
  return `Olá! Sou o Agente de Coordenação do curso de Administração da UFSM.

Posso ajudar você com:
- Solicitações de aproveitamento de disciplinas
- Horários de atendimento da coordenação
- Declarações de matrícula
- Procedimentos para trancamento
- Orientações acadêmicas

Como posso ajudar você hoje?

*As informações apresentadas foram geradas por IA e tem caráter informativo, que conforme o caso precisa ser confirmado via novo chamado à coordenação.*`;
}
