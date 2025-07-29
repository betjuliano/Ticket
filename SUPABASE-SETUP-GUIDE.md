# 🚀 Guia Completo de Configuração do Supabase

## Sistema de Tickets Avançado

Este guia irá te ajudar a migrar completamente seu sistema de tickets para o Supabase, aproveitando todos os recursos avançados da plataforma.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Automática](#configuração-automática)
3. [Configuração Manual](#configuração-manual)
4. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
5. [Políticas de Segurança (RLS)](#políticas-de-segurança-rls)
6. [Storage para Anexos](#storage-para-anexos)
7. [Real-time e Notificações](#real-time-e-notificações)
8. [Testes e Validação](#testes-e-validação)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### 1. Conta no Supabase
- Crie uma conta em [supabase.com](https://supabase.com)
- Crie um novo projeto
- Anote as credenciais do projeto

### 2. Informações Necessárias
Você precisará das seguintes informações do seu projeto Supabase:

```
- Project URL: https://xxx.supabase.co
- Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Database Password: sua_senha_do_banco
- JWT Secret: sua_jwt_secret
```

**📍 Onde encontrar:**
- Vá para o painel do Supabase
- Settings → API
- Copie as informações necessárias

---

## ⚡ Configuração Automática

### Opção 1: Script Automatizado (Recomendado)

```bash
# Execute o script de configuração automática
node setup-supabase.js
```

O script irá:
- ✅ Coletar suas credenciais do Supabase
- ✅ Atualizar o arquivo `.env.local`
- ✅ Instalar dependências necessárias
- ✅ Configurar o Prisma para PostgreSQL
- ✅ Executar migrações
- ✅ Criar cliente Supabase
- ✅ Gerar script de teste

---

## 🔨 Configuração Manual

### 1. Atualizar Variáveis de Ambiente

Edite o arquivo `.env.local`:

```env
# ========================================
# CONFIGURAÇÕES DO SUPABASE
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=sua_jwt_secret

# ========================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# ========================================
DATABASE_URL="postgresql://postgres:sua_senha@db.xxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:sua_senha@db.xxx.supabase.co:5432/postgres"

# ========================================
# CONFIGURAÇÕES DE STORAGE
# ========================================
SUPABASE_STORAGE_BUCKET="ticket-attachments"
MAX_FILE_SIZE="52428800"
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,text/plain,text/csv,application/zip"
```

### 2. Instalar Dependências

```bash
npm install @supabase/supabase-js
npm install prisma @prisma/client
```

### 3. Configurar Prisma

Atualize `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 4. Executar Migrações

```bash
npx prisma generate
npx prisma db push
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### 👥 Users
```sql
- id (TEXT, PK)
- email (TEXT, UNIQUE)
- name (TEXT)
- password (TEXT)
- role (ENUM: ADMIN, COORDINATOR, USER)
- avatar (TEXT)
- isActive (BOOLEAN)
- matricula (TEXT, UNIQUE)
- telefone (TEXT, UNIQUE)
- resetToken (TEXT)
- resetTokenExpiry (TIMESTAMPTZ)
- createdAt (TIMESTAMPTZ)
- updatedAt (TIMESTAMPTZ)
```

#### 🎫 Tickets
```sql
- id (TEXT, PK)
- title (TEXT)
- description (TEXT)
- status (ENUM: OPEN, IN_PROGRESS, WAITING_FOR_USER, etc.)
- priority (ENUM: LOW, MEDIUM, HIGH, URGENT)
- category (TEXT)
- tags (TEXT)
- createdById (TEXT, FK → users.id)
- assignedToId (TEXT, FK → users.id)
- createdAt (TIMESTAMPTZ)
- updatedAt (TIMESTAMPTZ)
- closedAt (TIMESTAMPTZ)
```

#### 💬 Comments
```sql
- id (TEXT, PK)
- content (TEXT)
- ticketId (TEXT, FK → tickets.id)
- userId (TEXT, FK → users.id)
- createdAt (TIMESTAMPTZ)
- updatedAt (TIMESTAMPTZ)
```

#### 📎 Attachments
```sql
- id (TEXT, PK)
- filename (TEXT)
- filepath (TEXT)
- filesize (INTEGER)
- mimetype (TEXT)
- ticketId (TEXT, FK → tickets.id)
- userId (TEXT, FK → users.id)
- createdAt (TIMESTAMPTZ)
```

### Scripts SQL

1. **Criar Tabelas**: Execute `supabase-migration.sql`
2. **Políticas RLS**: Execute `supabase-rls-policies.sql`
3. **Storage**: Execute `supabase-storage-setup.sql`
4. **Real-time**: Execute `supabase-realtime-setup.sql`

---

## 🔒 Políticas de Segurança (RLS)

### Conceitos Principais

- **Row Level Security (RLS)**: Controla acesso a nível de linha
- **Políticas baseadas em papel**: ADMIN, COORDINATOR, USER
- **Isolamento de dados**: Usuários só veem dados relevantes

### Regras de Acesso

#### 👑 Administradores
- ✅ Acesso total a todos os dados
- ✅ Gerenciar usuários
- ✅ Gerenciar todos os tickets
- ✅ Acessar logs e relatórios

#### 👨‍💼 Coordenadores
- ✅ Ver todos os tickets
- ✅ Gerenciar tickets
- ✅ Ver usuários ativos
- ❌ Gerenciar usuários

#### 👤 Usuários
- ✅ Ver próprios dados
- ✅ Criar tickets
- ✅ Ver tickets criados ou atribuídos
- ✅ Comentar em tickets acessíveis
- ❌ Ver dados de outros usuários

---

## 📁 Storage para Anexos

### Configuração do Bucket

1. **Criar Bucket**:
   - Nome: `ticket-attachments`
   - Público: ❌ Não
   - Limite: 50MB por arquivo

2. **Tipos de Arquivo Permitidos**:
   ```
   - Imagens: JPEG, PNG, GIF, WebP
   - Documentos: PDF, Word, Excel, PowerPoint
   - Texto: TXT, CSV
   - Compactados: ZIP, RAR, 7Z
   ```

### Estrutura de Pastas
```
ticket-attachments/
├── {ticketId}/
│   ├── {filename1}
│   ├── {filename2}
│   └── ...
```

### Políticas de Storage
- **Upload**: Usuários com acesso ao ticket
- **Download**: Usuários com acesso ao ticket
- **Delete**: Proprietário do arquivo ou admin/coordinator

---

## ⚡ Real-time e Notificações

### Recursos Habilitados

#### 📡 Real-time Subscriptions
- **Tickets**: Atualizações em tempo real
- **Comments**: Novos comentários
- **Notifications**: Notificações instantâneas
- **Attachments**: Novos anexos

#### 🔔 Notificações Automáticas

1. **Novo Ticket**:
   - Notifica todos os coordenadores
   - Log de criação

2. **Ticket Atualizado**:
   - Notifica criador e responsável
   - Detalhes das mudanças

3. **Novo Comentário**:
   - Notifica participantes do ticket
   - Histórico de conversas

4. **Novo Anexo**:
   - Notifica participantes
   - Informações do arquivo

### Tipos de Notificação
```typescript
type NotificationType = 
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'COMMENT_ADDED'
  | 'ATTACHMENT_ADDED'
  | 'TICKET_ASSIGNED'
  | 'TICKET_CLOSED';
```

---

## 🧪 Testes e Validação

### 1. Teste Básico de Conexão

```bash
node test-supabase-complete.js
```

### 2. Verificações Manuais

#### Conexão com Banco
```javascript
const { supabase } = require('./lib/supabase-client');

// Teste de conexão
const { data, error } = await supabase
  .from('users')
  .select('count')
  .limit(1);

console.log('Conexão:', error ? 'Falhou' : 'Sucesso');
```

#### Teste de RLS
```javascript
// Deve falhar sem autenticação
const { data, error } = await supabase
  .from('users')
  .select('*');

console.log('RLS ativo:', error ? 'Sim' : 'Não');
```

#### Teste de Storage
```javascript
const { data, error } = await supabase.storage
  .listBuckets();

console.log('Buckets:', data?.map(b => b.name));
```

### 3. Checklist de Validação

- [ ] ✅ Conexão com banco estabelecida
- [ ] ✅ Tabelas criadas corretamente
- [ ] ✅ RLS policies ativas
- [ ] ✅ Storage bucket configurado
- [ ] ✅ Real-time funcionando
- [ ] ✅ Notificações sendo enviadas
- [ ] ✅ Upload de arquivos funcionando
- [ ] ✅ Autenticação integrada

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão
```
❌ connection to server at "db.xxx.supabase.co" failed
```

**Soluções:**
- Verificar DATABASE_URL
- Confirmar senha do banco
- Verificar firewall/proxy

#### 2. RLS Bloqueando Acesso
```
❌ permission denied for table users
```

**Soluções:**
- Verificar se RLS policies foram aplicadas
- Confirmar autenticação do usuário
- Usar service role key para operações admin

#### 3. Storage Não Funcionando
```
❌ The resource was not found
```

**Soluções:**
- Verificar se bucket foi criado
- Confirmar políticas de storage
- Verificar permissões de upload

#### 4. Real-time Não Conectando
```
❌ WebSocket connection failed
```

**Soluções:**
- Verificar configurações de real-time
- Confirmar subscription nas tabelas
- Verificar firewall para WebSockets

### Comandos Úteis

```bash
# Resetar migrações
npx prisma migrate reset

# Regenerar cliente
npx prisma generate

# Aplicar mudanças no schema
npx prisma db push

# Ver logs do Supabase
# (no painel web: Logs → Database/API/Storage)
```

---

## 📚 Recursos Adicionais

### Documentação
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

### Ferramentas Úteis
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Prisma Studio](https://www.prisma.io/studio)
- [Supabase Dashboard](https://app.supabase.com)

### Comunidade
- [Supabase Discord](https://discord.supabase.com)
- [Prisma Discord](https://pris.ly/discord)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

## 🎉 Conclusão

Parabéns! Seu sistema de tickets agora está configurado com:

- ✅ **Banco PostgreSQL** robusto e escalável
- ✅ **Autenticação** segura e flexível
- ✅ **Storage** para anexos com políticas de segurança
- ✅ **Real-time** para atualizações instantâneas
- ✅ **Notificações** automáticas e inteligentes
- ✅ **APIs** prontas para uso
- ✅ **Segurança** com Row Level Security

### Próximos Passos

1. **Personalizar** as políticas RLS conforme suas necessidades
2. **Implementar** autenticação social (Google, GitHub, etc.)
3. **Configurar** backups automáticos
4. **Monitorar** performance e uso
5. **Escalar** conforme necessário

---

**💡 Dica:** Mantenha este guia como referência e atualize conforme sua aplicação evolui!

**🚀 Happy coding!**