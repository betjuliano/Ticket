# Plano de Implementação - Sistema Ticket Avançado

## Visão Geral do Projeto

Este documento apresenta um plano abrangente para implementar melhorias significativas no sistema de gerenciamento de tickets, transformando-o em uma solução empresarial completa e funcional. O projeto será dividido em 8 fases principais, cada uma com objetivos específicos e entregáveis claros.

## Objetivos Principais

1. **Funcionalidade Completa**: Implementar CRUD completo para usuários e coordenadores
2. **Inteligência Artificial**: Integrar chat IA para busca na base de conhecimento
3. **Automação de Email**: Sistema automático de criação de tickets via email
4. **Analytics Avançados**: Dashboards customizáveis com métricas detalhadas
5. **Performance Otimizada**: Cache Redis, lazy loading e otimizações
6. **Produção Ready**: Migração para dados reais e documentação completa

## Estrutura do Projeto

### Tecnologias Principais
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco de Dados**: PostgreSQL (externo: 207.180.254.250)
- **Cache**: Redis
- **IA**: OpenAI API para chat inteligente
- **Email**: Nodemailer com Gmail SMTP
- **Analytics**: Chart.js, Recharts
- **Documentação**: Swagger/OpenAPI

### Configurações de Produção
- **Domínio**: https://iaadm.iaprojetos.com.br
- **Email Principal**: iadaadmufsm@gmail.com
- **Email Admin**: admjulianoo@gmail.com
- **Banco**: PostgreSQL externo configurado

## Fase 1: Planejamento e Estruturação

### 1.1 Análise de Requisitos Detalhada

#### Funcionalidades do Usuário
- Dashboard personalizado com métricas relevantes
- CRUD completo de tickets (criar, visualizar, editar, comentar)
- Sistema de busca avançada com filtros
- Chat IA integrado na base de conhecimento
- Notificações em tempo real
- Histórico completo de atividades

#### Funcionalidades do Coordenador
- Dashboard administrativo com analytics completos
- Gerenciamento completo de tickets (atribuição, priorização, fechamento)
- Relatórios customizáveis e exportação
- Gerenciamento de usuários e permissões
- Configurações do sistema
- Monitoramento de performance

#### Funcionalidades Administrativas
- Integração automática de email
- Sistema de notificações multi-canal
- Backup e recuperação de dados
- Logs de auditoria
- Configurações de segurança

### 1.2 Arquitetura do Sistema

#### Estrutura de Pastas Proposta
```
app/
├── (dashboard)/
│   ├── user/
│   │   ├── tickets/
│   │   ├── knowledge/
│   │   └── profile/
│   ├── coordinator/
│   │   ├── tickets/
│   │   ├── users/
│   │   ├── reports/
│   │   └── settings/
│   └── admin/
├── api/
│   ├── tickets/
│   ├── users/
│   ├── knowledge/
│   ├── chat/
│   ├── email/
│   ├── reports/
│   └── notifications/
├── components/
│   ├── ui/
│   ├── forms/
│   ├── charts/
│   └── layout/
└── lib/
    ├── database/
    ├── email/
    ├── ai/
    └── utils/
```

#### Modelo de Dados

##### Tabelas Principais
1. **users** - Usuários do sistema
2. **tickets** - Tickets de suporte
3. **comments** - Comentários nos tickets
4. **attachments** - Anexos
5. **knowledge_base** - Base de conhecimento
6. **notifications** - Notificações
7. **audit_logs** - Logs de auditoria
8. **email_integrations** - Integrações de email

### 1.3 Cronograma de Implementação

#### Fase 1: Fundação (Semanas 1-2)
- Configuração do banco de dados PostgreSQL externo
- Migração de dados mock para produção
- Configuração do ambiente de desenvolvimento

#### Fase 2: CRUD e Interfaces (Semanas 3-4)
- Implementação completa do CRUD de tickets
- Interfaces de usuário e coordenador
- Sistema de permissões

#### Fase 3: IA e Email (Semanas 5-6)
- Chat IA para base de conhecimento
- Integração automática de email
- Sistema de notificações

#### Fase 4: Analytics e Relatórios (Semanas 7-8)
- Dashboards customizáveis
- Sistema de relatórios avançados
- Métricas e KPIs

#### Fase 5: Otimização (Semanas 9-10)
- Cache Redis
- Otimizações de performance
- Lazy loading e CDN

#### Fase 6: Documentação e Testes (Semanas 11-12)
- Documentação da API
- Testes automatizados
- Deploy de produção

## Fase 2: Configuração da Base de Dados

### 2.1 Configuração do PostgreSQL Externo

#### Conexão com Banco Externo
```typescript
// lib/database/connection.ts
const DATABASE_URL = `postgresql://postgres:5100a23f8d3196cfce339c43d475b3e0@207.180.254.250:5432/ticket_system`
```

#### Schema do Banco de Dados

##### Tabela Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  department VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### Tabela Tickets
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  category VARCHAR(100),
  subcategory VARCHAR(100),
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  resolved_by UUID REFERENCES users(id),
  email_thread_id VARCHAR(255),
  sla_due_date TIMESTAMP,
  resolution_time INTEGER,
  satisfaction_rating INTEGER,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP
);
```

### 2.2 Migrações Prisma

#### Schema Prisma Completo
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String    @unique
  name          String
  passwordHash  String    @map("password_hash")
  role          Role      @default(USER)
  department    String?
  phone         String?
  avatarUrl     String?   @map("avatar_url")
  isActive      Boolean   @default(true) @map("is_active")
  lastLogin     DateTime? @map("last_login")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  createdTickets   Ticket[] @relation("TicketCreator")
  assignedTickets  Ticket[] @relation("TicketAssignee")
  resolvedTickets  Ticket[] @relation("TicketResolver")
  comments         Comment[]
  notifications    Notification[]
  auditLogs        AuditLog[]

  @@map("users")
}

enum Role {
  USER
  COORDINATOR
  ADMIN
}

