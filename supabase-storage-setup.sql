-- ========================================
-- CONFIGURAÇÃO DO SUPABASE STORAGE
-- Sistema de Tickets - Anexos
-- ========================================

-- Criar bucket para anexos de tickets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'ticket-attachments',
    'ticket-attachments',
    false, -- Não público por segurança
    52428800, -- 50MB limite por arquivo
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================================
-- POLÍTICAS DE STORAGE
-- ========================================

-- Política para visualizar anexos
-- Usuários podem ver anexos de tickets que têm acesso
CREATE POLICY "users_can_view_ticket_attachments" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'ticket-attachments' AND
        EXISTS (
            SELECT 1 
            FROM attachments a
            JOIN tickets t ON t.id = a."ticketId"
            WHERE 
                a.filepath = name AND
                (
                    -- Admin pode ver tudo
                    (SELECT role FROM users WHERE id = auth.uid()::text) = 'ADMIN' OR
                    -- Coordenador pode ver tudo
                    (SELECT role FROM users WHERE id = auth.uid()::text) = 'COORDINATOR' OR
                    -- Usuário pode ver tickets que criou ou foi atribuído
                    auth.uid()::text = t."createdById" OR
                    auth.uid()::text = t."assignedToId"
                )
        )
    );

-- Política para upload de anexos
-- Usuários podem fazer upload em tickets que têm acesso
CREATE POLICY "users_can_upload_ticket_attachments" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'ticket-attachments' AND
        auth.uid() IS NOT NULL AND
        -- Verificar se o usuário tem acesso ao ticket
        -- O nome do arquivo deve seguir o padrão: ticketId/filename
        EXISTS (
            SELECT 1 
            FROM tickets t
            WHERE 
                t.id = split_part(name, '/', 1) AND
                (
                    -- Admin pode fazer upload em qualquer ticket
                    (SELECT role FROM users WHERE id = auth.uid()::text) = 'ADMIN' OR
                    -- Coordenador pode fazer upload em qualquer ticket
                    (SELECT role FROM users WHERE id = auth.uid()::text) = 'COORDINATOR' OR
                    -- Usuário pode fazer upload em tickets que criou ou foi atribuído
                    auth.uid()::text = t."createdById" OR
                    auth.uid()::text = t."assignedToId"
                )
        )
    );

-- Política para deletar anexos
-- Usuários podem deletar anexos que fizeram upload
CREATE POLICY "users_can_delete_own_attachments" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'ticket-attachments' AND
        (
            -- Admin pode deletar qualquer anexo
            (SELECT role FROM users WHERE id = auth.uid()::text) = 'ADMIN' OR
            -- Coordenador pode deletar qualquer anexo
            (SELECT role FROM users WHERE id = auth.uid()::text) = 'COORDINATOR' OR
            -- Usuário pode deletar anexos que fez upload
            EXISTS (
                SELECT 1 
                FROM attachments a
                WHERE 
                    a.filepath = name AND
                    a."userId" = auth.uid()::text
            )
        )
    );

-- ========================================
-- FUNÇÕES PARA GERENCIAR STORAGE
-- ========================================

-- Função para gerar URL assinada para download
CREATE OR REPLACE FUNCTION get_attachment_download_url(attachment_id TEXT)
RETURNS TEXT AS $$
DECLARE
    file_path TEXT;
    signed_url TEXT;
BEGIN
    -- Verificar se o usuário tem acesso ao anexo
    SELECT a.filepath INTO file_path
    FROM attachments a
    JOIN tickets t ON t.id = a."ticketId"
    WHERE 
        a.id = attachment_id AND
        (
            -- Admin pode acessar tudo
            (SELECT role FROM users WHERE id = auth.uid()::text) = 'ADMIN' OR
            -- Coordenador pode acessar tudo
            (SELECT role FROM users WHERE id = auth.uid()::text) = 'COORDINATOR' OR
            -- Usuário pode acessar tickets que criou ou foi atribuído
            auth.uid()::text = t."createdById" OR
            auth.uid()::text = t."assignedToId"
        );
    
    IF file_path IS NULL THEN
        RAISE EXCEPTION 'Acesso negado ou anexo não encontrado';
    END IF;
    
    -- Gerar URL assinada válida por 1 hora
    SELECT storage.create_signed_url('ticket-attachments', file_path, 3600) INTO signed_url;
    
    RETURN signed_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar anexos órfãos
CREATE OR REPLACE FUNCTION cleanup_orphaned_attachments()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    file_record RECORD;
BEGIN
    -- Encontrar arquivos no storage que não têm registro na tabela attachments
    FOR file_record IN
        SELECT name
        FROM storage.objects
        WHERE 
            bucket_id = 'ticket-attachments' AND
            NOT EXISTS (
                SELECT 1 
                FROM attachments 
                WHERE filepath = name
            )
    LOOP
        -- Deletar arquivo órfão
        DELETE FROM storage.objects 
        WHERE bucket_id = 'ticket-attachments' AND name = file_record.name;
        
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS PARA SINCRONIZAÇÃO
-- ========================================

-- Função para deletar arquivo do storage quando anexo é removido
CREATE OR REPLACE FUNCTION delete_storage_file_on_attachment_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Deletar arquivo do storage
    DELETE FROM storage.objects 
    WHERE bucket_id = 'ticket-attachments' AND name = OLD.filepath;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para deletar arquivo quando anexo é removido
CREATE TRIGGER delete_storage_file_trigger
    AFTER DELETE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION delete_storage_file_on_attachment_delete();

-- ========================================
-- CONFIGURAÇÕES DE SEGURANÇA ADICIONAIS
-- ========================================

-- Criar função para validar upload de arquivo
CREATE OR REPLACE FUNCTION validate_file_upload(
    ticket_id TEXT,
    filename TEXT,
    file_size INTEGER,
    mime_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    ticket_exists BOOLEAN;
    has_access BOOLEAN;
BEGIN
    -- Verificar se o usuário está autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Obter papel do usuário
    SELECT role INTO user_role FROM users WHERE id = auth.uid()::text;
    
    -- Verificar se o ticket existe
    SELECT EXISTS(SELECT 1 FROM tickets WHERE id = ticket_id) INTO ticket_exists;
    
    IF NOT ticket_exists THEN
        RAISE EXCEPTION 'Ticket não encontrado';
    END IF;
    
    -- Verificar acesso ao ticket
    SELECT EXISTS(
        SELECT 1 FROM tickets t
        WHERE 
            t.id = ticket_id AND
            (
                user_role IN ('ADMIN', 'COORDINATOR') OR
                auth.uid()::text = t."createdById" OR
                auth.uid()::text = t."assignedToId"
            )
    ) INTO has_access;
    
    IF NOT has_access THEN
        RAISE EXCEPTION 'Acesso negado ao ticket';
    END IF;
    
    -- Validar tamanho do arquivo (50MB)
    IF file_size > 52428800 THEN
        RAISE EXCEPTION 'Arquivo muito grande. Limite: 50MB';
    END IF;
    
    -- Validar tipo de arquivo
    IF mime_type NOT IN (
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv',
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ) THEN
        RAISE EXCEPTION 'Tipo de arquivo não permitido';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;