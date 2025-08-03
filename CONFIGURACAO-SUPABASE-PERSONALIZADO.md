# 🚀 Configuração Supabase - Instância Personalizada

## 📋 Status da Configuração

✅ **Já Configurado:**

- Instância personalizada do Supabase em `supabase.iaprojetos.com.br`
- Variáveis de ambiente básicas no `.env.local`
- Scripts SQL de migração criados
- Scripts de teste e automação
- Configuração do Prisma

⚠️ **Pendente:**

- Execução dos scripts SQL na sua instância
- Configuração do bucket de Storage
- Obtenção das credenciais de Service Role
- Teste final da configuração

## 🎯 Próximos Passos

### 1. Acesse sua Instância do Supabase

🔗 **URL:** https://supabase.iaprojetos.com.br

### 2. Execute os Scripts SQL

No painel do Supabase, vá para **SQL Editor** e execute os scripts na seguinte ordem:

#### 2.1 Migração Principal

```sql
-- Execute o conteúdo do arquivo: supabase-migration.sql
```

#### 2.2 Políticas RLS

```sql
-- Execute o conteúdo do arquivo: supabase-rls-policies.sql
```

#### 2.3 Configuração do Storage

```sql
-- Execute o conteúdo do arquivo: supabase-storage-setup.sql
```

#### 2.4 Configuração do Real-time

```sql
-- Execute o conteúdo do arquivo: supabase-realtime-setup.sql
```

### 3. Configure o Storage Manualmente

1. Vá para **Storage** no painel
2. Clique em **New Bucket**
3. Configure:
   - **Nome:** `ticket-attachments`
   - **Público:** Desabilitado (privado)
   - **Tamanho máximo:** 50MB
   - **Tipos permitidos:** Imagens, PDFs, documentos

### 4. Obtenha as Credenciais

#### 4.1 Service Role Key

1. Vá para **Settings** → **API**
2. Copie a **service_role** key
3. Atualize no `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

#### 4.2 JWT Secret

1. Vá para **Settings** → **API**
2. Copie o **JWT Secret**
3. Atualize no `.env.local`:

```env
SUPABASE_JWT_SECRET=seu_jwt_secret_aqui
```

#### 4.3 Senha do Banco

1. Vá para **Settings** → **Database**
2. Use a senha do seu banco PostgreSQL
3. Atualize no `.env.local`:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@db.supabase.iaprojetos.com.br:5432/postgres"
DIRECT_URL="postgresql://postgres:SUA_SENHA_AQUI@db.supabase.iaprojetos.com.br:5432/postgres"
```

### 5. Teste a Configuração

```bash
node test-supabase-complete.js
```

### 6. Inicie a Aplicação

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## 🔧 Comandos Úteis

### Teste Rápido

```bash
node test-supabase-complete.js
```

### Reset do Prisma

```bash
npx prisma generate
npx prisma db push
```

### Verificar Logs

```bash
npm run dev
```

## 📁 Arquivos Criados

- `supabase-migration.sql` - Migração das tabelas
- `supabase-rls-policies.sql` - Políticas de segurança
- `supabase-storage-setup.sql` - Configuração do Storage
- `supabase-realtime-setup.sql` - Configuração do Real-time
- `test-supabase-complete.js` - Teste completo
- `setup-supabase-database.js` - Automação
- `proximo-passo.js` - Guia interativo

## ✅ Checklist Final

- [ ] Scripts SQL executados na instância personalizada
- [ ] Bucket `ticket-attachments` criado
- [ ] Service Role Key configurada
- [ ] JWT Secret configurado
- [ ] Senha do banco atualizada
- [ ] Teste executado com sucesso
- [ ] Aplicação iniciada

## 🆘 Troubleshooting

### Erro de Conexão

- Verifique se a instância está online
- Confirme a senha do banco
- Teste a conectividade

### Erro de Permissão

- Verifique a Service Role Key
- Confirme as políticas RLS
- Teste com usuário admin

### Erro de Storage

- Verifique se o bucket foi criado
- Confirme as permissões
- Teste o upload

## 🎉 Funcionalidades Disponíveis

Após a configuração completa:

✅ **Sistema de Tickets**

- Criação e gerenciamento
- Anexos de arquivos
- Histórico de atividades

✅ **Autenticação**

- Login/logout
- Controle de acesso
- Sessões seguras

✅ **Storage**

- Upload de arquivos
- Gerenciamento de anexos
- Controle de tamanho

✅ **Real-time**

- Atualizações em tempo real
- Notificações
- Sincronização

---

**Próximo passo:** Execute os scripts SQL na sua instância em https://supabase.iaprojetos.com.br