model Ticket {
  id                String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title             String
  description       String
  status            TicketStatus @default(OPEN)
  priority          Priority   @default(MEDIUM)
  category          String?
  subcategory       String?
  createdById       String     @map("created_by") @db.Uuid
  assignedToId      String?    @map("assigned_to") @db.Uuid
  resolvedById      String?    @map("resolved_by") @db.Uuid
  emailThreadId     String?    @map("email_thread_id")
  slaDueDate        DateTime?  @map("sla_due_date")
  resolutionTime    Int?       @map("resolution_time")
  satisfactionRating Int?      @map("satisfaction_rating")
  tags              String[]
  createdAt         DateTime   @default(now()) @map("created_at")
  updatedAt         DateTime   @updatedAt @map("updated_at")
  resolvedAt        DateTime?  @map("resolved_at")
  closedAt          DateTime?  @map("closed_at")

  createdBy    User       @relation("TicketCreator", fields: [createdById], references: [id])
  assignedTo   User?      @relation("TicketAssignee", fields: [assignedToId], references: [id])
  resolvedBy   User?      @relation("TicketResolver", fields: [resolvedById], references: [id])
  comments     Comment[]
  attachments  Attachment[]
  auditLogs    AuditLog[]

  @@map("tickets")
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_USER
  WAITING_VENDOR
  RESOLVED
  CLOSED
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
  URGENT
}
```

### 2.3 Seeders de Dados Iniciais

#### Dados de Usuários Padrão
```typescript
// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Criar usuários padrão
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@iaadm.com',
      name: 'Administrador',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: Role.ADMIN,
      department: 'TI'
    }
  })

  const coordinatorUser = await prisma.user.create({
    data: {
      email: 'coordenador@iaadm.com',
      name: 'Coordenador',
      passwordHash: await bcrypt.hash('coord123', 10),
      role: Role.COORDINATOR,
      department: 'Suporte'
    }
  })

  // Criar categorias padrão
  const categories = [
    'Hardware',
    'Software',
    'Rede',
    'Email',
    'Acesso',
    'Impressão',
    'Telefonia',
    'Outros'
  ]

  // Criar tickets de exemplo
  for (let i = 1; i <= 10; i++) {
    await prisma.ticket.create({
      data: {
        title: `Ticket de Exemplo ${i}`,
        description: `Descrição detalhada do problema ${i}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        createdById: adminUser.id,
        assignedToId: coordinatorUser.id
      }
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## Fase 3: Implementação do CRUD Completo

### 3.1 Interface do Usuário

#### Dashboard do Usuário
```typescript
// app/(dashboard)/user/page.tsx
import { TicketStats } from '@/components/dashboard/TicketStats'
import { RecentTickets } from '@/components/dashboard/RecentTickets'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default function UserDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <QuickActions />
      </div>
      
      <TicketStats />
      <RecentTickets />
    </div>
  )
}
```

#### Gerenciamento de Tickets
```typescript
// app/(dashboard)/user/tickets/page.tsx
import { TicketList } from '@/components/tickets/TicketList'
import { TicketFilters } from '@/components/tickets/TicketFilters'
import { CreateTicketButton } from '@/components/tickets/CreateTicketButton'

export default function UserTickets() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meus Tickets</h1>
        <CreateTicketButton />
      </div>
      
      <TicketFilters />
      <TicketList />
    </div>
  )
}
```

### 3.2 Interface do Coordenador

#### Dashboard Administrativo
```typescript
// app/(dashboard)/coordinator/page.tsx
import { AdminStats } from '@/components/dashboard/AdminStats'
import { TicketQueue } from '@/components/dashboard/TicketQueue'
import { PerformanceMetrics } from '@/components/dashboard/PerformanceMetrics'

export default function CoordinatorDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      
      <AdminStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TicketQueue />
        <PerformanceMetrics />
      </div>
    </div>
  )
}
```

### 3.3 APIs Funcionais

#### API de Tickets Completa
```typescript
// app/api/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { ticketSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')

    const where = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { category }),
      ...(session.user.role === 'USER' && { createdById: session.user.id })
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        createdBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
        _count: { select: { comments: true, attachments: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.ticket.count({ where })

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ticketSchema.parse(body)

    const ticket = await prisma.ticket.create({
      data: {
        ...validatedData,
        createdById: session.user.id
      },
      include: {
        createdBy: { select: { name: true, email: true } }
      }
    })

    // Enviar notificação para coordenadores
    await sendNewTicketNotification(ticket)

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

## Fase 4: Sistema de Chat IA e Integração de Email

### 4.1 Chat IA para Base de Conhecimento

#### Implementação do Chat
```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { prisma } from '@/lib/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    // Buscar documentos relevantes na base de conhecimento
    const knowledgeBase = await prisma.knowledgeBase.findMany({
      where: {
        OR: [
          { title: { contains: message, mode: 'insensitive' } },
          { content: { contains: message, mode: 'insensitive' } },
          { tags: { hasSome: message.split(' ') } }
        ]
      },
      take: 5
    })

    const contextText = knowledgeBase
      .map(doc => `${doc.title}: ${doc.content}`)
      .join('\n\n')

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um assistente de suporte técnico especializado. Use as informações da base de conhecimento para responder às perguntas dos usuários de forma clara e útil. Se não encontrar informações relevantes, sugira que o usuário abra um ticket.

Base de conhecimento:
${contextText}`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })

    const response = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.'

    return NextResponse.json({
      response,
      sources: knowledgeBase.map(doc => ({
        title: doc.title,
        id: doc.id
      }))
    })
  } catch (error) {
    console.error('Chat AI Error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
```

#### Componente de Chat
```typescript
// components/chat/KnowledgeChat.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MessageCircle, Send } from 'lucide-react'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  sources?: { title: string; id: string }[]
}

export function KnowledgeChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
        sources: data.sources
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-96 flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Assistente IA - Base de Conhecimento
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isUser
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p>{message.content}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 text-xs opacity-75">
                  Fontes: {message.sources.map(s => s.title).join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua pergunta..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage} disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
```

### 4.2 Integração Automática de Email

#### Configuração do Gmail
```typescript
// lib/email/gmail.ts
import { google } from 'googleapis'
import { prisma } from '@/lib/database'

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
)

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
})

const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

export async function processIncomingEmails() {
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'to:iadaadmufsm@gmail.com is:unread'
    })

    const messages = response.data.messages || []

    for (const message of messages) {
      await processEmailMessage(message.id!)
    }
  } catch (error) {
    console.error('Error processing emails:', error)
  }
}

