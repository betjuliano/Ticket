-- ========================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- Sistema de Tickets Avançado
-- ========================================

-- Habilitar extensão de autenticação do Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CONFIGURAÇÃO PARA INSTÂNCIA SELF-HOSTED
-- ========================================

-- Criar schema auth se não existir (para instâncias self-hosted)
CREATE SCHEMA IF NOT EXISTS auth;

-- Criar função auth.uid() personalizada para instâncias self-hosted
-- Esta função retorna o usuário atual da sessão PostgreSQL
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Tentar obter o user_id da configuração da sessão
    BEGIN
        current_user_id := current_setting('app.current_user_id', true)::uuid;
        IF current_user_id IS NOT NULL THEN
            RETURN current_user_id;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Se não conseguir obter da configuração, usar um UUID padrão
            NULL;
    END;
    
    -- Fallback: retornar um UUID baseado no usuário da sessão PostgreSQL
    -- Em produção, isso deve ser configurado pela aplicação
    RETURN '00000000-0000-0000-0000-000000000000'::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para definir o usuário atual na sessão (para ser usada pela aplicação)
CREATE OR REPLACE FUNCTION auth.set_current_user(user_id uuid)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário importante sobre o uso em produção
-- IMPORTANTE: Em produção, a aplicação deve chamar auth.set_current_user(user_id)
-- no início de cada sessão/transação para definir o usuário autenticado

-- Habilitar RLS em todas as tabelas
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "knowledge_articles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ticket_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

-- ========================================
-- FUNÇÕES AUXILIARES
-- ========================================

-- Função para obter o papel do usuário atual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = (SELECT auth.uid())::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário é coordenador
CREATE OR REPLACE FUNCTION is_coordinator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('ADMIN', 'COORDINATOR');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- POLÍTICAS PARA TABELA USERS
-- ========================================

-- Admins podem ver todos os usuários
CREATE POLICY "admin_can_view_all_users" ON "users"
    FOR SELECT
    USING (is_admin());

-- Coordenadores podem ver usuários ativos
CREATE POLICY "coordinator_can_view_active_users" ON "users"
    FOR SELECT
    USING (is_coordinator() AND "isActive" = true);

-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "users_can_view_own_data" ON "users"
    FOR SELECT
    USING ((SELECT auth.uid())::text = id);

-- Admins podem inserir/atualizar/deletar usuários
CREATE POLICY "admin_can_manage_users" ON "users"
    FOR ALL
    USING (is_admin());

-- Usuários podem atualizar seus próprios dados (exceto role)
CREATE POLICY "users_can_update_own_data" ON "users"
    FOR UPDATE
    USING ((SELECT auth.uid())::text = id)
    WITH CHECK ((SELECT auth.uid())::text = id AND role = (SELECT role FROM users WHERE id = (SELECT auth.uid())::text));

-- ========================================
-- POLÍTICAS PARA TABELA SESSIONS
-- ========================================

-- Usuários podem ver apenas suas próprias sessões
CREATE POLICY "users_can_view_own_sessions" ON "sessions"
    FOR SELECT
    USING ((SELECT auth.uid())::text = "userId");

-- Usuários podem gerenciar suas próprias sessões
CREATE POLICY "users_can_manage_own_sessions" ON "sessions"
    FOR ALL
    USING ((SELECT auth.uid())::text = "userId");

-- Admins podem ver todas as sessões
CREATE POLICY "admin_can_view_all_sessions" ON "sessions"
    FOR SELECT
    USING (is_admin());

-- ========================================
-- POLÍTICAS PARA TABELA TICKETS
-- ========================================

-- Admins podem ver todos os tickets
CREATE POLICY "admin_can_view_all_tickets" ON "tickets"
    FOR SELECT
    USING (is_admin());

-- Coordenadores podem ver todos os tickets
CREATE POLICY "coordinator_can_view_all_tickets" ON "tickets"
    FOR SELECT
    USING (is_coordinator());

-- Usuários podem ver tickets que criaram ou foram atribuídos a eles
CREATE POLICY "users_can_view_own_tickets" ON "tickets"
    FOR SELECT
    USING ((SELECT auth.uid())::text = "createdById" OR (SELECT auth.uid())::text = "assignedToId");

-- Usuários podem criar tickets
CREATE POLICY "users_can_create_tickets" ON "tickets"
    FOR INSERT
    WITH CHECK ((SELECT auth.uid())::text = "createdById");

-- Admins e coordenadores podem gerenciar todos os tickets
CREATE POLICY "admin_coordinator_can_manage_tickets" ON "tickets"
    FOR ALL
    USING (is_coordinator());

-- Usuários podem atualizar tickets que criaram (campos limitados)
CREATE POLICY "users_can_update_own_tickets" ON "tickets"
    FOR UPDATE
    USING ((SELECT auth.uid())::text = "createdById")
    WITH CHECK (
        (SELECT auth.uid())::text = "createdById" AND
        status IN ('OPEN', 'WAITING_FOR_USER') AND
        "assignedToId" IS NULL OR "assignedToId" = (SELECT "assignedToId" FROM tickets WHERE id = tickets.id)
    );

-- ========================================
-- POLÍTICAS PARA TABELA COMMENTS
-- ========================================

