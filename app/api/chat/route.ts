import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, ticketId } = await request.json();

    // Buscar contexto relevante na base de conhecimento
    const knowledgeContext = await prisma.knowledgeArticle.findMany({
      where: {
        OR: [
          { title: { contains: message, mode: 'insensitive' } },
          { content: { contains: message, mode: 'insensitive' } },
          { tags: { contains: message, mode: 'insensitive' } },
        ],
        isPublished: true,
      },
      take: 3,
    });

    // Buscar histórico do ticket se fornecido
    let ticketContext = '';
    if (ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          comments: {
            include: { user: { select: { name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (ticket) {
        ticketContext = `
        Contexto do Ticket:
        Título: ${ticket.title}
        Descrição: ${ticket.description}
        Status: ${ticket.status}
        Prioridade: ${ticket.priority}
        Categoria: ${ticket.category}
        
        Últimos comentários:
        ${ticket.comments.map(c => `${c.user.name}: ${c.content}`).join('\n')}
        `;
      }
    }

    const systemPrompt = `
    Você é um assistente especializado em suporte técnico. Use as informações da base de conhecimento e contexto do ticket para fornecer respostas precisas e úteis.
    
    Base de Conhecimento:
    ${knowledgeContext.map(k => `Título: ${k.title}\nConteúdo: ${k.content}\n---`).join('\n')}
    
    ${ticketContext}
    
    Responda de forma clara, objetiva e profissional. Se não souber a resposta, sugira escalar para um técnico.
    `;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response =
      completion.choices[0]?.message?.content ||
      'Desculpe, não consegui processar sua solicitação.';

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Erro no chat IA:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