async function processEmailMessage(messageId: string) {
  try {
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId
    })

    const headers = message.data.payload?.headers || []
    const fromHeader = headers.find(h => h.name === 'From')
    const subjectHeader = headers.find(h => h.name === 'Subject')
    
    const fromEmail = extractEmail(fromHeader?.value || '')
    const subject = subjectHeader?.value || 'Sem assunto'
    
    // Extrair corpo do email
    const body = extractEmailBody(message.data.payload)
    
    // Verificar se é do admin para extrair email correto
    let userEmail = fromEmail
    if (fromEmail === 'admjulianoo@gmail.com') {
      userEmail = extractUserEmailFromBody(body) || fromEmail
    }

    // Buscar ou criar usuário
    let user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: extractNameFromEmail(userEmail),
          passwordHash: '', // Será definido no primeiro login
          role: 'USER'
        }
      })
    }

    // Criar ticket
    const ticket = await prisma.ticket.create({
      data: {
        title: subject,
        description: body,
        createdById: user.id,
        emailThreadId: messageId,
        category: 'Email'
      }
    })

    // Marcar email como lido
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    })

    // Enviar confirmação
    await sendTicketConfirmation(userEmail, ticket)

  } catch (error) {
    console.error('Error processing email message:', error)
  }
}

function extractEmail(fromString: string): string {
  const match = fromString.match(/<(.+)>/)
  return match ? match[1] : fromString
}

function extractEmailBody(payload: any): string {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString()
  }
  
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString()
      }
    }
  }
  
  return 'Corpo do email não disponível'
}

function extractUserEmailFromBody(body: string): string | null {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  const emails = body.match(emailRegex)
  return emails ? emails[0] : null
}

async function sendTicketConfirmation(email: string, ticket: any) {
  // Implementar envio de confirmação
  const nodemailer = require('nodemailer')
  
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: 'iadaadmufsm@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD
    }
  })

  await transporter.sendMail({
    from: 'iadaadmufsm@gmail.com',
    to: email,
    subject: `Ticket #${ticket.id.slice(-8)} - ${ticket.title}`,
    html: `
      <h2>Ticket Criado com Sucesso</h2>
      <p>Seu ticket foi criado automaticamente:</p>
      <ul>
        <li><strong>ID:</strong> ${ticket.id}</li>
        <li><strong>Título:</strong> ${ticket.title}</li>
        <li><strong>Status:</strong> ${ticket.status}</li>
      </ul>
      <p>Você pode acompanhar o andamento em: https://iaadm.iaprojetos.com.br</p>
    `
  })
}
```

#### Cron Job para Processamento
```typescript
// app/api/cron/process-emails/route.ts
import { NextResponse } from 'next/server'
import { processIncomingEmails } from '@/lib/email/gmail'

export async function GET() {
  try {
    await processIncomingEmails()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Failed to process emails' }, { status: 500 })
  }
}
```

### 4.3 Configuração OAuth para Gmail

#### Origens JavaScript Autorizadas
Para o domínio `https://iaadm.iaprojetos.com.br`:
- `https://iaadm.iaprojetos.com.br`
- `https://iaadm.iaprojetos.com.br:443`

#### URIs de Redirecionamento Autorizados
- `https://iaadm.iaprojetos.com.br/api/auth/callback/google`
- `https://iaadm.iaprojetos.com.br/auth/gmail/callback`

#### Variáveis de Ambiente Necessárias
```env
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REDIRECT_URI=https://iaadm.iaprojetos.com.br/auth/gmail/callback
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_APP_PASSWORD=your_app_password
```

---

**Autor**: Manus AI  
**Data**: 25 de julho de 2025  
**Versão**: 1.0


## Fase 5: Relatórios, Analytics e Dashboards

### 5.1 Sistema de Relatórios Avançados

