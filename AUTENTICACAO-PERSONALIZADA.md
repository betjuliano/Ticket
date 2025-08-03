# 🔐 Autenticação Personalizada para Supabase Self-Hosted

## 📋 Visão Geral

Este documento explica como usar a implementação personalizada de autenticação criada para resolver o erro `function auth.uid() does not exist` em instâncias self-hosted do Supabase.

## 🛠️ Implementação

### Funções Criadas

1. **`auth.uid()`** - Retorna o UUID do usuário atual
2. **`auth.set_current_user(user_id)`** - Define o usuário atual na sessão

### Como Funciona

```sql
-- A função auth.uid() tenta obter o user_id da configuração da sessão
SELECT auth.uid(); -- Retorna o UUID do usuário atual

-- Para definir o usuário atual (deve ser chamado pela aplicação)
SELECT auth.set_current_user('user-uuid-here');
```

## 🔧 Integração com a Aplicação

### 1. No Middleware de Autenticação

```typescript
// middleware.ts ou auth middleware
import { createClient } from '@supabase/supabase-js';

export async function setCurrentUser(userId: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Definir o usuário atual na sessão do banco
  await supabase.rpc('set_current_user', { user_id: userId });
}
```

### 2. Em Rotas da API

```typescript
// app/api/tickets/route.ts
import { setCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  // Obter o usuário autenticado (do JWT, sessão, etc.)
  const userId = await getCurrentUserId(request);

  if (userId) {
    // Definir o usuário atual no banco para as políticas RLS
    await setCurrentUser(userId);
  }

  // Agora as consultas respeitarão as políticas RLS
  const tickets = await supabase.from('tickets').select('*');

  return Response.json(tickets);
}
```

### 3. Em Hooks do Prisma

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware para definir o usuário atual
prisma.$use(async (params, next) => {
  // Se houver um usuário na sessão/contexto
  const userId = getCurrentUserFromContext();

  if (userId) {
    // Executar SQL raw para definir o usuário
    await prisma.$executeRaw`SELECT auth.set_current_user(${userId}::uuid)`;
  }

  return next(params);
});
```

## 🔒 Políticas RLS

As políticas RLS agora funcionarão corretamente usando `auth.uid()`:

```sql
-- Exemplo de política que agora funciona
CREATE POLICY "users_can_view_own_tickets" ON "tickets"
    FOR SELECT
    USING (auth.uid()::text = "createdById" OR auth.uid()::text = "assignedToId");
```

## ⚠️ Considerações Importantes

### Segurança

1. **Sempre validar o usuário** antes de chamar `auth.set_current_user()`
2. **Usar Service Role Key** apenas no servidor, nunca no cliente
3. **Verificar permissões** antes de definir o usuário atual

### Performance

1. **Chamar uma vez por sessão/transação** - não a cada query
2. **Usar connection pooling** para evitar overhead
3. **Considerar cache** para sessões longas

### Fallback

- Se nenhum usuário for definido, `auth.uid()` retorna `'00000000-0000-0000-0000-000000000000'`
- Isso garante que as políticas RLS não quebrem, mas negarão acesso

## 🧪 Testando

```sql
-- Testar a implementação
SELECT auth.uid(); -- Deve retornar o UUID padrão

-- Definir um usuário
SELECT auth.set_current_user('123e4567-e89b-12d3-a456-426614174000');

-- Verificar se foi definido
SELECT auth.uid(); -- Deve retornar o UUID definido
```

## 🔄 Migração de Código Existente

O código existente que usa `auth.uid()` **não precisa ser alterado**. A implementação personalizada é compatível com:

- Políticas RLS existentes
- Funções que usam `auth.uid()`
- Triggers e procedures

## 📚 Próximos Passos

1. Execute o script `supabase-rls-policies.sql` no painel do Supabase
2. Implemente a integração na aplicação conforme os exemplos acima
3. Teste as políticas RLS com usuários reais
4. Configure logs para monitorar o uso da autenticação

---

**Nota**: Esta implementação é específica para instâncias self-hosted do Supabase. Em instâncias hospedadas oficialmente, a função `auth.uid()` já está disponível nativamente.
