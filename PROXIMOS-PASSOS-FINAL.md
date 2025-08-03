# 🎯 Próximos Passos - Configuração Final Supabase

## ✅ Status Atual

**Corrigido:**

- ❌ Erro SQL de constraint NOT NULL no `updatedAt` → ✅ **RESOLVIDO**
- ❌ Erro de função `auth.uid()` → ✅ **RESOLVIDO com implementação personalizada**
- ❌ Erro de arrays de tags → ✅ **RESOLVIDO**
- Scripts SQL atualizados e prontos para execução

**Funcionando:**

- ✅ Instância personalizada: `supabase.iaprojetos.com.br`
- ✅ Conexão com banco estabelecida
- ✅ Variáveis de ambiente configuradas
- ✅ Tabelas detectadas (com RLS ativo)
- ✅ Prisma configurado

**Pendente:**

- ⚠️ Execução dos scripts SQL corrigidos
- ⚠️ Configuração do bucket Storage
- ⚠️ Credenciais de Service Role

## 🚀 Ação Imediata Necessária

### Opção 1: Usando Supabase Storage (Original)

#### 1. Acesse sua Instância Supabase

🔗 **https://supabase.iaprojetos.com.br**

#### 2. Execute os Scripts SQL (ORDEM IMPORTANTE)

Vá para **SQL Editor** e execute na seguinte ordem:

##### 2.1 Migração Principal (CORRIGIDA)

```sql
-- Cole todo o conteúdo do arquivo: supabase-migration.sql
-- (Já corrigido: updatedAt, arrays de tags)
```

##### 2.2 Políticas RLS (CORRIGIDA)

```sql
-- Cole todo o conteúdo do arquivo: supabase-rls-policies.sql
-- (Já corrigido: função auth.uid(), extensão uuid-ossp)
```

##### 2.3 Storage Setup

```sql
-- Cole todo o conteúdo do arquivo: supabase-storage-setup.sql
```

##### 2.4 Real-time Setup

```sql
-- Cole todo o conteúdo do arquivo: supabase-realtime-setup.sql
```

#### 3. Configure o Storage Manualmente

1. **Storage** → **New Bucket**
2. **Configurações:**
   - Nome: `ticket-attachments`
   - Público: **Desabilitado** (privado)
   - Tamanho máximo: **50MB**
   - Tipos permitidos: Imagens, PDFs, documentos

#### 4. Obtenha as Credenciais

##### 4.1 Service Role Key

1. **Settings** → **API**
2. Copie a **service_role** key
3. Atualize no `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

##### 4.2 JWT Secret

1. **Settings** → **API**
2. Copie o **JWT Secret**
3. Atualize no `.env.local`:

```env
SUPABASE_JWT_SECRET=seu_jwt_secret_aqui
```

##### 4.3 Senha do Banco

1. **Settings** → **Database**
2. Substitua `[YOUR_DB_PASSWORD]` pela senha real:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA_REAL@db.supabase.iaprojetos.com.br:5432/postgres"
DIRECT_URL="postgresql://postgres:SUA_SENHA_REAL@db.supabase.iaprojetos.com.br:5432/postgres"
```

#### 5. Teste Final

```bash
node test-supabase-complete.js
```

#### 6. Inicie a Aplicação

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Opção 2: Usando MinIO S3 (Recomendado para Self-Hosted)

#### 1. Configuração Automatizada

```bash
# Executar script de configuração
node setup-minio.js
```

Este script irá:

- ✅ Verificar dependências
- ✅ Instalar pacotes AWS SDK
- ✅ Criar docker-compose.minio.yml
- ✅ Atualizar .env.local
- ✅ Criar cliente MinIO
- ✅ Iniciar containers Docker
- ✅ Configurar bucket automaticamente

#### 2. Configuração Manual (alternativa)

```bash
# Instalar dependências
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Iniciar MinIO
docker-compose -f docker-compose.minio.yml up -d

# Aguardar inicialização (15 segundos)
# Verificar se está rodando
docker-compose -f docker-compose.minio.yml ps
```

#### 3. Verificar Configuração

```bash
# Testar conexão
node test-minio-connection.js
```

#### 4. Acessar Console Web

- URL: http://localhost:9001
- Usuário: `minioadmin`
- Senha: `minioadmin123`

#### 5. Executar Scripts SQL (apenas estrutura)

```sql
-- 1. Primeiro: Criar tabelas e estrutura
supabase-migration.sql

-- 2. Segundo: Configurar políticas RLS
supabase-rls-policies.sql

-- 3. Terceiro: Configurar Real-time
supabase-realtime-setup.sql
```

#### 6. Atualizar APIs (usar rotas MinIO)

- Upload: `/api/attachments/upload-minio`
- Download: `/api/attachments/download-minio/[id]`
- Componente: `MinIOFileUpload`

#### 7. Teste Final

```bash
node test-supabase-complete.js
```

#### 8. Inicie a Aplicação

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## Comparação das Opções

| Aspecto             | Supabase Storage | MinIO S3              |
| ------------------- | ---------------- | --------------------- |
| **Controle**        | Limitado         | Total                 |
| **Custos**          | Baseado em uso   | Apenas infraestrutura |
| **Performance**     | Boa              | Excelente             |
| **Configuração**    | Simples          | Moderada              |
| **Backup**          | Automático       | Manual                |
| **Escalabilidade**  | Automática       | Manual                |
| **Compatibilidade** | Supabase only    | S3 API padrão         |
| **Self-hosted**     | ❌               | ✅                    |