#### Componente de Relatórios Customizáveis
```typescript
// components/reports/ReportBuilder.tsx
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Chart } from '@/components/charts/Chart'

interface ReportConfig {
  type: 'tickets' | 'users' | 'performance'
  dateRange: { start: Date; end: Date }
  groupBy: 'day' | 'week' | 'month'
  filters: Record<string, any>
  chartType: 'line' | 'bar' | 'pie' | 'area'
}

export function ReportBuilder() {
  const [config, setConfig] = useState<ReportConfig>({
    type: 'tickets',
    dateRange: { start: new Date(), end: new Date() },
    groupBy: 'day',
    filters: {},
    chartType: 'line'
  })
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const generateReport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const reportData = await response.json()
      setData(reportData)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, format })
      })
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report.${format}`
      a.click()
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Configuração do Relatório</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Relatório</label>
            <Select
              value={config.type}
              onValueChange={(value) => setConfig(prev => ({ ...prev, type: value as any }))}
            >
              <option value="tickets">Tickets</option>
              <option value="users">Usuários</option>
              <option value="performance">Performance</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Agrupar por</label>
            <Select
              value={config.groupBy}
              onValueChange={(value) => setConfig(prev => ({ ...prev, groupBy: value as any }))}
            >
              <option value="day">Dia</option>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Gráfico</label>
            <Select
              value={config.chartType}
              onValueChange={(value) => setConfig(prev => ({ ...prev, chartType: value as any }))}
            >
              <option value="line">Linha</option>
              <option value="bar">Barra</option>
              <option value="pie">Pizza</option>
              <option value="area">Área</option>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button onClick={generateReport} disabled={isLoading}>
              {isLoading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </div>
      </Card>

      {data && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Resultado do Relatório</h3>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => exportReport('pdf')}>
                Exportar PDF
              </Button>
              <Button variant="outline" onClick={() => exportReport('excel')}>
                Exportar Excel
              </Button>
              <Button variant="outline" onClick={() => exportReport('csv')}>
                Exportar CSV
              </Button>
            </div>
          </div>
          
          <Chart data={data} type={config.chartType} />
        </Card>
      )}
    </div>
  )
}
```

#### API de Relatórios
```typescript
// app/api/reports/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || session.user.role === 'USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, dateRange, groupBy, filters } = await request.json()

    let data = []

    switch (type) {
      case 'tickets':
        data = await generateTicketReport(dateRange, groupBy, filters)
        break
      case 'users':
        data = await generateUserReport(dateRange, groupBy, filters)
        break
      case 'performance':
        data = await generatePerformanceReport(dateRange, groupBy, filters)
        break
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function generateTicketReport(dateRange: any, groupBy: string, filters: any) {
  const groupByClause = getGroupByClause(groupBy)
  
  const result = await prisma.$queryRaw`
    SELECT 
      ${groupByClause} as period,
      COUNT(*) as total_tickets,
      COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_tickets,
      COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_tickets,
      COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_tickets,
      AVG(CASE WHEN resolved_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
      END) as avg_resolution_time_hours
    FROM tickets 
    WHERE created_at BETWEEN ${dateRange.start} AND ${dateRange.end}
    GROUP BY ${groupByClause}
    ORDER BY period
  `

  return result
}

async function generateUserReport(dateRange: any, groupBy: string, filters: any) {
  const result = await prisma.$queryRaw`
    SELECT 
      ${getGroupByClause(groupBy)} as period,
      COUNT(DISTINCT created_by) as active_users,
      COUNT(*) as tickets_created,
      AVG(satisfaction_rating) as avg_satisfaction
    FROM tickets 
    WHERE created_at BETWEEN ${dateRange.start} AND ${dateRange.end}
    GROUP BY ${getGroupByClause(groupBy)}
    ORDER BY period
  `

  return result
}

async function generatePerformanceReport(dateRange: any, groupBy: string, filters: any) {
  const result = await prisma.$queryRaw`
    SELECT 
      ${getGroupByClause(groupBy)} as period,
      COUNT(*) as total_tickets,
      COUNT(CASE WHEN resolved_at <= sla_due_date THEN 1 END) as sla_met,
      COUNT(CASE WHEN resolved_at > sla_due_date THEN 1 END) as sla_missed,
      AVG(CASE WHEN resolved_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
      END) as avg_resolution_time
    FROM tickets 
    WHERE created_at BETWEEN ${dateRange.start} AND ${dateRange.end}
    GROUP BY ${getGroupByClause(groupBy)}
    ORDER BY period
  `

  return result
}

function getGroupByClause(groupBy: string): string {
  switch (groupBy) {
    case 'day':
      return "DATE_TRUNC('day', created_at)"
    case 'week':
      return "DATE_TRUNC('week', created_at)"
    case 'month':
      return "DATE_TRUNC('month', created_at)"
    default:
      return "DATE_TRUNC('day', created_at)"
  }
}
```

### 5.2 Dashboard Avançado com Analytics

#### Componente de Métricas Principais
```typescript
// components/dashboard/AdvancedMetrics.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { LineChart, BarChart, PieChart, AreaChart } from '@/components/charts'

interface Metrics {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  avgResolutionTime: number
  userSatisfaction: number
  slaCompliance: number
  trends: {
    ticketsCreated: number[]
    ticketsResolved: number[]
    responseTime: number[]
  }
  categoryDistribution: { name: string; value: number }[]
  priorityDistribution: { name: string; value: number }[]
}

export function AdvancedMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [timeRange])

  const fetchMetrics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/metrics?range=${timeRange}`)
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !metrics) {
    return <div>Carregando métricas...</div>
  }

  const metricCards = [
    {
      title: 'Total de Tickets',
      value: metrics.totalTickets,
      icon: Users,
      trend: calculateTrend(metrics.trends.ticketsCreated),
      color: 'blue'
    },
    {
      title: 'Tickets Abertos',
      value: metrics.openTickets,
      icon: AlertCircle,
      trend: 0,
      color: 'orange'
    },
    {
      title: 'Tickets Resolvidos',
      value: metrics.resolvedTickets,
      icon: CheckCircle,
      trend: calculateTrend(metrics.trends.ticketsResolved),
      color: 'green'
    },
    {
      title: 'Tempo Médio de Resolução',
      value: `${metrics.avgResolutionTime.toFixed(1)}h`,
      icon: Clock,
      trend: calculateTrend(metrics.trends.responseTime) * -1, // Inverter porque menor é melhor
      color: 'purple'
    },
    {
      title: 'Satisfação do Usuário',
      value: `${(metrics.userSatisfaction * 20).toFixed(1)}%`, // Converter de 1-5 para %
      icon: TrendingUp,
      trend: 0,
      color: 'indigo'
    },
    {
      title: 'Conformidade SLA',
      value: `${(metrics.slaCompliance * 100).toFixed(1)}%`,
      icon: CheckCircle,
      trend: 0,
      color: 'emerald'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Seletor de Período */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Avançados</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
          <option value="1y">Último ano</option>
        </select>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
                {metric.trend !== 0 && (
                  <div className={`flex items-center mt-2 text-sm ${
                    metric.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend > 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(metric.trend).toFixed(1)}%
                  </div>
                )}
              </div>
              <metric.icon className={`h-8 w-8 text-${metric.color}-500`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tendência de Tickets</h3>
          <LineChart
            data={metrics.trends.ticketsCreated.map((value, index) => ({
              date: new Date(Date.now() - (metrics.trends.ticketsCreated.length - index) * 24 * 60 * 60 * 1000).toLocaleDateString(),
              created: value,
              resolved: metrics.trends.ticketsResolved[index] || 0
            }))}
            xKey="date"
            yKeys={['created', 'resolved']}
            colors={['#3b82f6', '#10b981']}
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Categoria</h3>
          <PieChart
            data={metrics.categoryDistribution}
            dataKey="value"
            nameKey="name"
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Prioridade</h3>
          <BarChart
            data={metrics.priorityDistribution}
            xKey="name"
            yKey="value"
            color="#8b5cf6"
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tempo de Resposta</h3>
          <AreaChart
            data={metrics.trends.responseTime.map((value, index) => ({
              date: new Date(Date.now() - (metrics.trends.responseTime.length - index) * 24 * 60 * 60 * 1000).toLocaleDateString(),
              time: value
            }))}
            xKey="date"
            yKey="time"
            color="#f59e0b"
          />
        </Card>
      </div>
    </div>
  )
}

