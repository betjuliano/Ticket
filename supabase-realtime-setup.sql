-- ========================================
-- CONFIGURAÇÃO DO SUPABASE REALTIME
-- Sistema de Tickets - Notificações em Tempo Real
-- ========================================

-- Habilitar realtime para as tabelas principais
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ========================================
-- FUNÇÕES PARA NOTIFICAÇÕES AUTOMÁTICAS
-- ========================================

-- Função para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_user_id TEXT,
    p_related_id TEXT DEFAULT NULL,
    p_data TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    notification_id TEXT;
BEGIN
    -- Gerar ID único para a notificação
    notification_id := 'notif_' || generate_random_uuid();
    
    -- Inserir notificação
    INSERT INTO notifications (
        id, type, title, message, "userId", "relatedId", data, read, "createdAt"
    ) VALUES (
        notification_id, p_type, p_title, p_message, p_user_id, p_related_id, p_data, false, NOW()
    );
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para notificar sobre novo ticket
CREATE OR REPLACE FUNCTION notify_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
    coordinator_record RECORD;
    admin_record RECORD;
BEGIN
    -- Notificar todos os coordenadores
    FOR coordinator_record IN
        SELECT id FROM users WHERE role IN ('COORDINATOR', 'ADMIN') AND "isActive" = true
    LOOP
        PERFORM create_notification(
            'TICKET_CREATED',
            'Novo Ticket Criado',
            'Ticket "' || NEW.title || '" foi criado por ' || (SELECT name FROM users WHERE id = NEW."createdById"),
            coordinator_record.id,
            NEW.id,
            json_build_object(
                'ticketId', NEW.id,
                'priority', NEW.priority,
                'category', NEW.category
            )::text
        );
    END LOOP;
    
    -- Log da ação
    INSERT INTO ticket_logs (id, "ticketId", action, details, "userId", "createdAt")
    VALUES (
        'log_' || generate_random_uuid(),
        NEW.id,
        'CREATED',
        'Ticket criado',
        NEW."createdById",
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para notificar sobre atualização de ticket
CREATE OR REPLACE FUNCTION notify_ticket_update()
RETURNS TRIGGER AS $$
DECLARE
    notification_users TEXT[];
    user_id TEXT;
    change_details TEXT := '';
BEGIN
    -- Determinar usuários para notificar
    notification_users := ARRAY[NEW."createdById"];
    
    -- Adicionar usuário atribuído se existir
    IF NEW."assignedToId" IS NOT NULL THEN
        notification_users := array_append(notification_users, NEW."assignedToId");
    END IF;
    
    -- Adicionar usuário atribuído anterior se mudou
    IF OLD."assignedToId" IS NOT NULL AND OLD."assignedToId" != NEW."assignedToId" THEN
        notification_users := array_append(notification_users, OLD."assignedToId");
    END IF;
    
    -- Construir detalhes das mudanças
    IF OLD.status != NEW.status THEN
        change_details := change_details || 'Status: ' || OLD.status || ' → ' || NEW.status || '; ';
    END IF;
    
    IF OLD.priority != NEW.priority THEN
        change_details := change_details || 'Prioridade: ' || OLD.priority || ' → ' || NEW.priority || '; ';
    END IF;
    
    IF OLD."assignedToId" != NEW."assignedToId" THEN
        change_details := change_details || 'Atribuído para: ' || 
            COALESCE((SELECT name FROM users WHERE id = NEW."assignedToId"), 'Ninguém') || '; ';
    END IF;
    
    -- Notificar usuários relevantes
    FOREACH user_id IN ARRAY notification_users
    LOOP
        IF user_id IS NOT NULL THEN
            PERFORM create_notification(
                'TICKET_UPDATED',
                'Ticket Atualizado',
                'Ticket "' || NEW.title || '" foi atualizado. ' || change_details,
                user_id,
                NEW.id,
                json_build_object(
                    'ticketId', NEW.id,
                    'changes', change_details,
                    'updatedBy', auth.uid()::text
                )::text
            );
        END IF;
    END LOOP;
    
    -- Log da ação
    INSERT INTO ticket_logs (id, "ticketId", action, details, "userId", "createdAt")
    VALUES (
        'log_' || generate_random_uuid(),
        NEW.id,
        'UPDATED',
        change_details,
        auth.uid()::text,
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para notificar sobre novo comentário
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    ticket_record RECORD;
    notification_users TEXT[];
    user_id TEXT;
    commenter_name TEXT;
BEGIN
    -- Obter informações do ticket
    SELECT * INTO ticket_record FROM tickets WHERE id = NEW."ticketId";
    
    -- Obter nome do comentarista
    SELECT name INTO commenter_name FROM users WHERE id = NEW."userId";
    
    -- Determinar usuários para notificar
    notification_users := ARRAY[ticket_record."createdById"];
    
    -- Adicionar usuário atribuído se existir
    IF ticket_record."assignedToId" IS NOT NULL THEN
        notification_users := array_append(notification_users, ticket_record."assignedToId");
    END IF;
    
    -- Adicionar outros usuários que comentaram no ticket
    SELECT array_agg(DISTINCT "userId") INTO notification_users
    FROM (
        SELECT unnest(notification_users) AS "userId"
        UNION
        SELECT DISTINCT "userId" FROM comments WHERE "ticketId" = NEW."ticketId"
    ) AS all_users;
    
    -- Notificar usuários relevantes (exceto quem fez o comentário)
    FOREACH user_id IN ARRAY notification_users
    LOOP
        IF user_id IS NOT NULL AND user_id != NEW."userId" THEN
            PERFORM create_notification(
                'COMMENT_ADDED',
                'Novo Comentário',
                commenter_name || ' comentou no ticket "' || ticket_record.title || '"',
                user_id,
                NEW."ticketId",
                json_build_object(
                    'ticketId', NEW."ticketId",
                    'commentId', NEW.id,
                    'commenterId', NEW."userId",
                    'commenterName', commenter_name
                )::text
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para notificar sobre novo anexo
CREATE OR REPLACE FUNCTION notify_new_attachment()
RETURNS TRIGGER AS $$
DECLARE
    ticket_record RECORD;
    notification_users TEXT[];
    user_id TEXT;
    uploader_name TEXT;
BEGIN
    -- Obter informações do ticket
    SELECT * INTO ticket_record FROM tickets WHERE id = NEW."ticketId";
    
    -- Obter nome do usuário que fez upload
    SELECT name INTO uploader_name FROM users WHERE id = NEW."userId";
    
    -- Determinar usuários para notificar
    notification_users := ARRAY[ticket_record."createdById"];
    
    -- Adicionar usuário atribuído se existir
    IF ticket_record."assignedToId" IS NOT NULL THEN
        notification_users := array_append(notification_users, ticket_record."assignedToId");
    END IF;
    
    -- Notificar usuários relevantes (exceto quem fez o upload)
    FOREACH user_id IN ARRAY notification_users
    LOOP
        IF user_id IS NOT NULL AND user_id != NEW."userId" THEN
            PERFORM create_notification(
                'ATTACHMENT_ADDED',
                'Novo Anexo',
                uploader_name || ' adicionou o anexo "' || NEW.filename || '" ao ticket "' || ticket_record.title || '"',
                user_id,
                NEW."ticketId",
                json_build_object(
                    'ticketId', NEW."ticketId",
                    'attachmentId', NEW.id,
                    'filename', NEW.filename,
                    'uploaderId', NEW."userId",
                    'uploaderName', uploader_name
                )::text
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS PARA NOTIFICAÇÕES AUTOMÁTICAS
-- ========================================

-- Trigger para novo ticket
CREATE TRIGGER trigger_notify_new_ticket
    AFTER INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_ticket();

-- Trigger para atualização de ticket
CREATE TRIGGER trigger_notify_ticket_update
    AFTER UPDATE ON tickets
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION notify_ticket_update();

-- Trigger para novo comentário
CREATE TRIGGER trigger_notify_new_comment
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_comment();

-- Trigger para novo anexo
CREATE TRIGGER trigger_notify_new_attachment
    AFTER INSERT ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_attachment();

-- ========================================
-- FUNÇÕES PARA GERENCIAR NOTIFICAÇÕES
-- ========================================

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET read = true 
    WHERE id = notification_id AND "userId" = auth.uid()::text;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar todas as notificações como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET read = true 
    WHERE "userId" = auth.uid()::text AND read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter contagem de notificações não lidas
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM notifications 
        WHERE "userId" = auth.uid()::text AND read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar notificações antigas
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE "createdAt" < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VIEWS PARA FACILITAR CONSULTAS
-- ========================================

-- View para notificações com informações do usuário
CREATE OR REPLACE VIEW user_notifications AS
SELECT 
    n.*,
    u.name as user_name,
    u.email as user_email
FROM notifications n
JOIN users u ON u.id = n."userId"
WHERE n."userId" = auth.uid()::text
ORDER BY n."createdAt" DESC;

-- View para estatísticas de notificações
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    "userId",
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE read = false) as unread_count,
    COUNT(*) FILTER (WHERE read = true) as read_count,
    MAX("createdAt") as last_notification_at
FROM notifications
GROUP BY "userId";

-- ========================================
-- CONFIGURAÇÕES DE LIMPEZA AUTOMÁTICA
-- ========================================

-- Função para executar limpezas automáticas
CREATE OR REPLACE FUNCTION run_maintenance_tasks()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    deleted_notifications INTEGER;
    deleted_attachments INTEGER;
BEGIN
    -- Limpar notificações antigas (30 dias)
    SELECT cleanup_old_notifications(30) INTO deleted_notifications;
    result := result || 'Notificações removidas: ' || deleted_notifications || '; ';
    
    -- Limpar anexos órfãos
    SELECT cleanup_orphaned_attachments() INTO deleted_attachments;
    result := result || 'Anexos órfãos removidos: ' || deleted_attachments || '; ';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;