-- Usuários podem ver comentários de tickets que têm acesso
CREATE POLICY "users_can_view_accessible_comments" ON "comments"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tickets t 
            WHERE t.id = "ticketId" AND (
                is_coordinator() OR
                (SELECT auth.uid())::text = t."createdById" OR 
                (SELECT auth.uid())::text = t."assignedToId"
            )
        )
    );

-- Usuários podem criar comentários em tickets que têm acesso
CREATE POLICY "users_can_create_comments" ON "comments"
    FOR INSERT
    WITH CHECK (
        (SELECT auth.uid())::text = "userId" AND
        EXISTS (
            SELECT 1 FROM tickets t 
            WHERE t.id = "ticketId" AND (
                is_coordinator() OR
                (SELECT auth.uid())::text = t."createdById" OR 
                (SELECT auth.uid())::text = t."assignedToId"
            )
        )
    );

-- Usuários podem atualizar seus próprios comentários
CREATE POLICY "users_can_update_own_comments" ON "comments"
    FOR UPDATE
    USING ((SELECT auth.uid())::text = "userId")
    WITH CHECK ((SELECT auth.uid())::text = "userId");

-- Admins e coordenadores podem deletar comentários
CREATE POLICY "admin_coordinator_can_delete_comments" ON "comments"
    FOR DELETE
    USING (is_coordinator());

-- ========================================
-- POLÍTICAS PARA TABELA ATTACHMENTS
-- ========================================

-- Usuários podem ver anexos de tickets que têm acesso
CREATE POLICY "users_can_view_accessible_attachments" ON "attachments"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tickets t 
            WHERE t.id = "ticketId" AND (
                is_coordinator() OR
                (SELECT auth.uid())::text = t."createdById" OR 
                (SELECT auth.uid())::text = t."assignedToId"
            )
        )
    );

-- Usuários podem criar anexos em tickets que têm acesso
CREATE POLICY "users_can_create_attachments" ON "attachments"
    FOR INSERT
    WITH CHECK (
        (SELECT auth.uid())::text = "userId" AND
        EXISTS (
            SELECT 1 FROM tickets t 
            WHERE t.id = "ticketId" AND (
                is_coordinator() OR
                (SELECT auth.uid())::text = t."createdById" OR 
                (SELECT auth.uid())::text = t."assignedToId"
            )
        )
    );

-- Usuários podem deletar seus próprios anexos
CREATE POLICY "users_can_delete_own_attachments" ON "attachments"
    FOR DELETE
    USING ((SELECT auth.uid())::text = "userId");

-- Admins e coordenadores podem deletar qualquer anexo
CREATE POLICY "admin_coordinator_can_delete_attachments" ON "attachments"
    FOR DELETE
    USING (is_coordinator());

-- ========================================
-- POLÍTICAS PARA KNOWLEDGE ARTICLES
-- ========================================

-- Todos podem ver artigos publicados
CREATE POLICY "everyone_can_view_published_articles" ON "knowledge_articles"
    FOR SELECT
    USING ("isPublished" = true);

-- Admins e coordenadores podem ver todos os artigos
CREATE POLICY "admin_coordinator_can_view_all_articles" ON "knowledge_articles"
    FOR SELECT
    USING (is_coordinator());

-- Admins e coordenadores podem gerenciar artigos
CREATE POLICY "admin_coordinator_can_manage_articles" ON "knowledge_articles"
    FOR ALL
    USING (is_coordinator());

-- ========================================
-- POLÍTICAS PARA LOGS
-- ========================================

-- Admins podem ver todos os logs
CREATE POLICY "admin_can_view_all_user_logs" ON "user_logs"
    FOR SELECT
    USING (is_admin());

CREATE POLICY "admin_can_view_all_ticket_logs" ON "ticket_logs"
    FOR SELECT
    USING (is_admin());

-- Usuários podem ver seus próprios logs
CREATE POLICY "users_can_view_own_logs" ON "user_logs"
    FOR SELECT
    USING ((SELECT auth.uid())::text = "userId");

-- Sistema pode inserir logs
CREATE POLICY "system_can_insert_logs" ON "user_logs"
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "system_can_insert_ticket_logs" ON "ticket_logs"
    FOR INSERT
    WITH CHECK (true);

-- ========================================
-- POLÍTICAS PARA NOTIFICATIONS
-- ========================================

-- Usuários podem ver suas próprias notificações
CREATE POLICY "users_can_view_own_notifications" ON "notifications"
    FOR SELECT
    USING ((SELECT auth.uid())::text = "userId");

-- Usuários podem atualizar suas próprias notificações (marcar como lida)
CREATE POLICY "users_can_update_own_notifications" ON "notifications"
    FOR UPDATE
    USING ((SELECT auth.uid())::text = "userId")
    WITH CHECK ((SELECT auth.uid())::text = "userId");

-- Sistema pode inserir notificações
CREATE POLICY "system_can_insert_notifications" ON "notifications"
    FOR INSERT
    WITH CHECK (true);

-- Admins podem gerenciar todas as notificações
CREATE POLICY "admin_can_manage_all_notifications" ON "notifications"
    FOR ALL
    USING (is_admin());

COMMIT;