function calculateTrend(data: number[]): number {
  if (data.length < 2) return 0
  const recent = data.slice(-3).reduce((a, b) => a + b, 0) / 3
  const previous = data.slice(-6, -3).reduce((a, b) => a + b, 0) / 3
  return previous === 0 ? 0 : ((recent - previous) / previous) * 100
}
```

#### API de Analytics
```typescript
// app/api/analytics/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'
    
    const days = parseInt(range.replace('d', '')) || 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Métricas básicas
    const totalTickets = await prisma.ticket.count({
      where: { createdAt: { gte: startDate } }
    })

    const openTickets = await prisma.ticket.count({
      where: { 
        status: 'OPEN',
        createdAt: { gte: startDate }
      }
    })

    const resolvedTickets = await prisma.ticket.count({
      where: { 
        status: { in: ['RESOLVED', 'CLOSED'] },
        createdAt: { gte: startDate }
      }
    })

    // Tempo médio de resolução
    const avgResolutionResult = await prisma.$queryRaw`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours
      FROM tickets 
      WHERE resolved_at IS NOT NULL 
      AND created_at >= ${startDate}
    ` as any[]

    const avgResolutionTime = avgResolutionResult[0]?.avg_hours || 0

    // Satisfação do usuário
    const satisfactionResult = await prisma.$queryRaw`
      SELECT AVG(satisfaction_rating) as avg_rating
      FROM tickets 
      WHERE satisfaction_rating IS NOT NULL 
      AND created_at >= ${startDate}
    ` as any[]

    const userSatisfaction = satisfactionResult[0]?.avg_rating || 0

    // Conformidade SLA
    const slaResult = await prisma.$queryRaw`
      SELECT 
        COUNT(CASE WHEN resolved_at <= sla_due_date THEN 1 END)::float / COUNT(*)::float as compliance
      FROM tickets 
      WHERE sla_due_date IS NOT NULL 
      AND resolved_at IS NOT NULL
      AND created_at >= ${startDate}
    ` as any[]

    const slaCompliance = slaResult[0]?.compliance || 0

    // Tendências diárias
    const dailyTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as created,
        COUNT(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 END) as resolved,
        AVG(CASE WHEN resolved_at IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
        END) as avg_time
      FROM tickets 
      WHERE created_at >= ${startDate}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    ` as any[]

    // Distribuição por categoria
    const categoryDistribution = await prisma.$queryRaw`
      SELECT 
        COALESCE(category, 'Sem categoria') as name,
        COUNT(*) as value
      FROM tickets 
      WHERE created_at >= ${startDate}
      GROUP BY category
      ORDER BY value DESC
    ` as any[]

    // Distribuição por prioridade
    const priorityDistribution = await prisma.$queryRaw`
      SELECT 
        priority as name,
        COUNT(*) as value
      FROM tickets 
      WHERE created_at >= ${startDate}
      GROUP BY priority
      ORDER BY 
        CASE priority 
          WHEN 'URGENT' THEN 1
          WHEN 'CRITICAL' THEN 2
          WHEN 'HIGH' THEN 3
          WHEN 'MEDIUM' THEN 4
          WHEN 'LOW' THEN 5
        END
    ` as any[]

    const metrics = {
      totalTickets,
      openTickets,
      resolvedTickets,
      avgResolutionTime: Number(avgResolutionTime),
      userSatisfaction: Number(userSatisfaction),
      slaCompliance: Number(slaCompliance),
      trends: {
        ticketsCreated: dailyTrends.map(d => Number(d.created)),
        ticketsResolved: dailyTrends.map(d => Number(d.resolved)),
        responseTime: dailyTrends.map(d => Number(d.avg_time) || 0)
      },
      categoryDistribution: categoryDistribution.map(c => ({
        name: c.name,
        value: Number(c.value)
      })),
      priorityDistribution: priorityDistribution.map(p => ({
        name: p.name,
        value: Number(p.value)
      }))
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

## Fase 6: Notificações e Otimizações de Performance

### 6.1 Sistema de Notificações

#### Configuração do SendGrid (Gratuito)
```typescript
// lib/notifications/email.ts
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendEmailNotification(
  to: string,
  subject: string,
  html: string,
  templateId?: string,
  templateData?: any
) {
  try {
    const msg = {
      to,
      from: 'iadaadmufsm@gmail.com',
      subject,
      html,
      ...(templateId && {
        templateId,
        dynamicTemplateData: templateData
      })
    }

    await sgMail.send(msg)
    console.log('Email sent successfully')
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
}

export async function sendTicketNotification(ticket: any, type: 'created' | 'updated' | 'assigned' | 'resolved') {
  const templates = {
    created: {
      subject: `Novo Ticket #${ticket.id.slice(-8)} - ${ticket.title}`,
      html: `
        <h2>Novo Ticket Criado</h2>
        <p><strong>ID:</strong> ${ticket.id}</p>
        <p><strong>Título:</strong> ${ticket.title}</p>
        <p><strong>Prioridade:</strong> ${ticket.priority}</p>
        <p><strong>Status:</strong> ${ticket.status}</p>
        <p><a href="https://iaadm.iaprojetos.com.br/tickets/${ticket.id}">Ver Ticket</a></p>
      `
    },
    updated: {
      subject: `Ticket Atualizado #${ticket.id.slice(-8)} - ${ticket.title}`,
      html: `
        <h2>Ticket Atualizado</h2>
        <p>O ticket foi atualizado com novas informações.</p>
        <p><a href="https://iaadm.iaprojetos.com.br/tickets/${ticket.id}">Ver Ticket</a></p>
      `
    },
    assigned: {
      subject: `Ticket Atribuído #${ticket.id.slice(-8)} - ${ticket.title}`,
      html: `
        <h2>Ticket Atribuído a Você</h2>
        <p>Um novo ticket foi atribuído a você.</p>
        <p><a href="https://iaadm.iaprojetos.com.br/tickets/${ticket.id}">Ver Ticket</a></p>
      `
    },
    resolved: {
      subject: `Ticket Resolvido #${ticket.id.slice(-8)} - ${ticket.title}`,
      html: `
        <h2>Ticket Resolvido</h2>
        <p>Seu ticket foi resolvido. Por favor, avalie nossa solução.</p>
        <p><a href="https://iaadm.iaprojetos.com.br/tickets/${ticket.id}">Ver Ticket</a></p>
      `
    }
  }

  const template = templates[type]
  
  // Enviar para o criador do ticket
  if (ticket.createdBy?.email) {
    await sendEmailNotification(ticket.createdBy.email, template.subject, template.html)
  }

  // Enviar para o responsável se for diferente do criador
  if (ticket.assignedTo?.email && ticket.assignedTo.email !== ticket.createdBy?.email) {
    await sendEmailNotification(ticket.assignedTo.email, template.subject, template.html)
  }
}
```

#### WebSockets para Notificações em Tempo Real
```typescript
// lib/notifications/websocket.ts
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

let io: SocketIOServer

export function initializeWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "https://iaadm.iaprojetos.com.br",
      methods: ["GET", "POST"]
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('join-room', (userId) => {
      socket.join(`user-${userId}`)
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  return io
}

export function sendRealTimeNotification(userId: string, notification: any) {
  if (io) {
    io.to(`user-${userId}`).emit('notification', notification)
  }
}

export function broadcastToCoordinators(notification: any) {
  if (io) {
    io.emit('coordinator-notification', notification)
  }
}
```

### 6.2 Otimizações de Performance

#### Implementação de Cache Redis
```typescript
// lib/cache/redis.ts
import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
})

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidate error:', error)
    }
  }
}

