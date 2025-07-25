"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Settings, Mail, MessageSquare, Database, Shield, Bell, Server, Zap, Save, TestTube } from "lucide-react"

interface SystemsPageProps {
  userRole: "user" | "coordinator"
}

export default function SystemsPage({ userRole }: SystemsPageProps) {
  const [activeTab, setActiveTab] = useState("email") // "email", "whatsapp", "ai", "security", "notifications"

  if (userRole === "user") {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">ACESSO RESTRITO</h2>
          <p className="text-neutral-400">Esta seção é disponível apenas para coordenadores</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">CONFIGURAÇÕES DO SISTEMA</h1>
          <p className="text-sm text-blue-200">Configure integrações e parâmetros do sistema</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "email", icon: Mail, label: "E-MAIL" },
          { id: "whatsapp", icon: MessageSquare, label: "WHATSAPP" },
          { id: "ai", icon: Zap, label: "INTELIGÊNCIA ARTIFICIAL" },
          { id: "security", icon: Shield, label: "SEGURANÇA" },
          { id: "notifications", icon: Bell, label: "NOTIFICAÇÕES" },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id)}
            className={`${
              activeTab === tab.id 
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                : "text-blue-300 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Email Configuration */}
      {activeTab === "email" && (
        <div className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-blue-200 tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4" />
                CONFIGURAÇÃO SMTP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-blue-200 mb-2 block">SERVIDOR SMTP</label>
                  <Input 
                    placeholder="smtp.gmail.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    defaultValue="smtp.empresa.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-200 mb-2 block">PORTA</label>
                  <Input 
                    placeholder="587"
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    defaultValue="587"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-200 mb-2 block">USUÁRIO</label>
                  <Input 
                    placeholder="sistema@empresa.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    defaultValue="tickets@empresa.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-200 mb-2 block">SENHA</label>
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="ssl" defaultChecked />
                  <label htmlFor="ssl" className="text-sm text-blue-200">Usar SSL/TLS</label>
                </div>
                <Button variant="outline" className="border-white/20 text-blue-300 hover:bg-white/10 hover:text-white bg-transparent">
                  <TestTube className="w-4 h-4 mr-2" />
                  Testar Conexão
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">TEMPLATES DE E-MAIL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">NOVO TICKET</label>
                <Textarea 
                  placeholder="Template para notificação de novo ticket..."
                  className="bg-neutral-800 border-neutral-600 text-white"
                  defaultValue="Olá {nome}, seu ticket {id} foi criado com sucesso. Acompanhe o status em nosso sistema."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">RESPOSTA DO COORDENADOR</label>
                <Textarea 
                  placeholder="Template para resposta do coordenador..."
                  className="bg-neutral-800 border-neutral-600 text-white"
                  defaultValue="Olá {nome}, temos uma atualização sobre seu ticket {id}: {resposta}"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">TICKET FINALIZADO</label>
                <Textarea 
                  placeholder="Template para ticket finalizado..."
                  className="bg-neutral-800 border-neutral-600 text-white"
                  defaultValue="Olá {nome}, seu ticket {id} foi finalizado. Obrigado por usar nosso sistema de suporte."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* WhatsApp Configuration */}
      {activeTab === "whatsapp" && (
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                INTEGRAÇÃO WHATSAPP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">API ENDPOINT</label>
                  <Input 
                    placeholder="https://api.whatsapp.com/send"
                    className="bg-neutral-800 border-neutral-600 text-white"
                    defaultValue="https://api.whatsapp.business/v1/messages"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">TOKEN DE ACESSO</label>
                  <Input 
                    type="password"
                    placeholder="••••••••••••••••"
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">NÚMERO REMETENTE</label>
                  <Input 
                    placeholder="5511999999999"
                    className="bg-neutral-800 border-neutral-600 text-white"
                    defaultValue="5511987654321"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">WEBHOOK URL</label>
                  <Input 
                    placeholder="https://sistema.empresa.com/webhook"
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="whatsapp-enabled" defaultChecked />
                  <label htmlFor="whatsapp-enabled" className="text-sm text-neutral-300">Habilitar WhatsApp</label>
                </div>
                <Button variant="outline" className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent">
                  <TestTube className="w-4 h-4 mr-2" />
                  Testar Integração
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">TEMPLATES WHATSAPP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">NOVO TICKET</label>
                <Textarea 
                  placeholder="Template para WhatsApp..."
                  className="bg-neutral-800 border-neutral-600 text-white"
                  defaultValue="🎫 *Ticket Criado* \nOlá {nome}! Seu ticket {id} foi criado. Acompanhe: {link}"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">RESPOSTA</label>
                <Textarea 
                  placeholder="Template para resposta..."
                  className="bg-neutral-800 border-neutral-600 text-white"
                  defaultValue="📝 *Atualização do Ticket {id}* \n{resposta} \n\nAcesse: {link}"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Configuration */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4" />
                CONFIGURAÇÃO DA IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">PROVEDOR DE IA</label>
                  <select className="w-full p-2 bg-neutral-800 border border-neutral-600 text-white rounded">
                    <option value="openai">OpenAI GPT</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="google">Google Gemini</option>
                    <option value="local">Modelo Local</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">MODELO</label>
                  <select className="w-full p-2 bg-neutral-800 border border-neutral-600 text-white rounded">
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">API KEY</label>
                  <Input 
                    type="password"
                    placeholder="sk-••••••••••••••••••••••••••••••••••"
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">TEMPERATURA</label>
                  <Input 
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    placeholder="0.7"
                    className="bg-neutral-800 border-neutral-600 text-white"
                    defaultValue="0.7"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="ai-enabled" defaultChecked />
                  <label htmlFor="ai-enabled" className="text-sm text-neutral-300">Habilitar Sugestões de IA</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-response" />
                  <label htmlFor="auto-response" className="text-sm text-neutral-300">Resposta Automática</label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PROMPT SYSTEM</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">PROMPT PRINCIPAL</label>
                <Textarea 
                  placeholder="Prompt principal para a IA..."
                  className="bg-neutral-800 border-neutral-600 text-white min-h-[120px]"
                  defaultValue="Você é um assistente especializado em suporte técnico. Analise o ticket e forneça uma resposta profissional e útil baseada na knowledge base disponível. Seja claro, objetivo e empático."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">CONTEXTO ADICIONAL</label>
                <Textarea 
                  placeholder="Contexto adicional sobre a empresa/sistema..."
                  className="bg-neutral-800 border-neutral-600 text-white"
                  defaultValue="Nossa empresa é uma instituição educacional com foco em tecnologia. Temos sistemas internos para gestão acadêmica e administrativa."
                />
              </div>
              <Button variant="outline" className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent">
                <TestTube className="w-4 h-4 mr-2" />
                Testar Prompt
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Configuration */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" />
                CONFIGURAÇÕES DE SEGURANÇA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="two-factor" />
                  <label htmlFor="two-factor" className="text-sm text-neutral-300">Autenticação de Dois Fatores</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="session-timeout" defaultChecked />
                  <label htmlFor="session-timeout" className="text-sm text-neutral-300">Timeout de Sessão</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="ip-restriction" />
                  <label htmlFor="ip-restriction" className="text-sm text-neutral-300">Restrição por IP</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="audit-log" defaultChecked />
                  <label htmlFor="audit-log" className="text-sm text-neutral-300">Log de Auditoria</label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">TIMEOUT (minutos)</label>
                  <Input 
                    type="number"
                    placeholder="30"
                    className="bg-neutral-800 border-neutral-600 text-white"
                    defaultValue="30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">TENTATIVAS DE LOGIN</label>
                  <Input 
                    type="number"
                    placeholder="5"
                    className="bg-neutral-800 border-neutral-600 text-white"
                    defaultValue="5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">BACKUP E RECUPERAÇÃO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-backup" defaultChecked />
                  <label htmlFor="auto-backup" className="text-sm text-neutral-300">Backup Automático</label>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">FREQUÊNCIA</label>
                  <select className="w-full p-2 bg-neutral-800 border border-neutral-600 text-white rounded">
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent">
                  <Database className="w-4 h-4 mr-2" />
                  Fazer Backup Agora
                </Button>
                <Button variant="outline" className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent">
                  <Server className="w-4 h-4 mr-2" />
                  Restaurar Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Configuration */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4" />
                CONFIGURAÇÕES DE NOTIFICAÇÕES
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                  <div>
                    <h4 className="text-sm font-medium text-white">Novos Tickets</h4>
                    <p className="text-xs text-neutral-400">Notificar quando um novo ticket for criado</p>
                  </div>
                  <Switch id="notify-new-tickets" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                  <div>
                    <h4 className="text-sm font-medium text-white">Respostas de Usuários</h4>
                    <p className="text-xs text-neutral-400">Notificar quando um usuário responder</p>
                  </div>
                  <Switch id="notify-user-responses" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                  <div>
                    <h4 className="text-sm font-medium text-white">Tickets Urgentes</h4>
                    <p className="text-xs text-neutral-400">Notificar imediatamente para tickets urgentes</p>
                  </div>
                  <Switch id="notify-urgent" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                  <div>
                    <h4 className="text-sm font-medium text-white">Relatórios Diários</h4>
                    <p className="text-xs text-neutral-400">Enviar resumo diário por e-mail</p>
                  </div>
                  <Switch id="daily-reports" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
