-- ========================================
-- MIGRAÇÃO COMPLETA PARA SUPABASE
-- Sistema de Tickets Avançado
-- ========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ========================================
-- TABELAS PRINCIPAIS
-- ========================================

-- Tabela de usuários (baseada no schema Prisma)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER' CHECK ("role" IN ('ADMIN', 'COORDINATOR', 'USER')),
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "matricula" TEXT UNIQUE,
    "telefone" TEXT UNIQUE,
    "resetToken" TEXT UNIQUE,
    "resetTokenExpiry" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de sessões
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token" TEXT UNIQUE NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de tickets
CREATE TABLE IF NOT EXISTS "tickets" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN' CHECK ("status" IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_THIRD_PARTY', 'RESOLVED', 'CLOSED', 'CANCELLED')),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM' CHECK ("priority" IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    "category" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL,
    "createdById" TEXT NOT NULL REFERENCES "users"("id"),
    "assignedToId" TEXT REFERENCES "users"("id"),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "closedAt" TIMESTAMPTZ
);

-- Tabela de comentários
CREATE TABLE IF NOT EXISTS "comments" (
    "id" TEXT PRIMARY KEY,
    "content" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "users"("id"),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de anexos
CREATE TABLE IF NOT EXISTS "attachments" (
    "id" TEXT PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "users"("id"),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de artigos de conhecimento
CREATE TABLE IF NOT EXISTS "knowledge_articles" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de logs de usuário
CREATE TABLE IF NOT EXISTS "user_logs" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de logs de ticket
CREATE TABLE IF NOT EXISTS "ticket_logs" (
    "id" TEXT PRIMARY KEY,
    "ticketId" TEXT NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "relatedId" TEXT,
    "data" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_users_isActive" ON "users"("isActive");

CREATE INDEX IF NOT EXISTS "idx_sessions_userId" ON "sessions"("userId");
CREATE INDEX IF NOT EXISTS "idx_sessions_token" ON "sessions"("token");
CREATE INDEX IF NOT EXISTS "idx_sessions_expiresAt" ON "sessions"("expiresAt");

CREATE INDEX IF NOT EXISTS "idx_tickets_status" ON "tickets"("status");
CREATE INDEX IF NOT EXISTS "idx_tickets_priority" ON "tickets"("priority");
CREATE INDEX IF NOT EXISTS "idx_tickets_createdById" ON "tickets"("createdById");
CREATE INDEX IF NOT EXISTS "idx_tickets_assignedToId" ON "tickets"("assignedToId");
CREATE INDEX IF NOT EXISTS "idx_tickets_category" ON "tickets"("category");
CREATE INDEX IF NOT EXISTS "idx_tickets_createdAt" ON "tickets"("createdAt");

CREATE INDEX IF NOT EXISTS "idx_comments_ticketId" ON "comments"("ticketId");
CREATE INDEX IF NOT EXISTS "idx_comments_userId" ON "comments"("userId");
CREATE INDEX IF NOT EXISTS "idx_comments_createdAt" ON "comments"("createdAt");

CREATE INDEX IF NOT EXISTS "idx_attachments_ticketId" ON "attachments"("ticketId");
CREATE INDEX IF NOT EXISTS "idx_attachments_userId" ON "attachments"("userId");

CREATE INDEX IF NOT EXISTS "idx_notifications_userId" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications"("read");
CREATE INDEX IF NOT EXISTS "idx_notifications_createdAt" ON "notifications"("createdAt");

-- ========================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON "tickets"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON "comments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_articles_updated_at BEFORE UPDATE ON "knowledge_articles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Usuário administrador padrão
INSERT INTO "users" ("id", "email", "name", "password", "role", "createdAt", "updatedAt") VALUES
    ('admin-001', 'admin@ticket.local', 'Administrador', '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZO', 'ADMIN', NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

-- Usuário coordenador
INSERT INTO "users" ("id", "email", "name", "password", "role", "createdAt", "updatedAt") VALUES
    ('coord-001', 'coordenador@ticket.local', 'Coordenador TI', '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZO', 'COORDINATOR', NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

-- Usuário comum
INSERT INTO "users" ("id", "email", "name", "password", "role", "createdAt", "updatedAt") VALUES
    ('user-001', 'usuario@ticket.local', 'Usuário Teste', '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZO', 'USER', NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

-- Artigos de conhecimento iniciais
INSERT INTO "knowledge_articles" ("id", "title", "content", "category", "tags", "isPublished", "authorId", "createdAt", "updatedAt") VALUES
    ('kb-001', 'Como criar um ticket', 'Guia passo a passo para criar um novo ticket no sistema...', 'Tutorial', '{ticket,criacao,tutorial}', true, 'admin-001', NOW(), NOW()),
    ('kb-002', 'Política de senhas', 'Diretrizes para criação de senhas seguras...', 'Segurança', '{senha,seguranca,politica}', true, 'admin-001', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

COMMIT;