// Middleware para cache de API
export function withCache(handler: any, ttl: number = 300) {
  return async (req: any, res: any) => {
    const cacheKey = `api:${req.url}:${JSON.stringify(req.query)}`
    
    // Tentar buscar do cache
    const cached = await CacheService.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    // Executar handler original
    const originalJson = res.json
    res.json = function(data: any) {
      // Salvar no cache
      CacheService.set(cacheKey, data, ttl)
      return originalJson.call(this, data)
    }

    return handler(req, res)
  }
}
```

#### Otimização de Imagens
```typescript
// components/ui/OptimizedImage.tsx
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  priority = false 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {!error ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true)
            setIsLoading(false)
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <span className="text-gray-400">Erro ao carregar imagem</span>
        </div>
      )}
    </div>
  )
}
```

#### Lazy Loading para Componentes
```typescript
// components/ui/LazyComponent.tsx
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy loading de componentes pesados
export const LazyChart = lazy(() => import('@/components/charts/Chart'))
export const LazyReportBuilder = lazy(() => import('@/components/reports/ReportBuilder'))
export const LazyAdvancedMetrics = lazy(() => import('@/components/dashboard/AdvancedMetrics'))

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <ComponentSkeleton />}>
      {children}
    </Suspense>
  )
}

function ComponentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  )
}
```

## Fase 7: Documentação API e Dashboards de Saúde

### 7.1 Documentação Swagger/OpenAPI

#### Configuração do Swagger
```typescript
// lib/swagger/config.ts
import { createSwaggerSpec } from 'next-swagger-doc'

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Ticket System API',
        version: '1.0.0',
        description: 'API completa para o sistema de gerenciamento de tickets',
        contact: {
          name: 'Suporte Técnico',
          email: 'iadaadmufsm@gmail.com'
        }
      },
      servers: [
        {
          url: 'https://iaadm.iaprojetos.com.br/api',
          description: 'Servidor de Produção'
        },
        {
          url: 'http://localhost:3000/api',
          description: 'Servidor de Desenvolvimento'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: {
          Ticket: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string', maxLength: 500 },
              description: { type: 'string' },
              status: { 
                type: 'string', 
                enum: ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'WAITING_VENDOR', 'RESOLVED', 'CLOSED', 'CANCELLED'] 
              },
              priority: { 
                type: 'string', 
                enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'] 
              },
              category: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            },
            required: ['title', 'description', 'status', 'priority']
          },
          User: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              role: { type: 'string', enum: ['USER', 'COORDINATOR', 'ADMIN'] },
              department: { type: 'string' },
              isActive: { type: 'boolean' }
            }
          },
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              code: { type: 'string' }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  })
  return spec
}
```

#### Página de Documentação
```typescript
// app/api/docs/page.tsx
import { getApiDocs } from '@/lib/swagger/config'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default async function ApiDocsPage() {
  const spec = await getApiDocs()
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Documentação da API</h1>
        <p className="text-gray-600">
          Documentação completa da API do Sistema de Tickets. 
          Use esta documentação para integrar com o sistema ou entender os endpoints disponíveis.
        </p>
      </div>
      
      <SwaggerUI spec={spec} />
    </div>
  )
}
```

### 7.2 Dashboard de Saúde do Sistema

#### Componente de Monitoramento
```typescript
// components/system/HealthDashboard.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Server, 
  Database, 
  Wifi, 
  HardDrive, 
  Cpu, 
  Memory,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface HealthStatus {
  overall: 'healthy' | 'warning' | 'critical'
  services: {
    api: { status: string; responseTime: number; uptime: number }
    database: { status: string; connections: number; queryTime: number }
    redis: { status: string; memory: number; connections: number }
    email: { status: string; queueSize: number; lastSent: string }
  }
  system: {
    cpu: number
    memory: number
    disk: number
    uptime: number
  }
  metrics: {
    totalRequests: number
    errorRate: number
    avgResponseTime: number
    activeUsers: number
  }
}

export function HealthDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHealthStatus()
    const interval = setInterval(fetchHealthStatus, 30000) // Atualizar a cada 30s
    return () => clearInterval(interval)
  }, [])

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health/detailed')
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      console.error('Error fetching health status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !health) {
    return <div>Carregando status do sistema...</div>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y


-6">
      {/* Status Geral */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard de Saúde do Sistema</h2>
        <div className="flex items-center space-x-2">
          {getStatusIcon(health.overall)}
          <Badge className={getStatusColor(health.overall)}>
            {health.overall.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Requisições Totais</p>
              <p className="text-2xl font-bold">{health.metrics.totalRequests.toLocaleString()}</p>
            </div>
            <Server className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Erro</p>
              <p className="text-2xl font-bold">{health.metrics.errorRate.toFixed(2)}%</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo de Resposta</p>
              <p className="text-2xl font-bold">{health.metrics.avgResponseTime}ms</p>
            </div>
            <Wifi className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold">{health.metrics.activeUsers}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Status dos Serviços */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Status dos Serviços</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Server className="h-5 w-5" />
                <span>API</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(health.services.api.status)}
                <span className="text-sm">{health.services.api.responseTime}ms</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5" />
                <span>PostgreSQL</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(health.services.database.status)}
                <span className="text-sm">{health.services.database.connections} conexões</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Memory className="h-5 w-5" />
                <span>Redis</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(health.services.redis.status)}
                <span className="text-sm">{health.services.redis.memory}MB</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recursos do Sistema</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4" />
                  <span>CPU</span>
                </span>
                <span>{health.system.cpu}%</span>
              </div>
              <Progress value={health.system.cpu} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="flex items-center space-x-2">
                  <Memory className="h-4 w-4" />
                  <span>Memória</span>
                </span>
                <span>{health.system.memory}%</span>
              </div>
              <Progress value={health.system.memory} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4" />
                  <span>Disco</span>
                </span>
                <span>{health.system.disk}%</span>
              </div>
              <Progress value={health.system.disk} className="h-2" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
```

#### API de Saúde Detalhada
```typescript
// app/api/health/detailed/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { CacheService } from '@/lib/cache/redis'
import os from 'os'