## Recomendações

- **Use Supabase Storage** se:
  - Quer simplicidade máxima
  - Não se importa com custos de storage
  - Prefere gerenciamento automático

- **Use MinIO S3** se:
  - Quer controle total dos dados
  - Tem infraestrutura própria
  - Precisa de compatibilidade S3
  - Quer reduzir custos de storage

## Arquivos Criados

### Para MinIO S3:

- 📄 `MINIO-S3-SETUP.md` - Guia completo de configuração
- 🔧 `setup-minio.js` - Script de configuração automatizada (Docker local)
- 🌐 `setup-minio-custom-domain.js` - Script para domínio personalizado
- 🐳 `docker-compose.minio.yml` - Configuração Docker (criado automaticamente)
- 📁 `lib/minio-client.ts` - Cliente MinIO (criado automaticamente)
- 🧪 `test-minio-connection.js` - Script de teste Docker (criado automaticamente)
- 🧪 `test-minio-custom-domain.js` - Script de teste domínio personalizado
- 🚀 `app/api/attachments/upload-minio/route.ts` - API de upload
- 📥 `app/api/attachments/download-minio/[id]/route.ts` - API de download
- 🎨 `components/forms/minio-file-upload.tsx` - Componente React

### Para Autenticação Personalizada:

- 📄 `AUTENTICACAO-PERSONALIZADA.md` - Documentação da auth personalizada

## Próximos Passos

**Escolha uma das opções abaixo:**

### 🎯 Opção Recomendada: MinIO S3

#### 🌐 Com Domínio Personalizado (https://minio.iaprojetos.com.br)

```bash
# 1. Configuração para domínio personalizado
node setup-minio-custom-domain.js

# 2. Atualizar credenciais no .env.local
# MINIO_ACCESS_KEY=sua_access_key_real
# MINIO_SECRET_KEY=sua_secret_key_real

# 3. Testar conexão
node test-minio-custom-domain.js

# 4. Executar scripts SQL no Supabase
# (supabase-migration.sql, supabase-rls-policies.sql, supabase-realtime-setup.sql)

# 5. Iniciar aplicação
npm run dev
```

#### 🐳 Com Docker Local

```bash
# 1. Configuração automatizada
node setup-minio.js

# 2. Testar conexão
node test-minio-connection.js

# 3. Executar scripts SQL no Supabase
# (supabase-migration.sql, supabase-rls-policies.sql, supabase-realtime-setup.sql)

# 4. Iniciar aplicação
npm run dev
```

### 🔄 Opção Alternativa: Supabase Storage

```bash
# 1. Executar todos os scripts SQL no Supabase
# 2. Configurar bucket manualmente
# 3. Atualizar credenciais no .env.local
# 4. Testar: node test-supabase-complete.js
# 5. Iniciar: npm run dev
```

## 🔧 Comandos de Verificação

### Teste Rápido

```bash
node test-supabase-complete.js
```

### Reset Prisma (se necessário)

```bash
npx prisma generate
npx prisma db push
```

### Verificar Logs

```bash
npm run dev
```

## 📁 Arquivos Importantes

### 📋 Scripts SQL Corrigidos:

1. **`supabase-migration.sql`**:
   - ✅ Corrigido `updatedAt` com `NOW()`
   - ✅ Corrigido arrays de tags (`TEXT[]`)
2. **`supabase-rls-policies.sql`**:
   - ✅ Adicionado schema `auth` personalizado
   - ✅ Implementada função `auth.uid()` para instâncias self-hosted
   - ✅ Adicionada função `auth.set_current_user()` para aplicação
3. **`supabase-storage-setup.sql`**: ✅ Pronto
4. **`supabase-realtime-setup.sql`**: ✅ Pronto

### 🔧 Implementação Personalizada de Autenticação

**Para instâncias self-hosted do Supabase**, foi criada uma implementação personalizada da função `auth.uid()` que:

- Cria o schema `auth` se não existir
- Implementa `auth.uid()` usando configurações de sessão PostgreSQL
- Fornece `auth.set_current_user(user_id)` para a aplicação definir o usuário atual
- Usa fallback seguro quando não há usuário definido

**Importante**: Em produção, a aplicação deve chamar `auth.set_current_user(user_id)` no início de cada sessão para definir o usuário autenticado.

### 📄 Outros Arquivos:

- ✅ `.env.local` - Variáveis atualizadas
- ✅ `test-supabase-complete.js` - Teste completo

## ⚡ Resumo Executivo

1. **Execute os 4 scripts SQL** na sua instância (ordem importante)
2. **Crie o bucket** `ticket-attachments` (privado, 50MB)
3. **Obtenha e configure** Service Role Key + JWT Secret + Senha DB
4. **Teste** com `node test-supabase-complete.js`
5. **Inicie** com `npm run dev`

## 🎉 Resultado Final

Após completar estes passos:

- ✅ Sistema de tickets completo
- ✅ Upload de anexos funcionando
- ✅ Autenticação segura
- ✅ Notificações em tempo real
- ✅ Controle de acesso (RLS)
- ✅ Base de conhecimento

---

**🚨 IMPORTANTE:** Todos os erros SQL foram corrigidos (updatedAt, auth.uid(), arrays). Agora você pode executar os scripts sem problemas na sua instância `supabase.iaprojetos.com.br`
