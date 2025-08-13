'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  BookOpen,
  Sparkles,
  RefreshCw,
  GraduationCap,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: {
    name: string;
  };
}

export function KnowledgeChat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>([]);
  const [activeAgent, setActiveAgent] = useState<'general' | 'aproveitamentos' | 'coordenacao'>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Prompts específicos para cada agente
  const agentPrompts = {
    aproveitamentos: `Este GPT auxilia na análise de equivalência de disciplinas com base em programas fornecidos pelo usuário. 

INSTRUÇÕES PARA O USUÁRIO:
- Para encontrar as disciplinas disponíveis, acesse: https://www.ufsm.br/cursos/graduacao/santa-maria/administracao/informacoes-do-curriculo e https://www.ufsm.br/ementario/disciplinas
- Cole no chat o conteúdo completo do programa da disciplina (código, nome, carga horária, ementa, objetivos, etc.)

PROCESSO DE ANÁLISE:
O usuário enviará dois programas de disciplinas, um de cada vez. Após o envio do primeiro, o GPT deve confirmar que compreendeu, sem ainda realizar a análise, e solicitar o segundo programa. Após receber o segundo, o GPT deve avaliar se a carga horária cursada é maior ou igual à da disciplina equivalente e se os conteúdos programáticos possuem pelo menos 75% de equivalência. A análise deve ser objetiva, com no máximo 50 palavras, e indicar se há deferimento (75% ou mais de equivalência), atendimento parcial (entre 50% e 75%) com o percentual exato de equivalência, ou indeferimento (menos de 50%).`,
    
    coordenacao: `"Solicitações Coordenação" is a comprehensive coordinator and educator for the Administration course at UFSM, ready to handle a broad spectrum of inquiries in Portuguese. Your role involves:
1. Analyzing requests, whether academic or administrative, from teachers and students.
2. Referring to the Administration Course's PPC, UFSM student guide, academic calendar and course page for information (attached files).
3. Providing structured responses in correct Brazilian Portuguese, focused on the inquiry's context.
4. If a request falls outside standard procedures or available information, you should either ask for more details or explain the process involving other sectors for validation.
5. Offering concise, informative responses, including detailed citations for specific regulations or guidelines.
6. Concluding responses with the signature of "as informações apresentadas foram geradas por IA e tem caráter informativo, que conforme o caso precisa ser confirmado via novo chamado à coordenação."
You're designed to follow instructions strictly, avoiding personal opinions, and ensuring accurate, comprehensive responses for a variety of inquiries.`
  };

  // Carregar artigos da base de conhecimento
  useEffect(() => {
    loadKnowledgeArticles();
  }, []);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadKnowledgeArticles = async () => {
    try {
      const response = await fetch('/api/knowledge/articles');
      if (response.ok) {
        const data = await response.json();
        setKnowledgeArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: 'knowledge_base',
          agent: activeAgent,
          agentPrompt: activeAgent !== 'general' ? agentPrompts[activeAgent] : null,
          articles: knowledgeArticles.map(article => ({
            title: article.title,
            content: article.content,
            category: article.category.name,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: data.response, isLoading: false }
              : msg
          )
        );
      } else {
        throw new Error('Erro na resposta da API');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao processar sua pergunta. Tente novamente.');
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.', isLoading: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success('Chat limpo com sucesso!');
  };

  const switchAgent = (agent: 'general' | 'aproveitamentos' | 'coordenacao') => {
    setActiveAgent(agent);
    setMessages([]);
    
    const agentNames = {
      general: 'IA da Administração',
      aproveitamentos: 'Agente Aproveitamentos',
      coordenacao: 'Agente Coordenação'
    };
    
    toast.success(`Alterado para ${agentNames[agent]}`);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="border-b border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white">
                {activeAgent === 'general' ? 'IA da Administração' : 
                 activeAgent === 'aproveitamentos' ? 'Agente Aproveitamentos' : 
                 'Agente Coordenação'}
              </CardTitle>
              <p className="text-sm text-neutral-400">
                {activeAgent === 'general' ? 'Chat inteligente baseado na documentação disponível' :
                 activeAgent === 'aproveitamentos' ? 'Análise de equivalência de disciplinas' :
                 'Solicitações e orientações da coordenação'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400">
              {knowledgeArticles.length} artigos disponíveis
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="border-neutral-600 text-neutral-400 hover:bg-neutral-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpar Chat
            </Button>
          </div>
        </div>

        {/* Botões dos Agentes */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={activeAgent === 'general' ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchAgent('general')}
            className={`${
              activeAgent === 'general' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'border-neutral-600 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Bot className="w-4 h-4 mr-2" />
            IA Geral
          </Button>
          <Button
            variant={activeAgent === 'aproveitamentos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchAgent('aproveitamentos')}
            className={`${
              activeAgent === 'aproveitamentos' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'border-neutral-600 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Aproveitamentos
          </Button>
          <Button
            variant={activeAgent === 'coordenacao' ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchAgent('coordenacao')}
            className={`${
              activeAgent === 'coordenacao' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'border-neutral-600 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Coordenação
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[500px] p-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 bg-blue-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {activeAgent === 'general' ? 'Olá! Sou a IA da Administração' :
                 activeAgent === 'aproveitamentos' ? 'Olá! Sou o Agente de Aproveitamentos' :
                 'Olá! Sou o Agente de Coordenação'}
              </h3>
              <p className="text-neutral-400 mb-4">
                {activeAgent === 'general' ? 
                  'Posso ajudar você com informações sobre procedimentos administrativos, sistemas e políticas da UFSM. Faça sua pergunta!' :
                 activeAgent === 'aproveitamentos' ? 
                  'Posso analisar equivalência de disciplinas. Para encontrar as disciplinas disponíveis, acesse os links da UFSM. Cole o programa da disciplina cursada para começar.' :
                  'Posso ajudar com solicitações e orientações da coordenação do curso de Administração. Como posso ajudar?'}
              </p>
              <div className="space-y-2 text-sm text-neutral-500">
                <p>💡 Exemplos de perguntas:</p>
                <ul className="text-left space-y-1">
                  {activeAgent === 'general' ? (
                    <>
                      <li>• "Como acessar o sistema de tickets?"</li>
                      <li>• "Quais são os procedimentos administrativos?"</li>
                      <li>• "Como solicitar equipamentos?"</li>
                      <li>• "Qual a política de uso de equipamentos?"</li>
                    </>
                  ) : activeAgent === 'aproveitamentos' ? (
                    <>
                      <li>• "Encontre disciplinas em: https://www.ufsm.br/cursos/graduacao/santa-maria/administracao/informacoes-do-curriculo"</li>
                      <li>• "Cole aqui o programa da disciplina cursada"</li>
                      <li>• "Cole aqui o programa da disciplina equivalente"</li>
                      <li>• "Analise a equivalência entre as disciplinas"</li>
                    </>
                  ) : (
                    <>
                      <li>• "Como solicitar aproveitamento de disciplina?"</li>
                      <li>• "Quais são os horários de atendimento?"</li>
                      <li>• "Como solicitar declaração de matrícula?"</li>
                      <li>• "Quais são os procedimentos para trancamento?"</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Bot className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-800 border border-neutral-700 text-neutral-200'
                    }`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Processando...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className="flex items-center justify-between text-xs opacity-60">
                          <span>
                            {message.role === 'user' ? 'Você' : 'IA da Administração'}
                          </span>
                          <span>{formatTimestamp(message.timestamp)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <div className="p-4 border-t border-neutral-700">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              activeAgent === 'general' ? 'Digite sua pergunta sobre procedimentos administrativos...' :
              activeAgent === 'aproveitamentos' ? 'Cole aqui o programa da disciplina (código, nome, carga horária, ementa, objetivos...)' :
              'Digite sua solicitação para a coordenação...'
            }
            className="flex-1 bg-neutral-800 border-neutral-600 text-white resize-none"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
} 