export async function GET() {
  try {
    const startTime = Date.now()

    // Testar conexão com banco de dados
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbTime = Date.now() - dbStart

    // Testar Redis
    const redisStart = Date.now()
    await CacheService.set('health-check', 'ok', 10)
    await CacheService.get('health-check')
    const redisTime = Date.now() - redisStart

    // Métricas do sistema
    const cpuUsage = process.cpuUsage()
    const memUsage = process.memoryUsage()
    const systemMem = os.totalmem()
    const freeMem = os.freemem()

    // Métricas da aplicação
    const totalTickets = await prisma.ticket.count()
    const activeUsers = await prisma.user.count({ where: { isActive: true } })

    const health = {
      overall: 'healthy' as const,
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          uptime: process.uptime()
        },
        database: {
          status: dbTime < 1000 ? 'healthy' : 'warning',
          connections: 10, // Placeholder - implementar contagem real
          queryTime: dbTime
        },
        redis: {
          status: redisTime < 100 ? 'healthy' : 'warning',
          memory: Math.round(memUsage.rss / 1024 / 1024),
          connections: 1 // Placeholder
        },
        email: {
          status: 'healthy',
          queueSize: 0,
          lastSent: new Date().toISOString()
        }
      },
      system: {
        cpu: Math.round((cpuUsage.user + cpuUsage.system) / 1000000 * 100),
        memory: Math.round(((systemMem - freeMem) / systemMem) * 100),
        disk: 45, // Placeholder - implementar verificação real
        uptime: Math.round(os.uptime())
      },
      metrics: {
        totalRequests: 15420, // Placeholder - implementar contador real
        errorRate: 0.5,
        avgResponseTime: Date.now() - startTime,
        activeUsers,
        totalTickets
      }
    }

    return NextResponse.json(health)
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      overall: 'critical',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
```

## Fase 8: Ativação do Menu Lateral e Configurações Finais

### 8.1 Reativação do Menu Lateral

#### Layout Principal com Sidebar
```typescript
// app/(dashboard)/layout.tsx
'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useSession } from 'next-auth/react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { data: session } = useSession()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        userRole={session?.user?.role}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={session?.user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

#### Componente Sidebar Funcional
```typescript
// components/layout/Sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Ticket,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  MessageSquare,
  Shield,
  Activity,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  userRole?: string
}

interface MenuItem {
  title: string
  href: string
  icon: any
  badge?: string
  children?: MenuItem[]
  roles?: string[]
}

export function Sidebar({ isOpen, onToggle, userRole = 'USER' }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      title: 'Tickets',
      href: '/tickets',
      icon: Ticket,
      children: [
        { title: 'Meus Tickets', href: '/tickets/my', icon: Ticket },
        { title: 'Criar Ticket', href: '/tickets/create', icon: Ticket },
        ...(userRole !== 'USER' ? [
          { title: 'Todos os Tickets', href: '/tickets/all', icon: Ticket },
          { title: 'Fila de Atendimento', href: '/tickets/queue', icon: Ticket }
        ] : [])
      ]
    },
    {
      title: 'Base de Conhecimento',
      href: '/knowledge',
      icon: BookOpen,
      children: [
        { title: 'Artigos', href: '/knowledge/articles', icon: BookOpen },
        { title: 'Chat IA', href: '/knowledge/chat', icon: MessageSquare },
        ...(userRole !== 'USER' ? [
          { title: 'Gerenciar', href: '/knowledge/manage', icon: BookOpen }
        ] : [])
      ]
    },
    ...(userRole !== 'USER' ? [
      {
        title: 'Relatórios',
        href: '/reports',
        icon: BarChart3,
        roles: ['COORDINATOR', 'ADMIN'],
        children: [
          { title: 'Dashboard Analytics', href: '/reports/analytics', icon: BarChart3 },
          { title: 'Relatórios Customizados', href: '/reports/custom', icon: BarChart3 },
          { title: 'Exportar Dados', href: '/reports/export', icon: BarChart3 }
        ]
      },
      {
        title: 'Usuários',
        href: '/users',
        icon: Users,
        roles: ['COORDINATOR', 'ADMIN'],
        children: [
          { title: 'Lista de Usuários', href: '/users/list', icon: Users },
          { title: 'Permissões', href: '/users/permissions', icon: Shield },
          { title: 'Departamentos', href: '/users/departments', icon: Users }
        ]
      }
    ] : []),
    ...(userRole === 'ADMIN' ? [
      {
        title: 'Sistema',
        href: '/system',
        icon: Settings,
        roles: ['ADMIN'],
        children: [
          { title: 'Configurações', href: '/system/settings', icon: Settings },
          { title: 'Saúde do Sistema', href: '/system/health', icon: Activity },
          { title: 'Logs de Auditoria', href: '/system/audit', icon: Shield },
          { title: 'Integrações', href: '/system/integrations', icon: Settings }
        ]
      }
    ] : [])
  ]

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isItemExpanded = (title: string) => expandedItems.includes(title)

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = isItemExpanded(item.title)
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

    // Verificar permissões
    if (item.roles && !item.roles.includes(userRole)) {
      return null
    }

    return (
      <div key={item.title}>
        <div
          className={cn(
            'flex items-center px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors',
            level > 0 && 'ml-4',
            isActive 
              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.title)
            }
          }}
        >
          <item.icon className="mr-3 h-5 w-5" />
          
          {isOpen && (
            <>
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )
              )}
            </>
          )}
        </div>

        {hasChildren && isExpanded && isOpen && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => (
              <Link key={child.href} href={child.href}>
                <div
                  className={cn(
                    'flex items-center px-4 py-2 ml-6 text-sm rounded-lg cursor-pointer transition-colors',
                    pathname === child.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <child.icon className="mr-3 h-4 w-4" />
                  <span>{child.title}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!hasChildren && (
          <Link href={item.href}>
            <div className="hidden">Link para {item.title}</div>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-white shadow-lg transition-all duration-300 ease-in-out',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b">
          {isOpen ? (
            <h1 className="text-xl font-bold text-gray-800">Ticket System</h1>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          {isOpen && (
            <div className="text-xs text-gray-500 text-center">
              Versão 2.1.7
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 8.2 Configurações de Produção

#### Variáveis de Ambiente Completas
```env
# Database
DATABASE_URL="postgresql://postgres:5100a23f8d3196cfce339c43d475b3e0@207.180.254.250:5432/ticket_system"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-32-chars-or-more"
NEXTAUTH_URL="https://iaadm.iaprojetos.com.br"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="redis_password"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="iadaadmufsm@gmail.com"
SMTP_PASS="your-app-password"

# SendGrid (Free Tier)
SENDGRID_API_KEY="your-sendgrid-api-key"

# Gmail API
GMAIL_CLIENT_ID="your-gmail-client-id"
GMAIL_CLIENT_SECRET="your-gmail-client-secret"
GMAIL_REDIRECT_URI="https://iaadm.iaprojetos.com.br/auth/gmail/callback"
GMAIL_REFRESH_TOKEN="your-refresh-token"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://iaadm.iaprojetos.com.br"
NEXT_PUBLIC_APP_NAME="Ticket System"
NEXT_PUBLIC_APP_VERSION="2.1.7"

# Domain Configuration
DOMAIN="iaadm.iaprojetos.com.br"
ACME_EMAIL="iadaadmufsm@gmail.com"
```

#### Docker Compose Atualizado
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: ticket-traefik
    restart: unless-stopped
    command:
      - --global.checkNewVersion=false
      - --global.sendAnonymousUsage=false
      - --api.dashboard=true
      - --api.debug=true
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
      - --entrypoints.web.http.redirections.entrypoint.permanent=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --providers.docker.network=ticket-network
      - --certificatesresolvers.letsencrypt.acme.tlschallenge=true
      - --certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --log.level=INFO
      - --accesslog=true
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-letsencrypt:/letsencrypt
    networks:
      - ticket-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.traefik.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik.service=api@internal"

  redis:
    image: redis:7-alpine
    container_name: ticket-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - ticket-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  ticket-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ticket-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=https://${DOMAIN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - GMAIL_CLIENT_ID=${GMAIL_CLIENT_ID}
      - GMAIL_CLIENT_SECRET=${GMAIL_CLIENT_SECRET}
      - GMAIL_REFRESH_TOKEN=${GMAIL_REFRESH_TOKEN}
    volumes:
      - app-logs:/app/logs
      - app-uploads:/app/uploads
    networks:
      - ticket-network
    depends_on:
      redis:
        condition: service_healthy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ticket-app.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.ticket-app.tls.certresolver=letsencrypt"
      - "traefik.http.routers.ticket-app.entrypoints=websecure"
      - "traefik.http.services.ticket-app.loadbalancer.server.port=3000"

volumes:
  redis-data:
  app-logs:
  app-uploads:
  traefik-letsencrypt:

networks:
  ticket-network:
    driver: bridge
```

## Cronograma de Implementação Detalhado

### Semana 1-2: Fundação
**Dias 1-3: Configuração do Ambiente**
- Configurar conexão com PostgreSQL externo
- Criar schema do banco de dados
- Configurar Prisma e migrações
- Configurar Redis para cache

**Dias 4-7: Estrutura Base**
- Implementar modelos de dados
- Criar seeders iniciais
- Configurar autenticação NextAuth
- Implementar middleware de segurança

**Dias 8-14: APIs Básicas**
- Implementar CRUD completo de tickets
- Criar APIs de usuários
- Implementar sistema de permissões
- Configurar validação com Zod

### Semana 3-4: Interfaces e CRUD
**Dias 15-21: Interface do Usuário**
- Reativar e melhorar sidebar
- Implementar dashboard do usuário
- Criar formulários de tickets
- Implementar listagem e filtros

**Dias 22-28: Interface do Coordenador**
- Dashboard administrativo
- Gerenciamento de tickets
- Sistema de atribuição
- Relatórios básicos

### Semana 5-6: IA e Email
**Dias 29-35: Chat IA**
- Integrar OpenAI API
- Implementar busca na base de conhecimento
- Criar interface de chat
- Configurar contexto e respostas

**Dias 36-42: Integração de Email**
- Configurar Gmail API
- Implementar processamento automático
- Criar sistema de notificações
- Configurar SMTP para respostas

### Semana 7-8: Analytics e Relatórios
**Dias 43-49: Sistema de Relatórios**
- Implementar gerador de relatórios
- Criar dashboards customizáveis
- Integrar Chart.js/Recharts
- Configurar exportação (PDF, Excel, CSV)

**Dias 50-56: Analytics Avançados**
- Implementar métricas em tempo real
- Criar visualizações interativas
- Configurar alertas automáticos
- Implementar trending e insights

### Semana 9-10: Otimização
**Dias 57-63: Performance**
- Implementar cache Redis
- Otimizar queries do banco
- Configurar lazy loading
- Implementar CDN para assets

**Dias 64-70: Notificações**
- Configurar SendGrid
- Implementar WebSockets
- Criar sistema de notificações push
- Configurar templates de email

### Semana 11-12: Finalização
**Dias 71-77: Documentação e Testes**
- Criar documentação Swagger
- Implementar testes automatizados
- Configurar CI/CD
- Otimizar para produção

**Dias 78-84: Deploy e Monitoramento**
- Configurar ambiente de produção
- Implementar dashboard de saúde
- Configurar monitoramento
- Realizar testes finais

## Recursos Necessários

### Serviços Gratuitos Utilizados
- **SendGrid**: 100 emails/dia gratuitos
- **OpenAI**: $5 de crédito inicial
- **Vercel/Netlify**: Deploy gratuito (alternativa)
- **GitHub Actions**: CI/CD gratuito

### Custos Estimados (Mensais)
- **VPS**: $10-20/mês
- **Domínio**: $1-2/mês
- **OpenAI API**: $5-15/mês (dependendo do uso)
- **SendGrid Pro** (opcional): $15/mês para mais emails

### Ferramentas de Desenvolvimento
- **VS Code** com extensões TypeScript/React
- **Docker Desktop** para desenvolvimento local
- **Postman** para testes de API
- **pgAdmin** para gerenciamento do banco

## Métricas de Sucesso

### Técnicas
- **Performance**: Tempo de resposta < 200ms
- **Disponibilidade**: Uptime > 99.5%
- **Segurança**: Zero vulnerabilidades críticas
- **Cobertura de Testes**: > 80%

### Funcionais
- **Criação de Tickets**: < 2 minutos
- **Resolução Média**: < 24 horas
- **Satisfação do Usuário**: > 4.5/5
- **Adoção**: 90% dos usuários ativos

### Negócio
- **ROI**: Economia > 30% vs soluções comerciais
- **Produtividade**: Aumento de 25% na resolução
- **Escalabilidade**: Suporte a 1000+ usuários
- **Manutenibilidade**: Atualizações sem downtime

---

**Conclusão**

Este plano de implementação fornece um roadmap completo e detalhado para transformar o sistema de tickets em uma solução empresarial robusta e funcional. A abordagem faseada permite desenvolvimento incremental com entregas de valor constantes, enquanto as tecnologias escolhidas garantem escalabilidade e manutenibilidade a longo prazo.

A implementação seguindo este plano resultará em um sistema moderno, eficiente e competitivo, capaz de atender às necessidades de organizações de diversos tamanhos e complexidades.

**Autor**: Manus AI  
**Data**: 25 de julho de 2025  
**Versão**: 1.0

