# 🚀 Deploy em Produção - Ticket System

## 📋 Informações do Deploy

- **Domínio**: `iadm.iaprojetos.com.br`
- **Ambiente**: Produção
- **Tecnologias**: Next.js, Docker, Traefik, PostgreSQL, Redis

## 🔧 Pré-requisitos

### 1. Servidor/VPS

- Ubuntu 20.04+ ou CentOS 8+
- Mínimo 2GB RAM, 2 CPU cores
- 20GB de espaço em disco
- Docker e Docker Compose instalados

### 2. Domínio e DNS

- Domínio `iadm.iaprojetos.com.br` apontando para o IP do servidor
- Subdomínio `traefik.iaprojetos.com.br` (para dashboard do Traefik)

### 3. Configurações de Firewall

```bash
# Permitir portas HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
```

## 📁 Arquivos de Configuração

### 1. `.env.production`

Arquivo já configurado com:

- ✅ NEXTAUTH_URL para produção
- ✅ Configurações de email SMTP
- ✅ Domínio correto
- ⚠️ **IMPORTANTE**: Altere as senhas padrão!

### 2. `docker-compose.yml`

Configurado com:

- ✅ Traefik com SSL automático (Let's Encrypt)
- ✅ PostgreSQL com persistência
- ✅ Redis para cache
- ✅ Aplicação Next.js otimizada

## 🚀 Processo de Deploy

### Opção 1: Script Automático (Windows)

```bash
# Execute o script de deploy
.\deploy-production.bat
```

### Opção 2: Manual

#### 1. Preparar ambiente

```bash
# Clonar repositório (se necessário)
git clone <seu-repositorio>
cd Ticket

# Verificar arquivos de configuração
ls -la .env.production
ls -la docker-compose.yml
```

#### 2. Build e Deploy

```bash
# Parar containers existentes
docker-compose -f docker-compose.yml --env-file .env.production down

# Build da aplicação
docker-compose -f docker-compose.yml --env-file .env.production build --no-cache

# Iniciar serviços
docker-compose -f docker-compose.yml --env-file .env.production up -d
```

#### 3. Verificar status

```bash
# Status dos containers
docker-compose -f docker-compose.yml --env-file .env.production ps

# Logs da aplicação
docker-compose -f docker-compose.yml --env-file .env.production logs -f ticket-app
```

## 🔍 Verificações Pós-Deploy

### 1. Aplicação Principal

- ✅ Acesse: `https://iadm.iaprojetos.com.br`
- ✅ Teste login/autenticação
- ✅ Verifique funcionalidades principais

### 2. Dashboard Traefik

- ✅ Acesse: `https://traefik.iaprojetos.com.br`
- ✅ Login: `admin` / `admin123` (altere a senha!)

### 3. Certificados SSL

- ✅ Verifique se o certificado foi gerado automaticamente
- ✅ Teste redirecionamento HTTP → HTTPS

## 🗄️ Banco de Dados

### Migrações

```bash
# Executar migrações
docker-compose -f docker-compose.yml --env-file .env.production exec ticket-app npx prisma migrate deploy

# Gerar cliente Prisma
docker-compose -f docker-compose.yml --env-file .env.production exec ticket-app npx prisma generate
```

### Backup

```bash
# Backup do banco
docker-compose -f docker-compose.yml --env-file .env.production exec postgres pg_dump -U ticket_user ticket_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 📊 Monitoramento

### Logs

```bash
# Logs em tempo real
docker-compose -f docker-compose.yml --env-file .env.production logs -f

# Logs específicos
docker-compose -f docker-compose.yml --env-file .env.production logs ticket-app
docker-compose -f docker-compose.yml --env-file .env.production logs postgres
docker-compose -f docker-compose.yml --env-file .env.production logs traefik
```

### Status dos Serviços

```bash
# Status geral
docker-compose -f docker-compose.yml --env-file .env.production ps

# Uso de recursos
docker stats
```

## 🔧 Manutenção

### Reiniciar Serviços

```bash
# Reiniciar aplicação
docker-compose -f docker-compose.yml --env-file .env.production restart ticket-app

# Reiniciar todos os serviços
docker-compose -f docker-compose.yml --env-file .env.production restart
```

### Atualizar Aplicação

```bash
# Pull das mudanças
git pull origin main

# Rebuild e restart
docker-compose -f docker-compose.yml --env-file .env.production down
docker-compose -f docker-compose.yml --env-file .env.production build --no-cache
docker-compose -f docker-compose.yml --env-file .env.production up -d
```

### Limpeza

```bash
# Limpar imagens não utilizadas
docker system prune -f

# Limpar volumes órfãos
docker volume prune -f
```

## 🔒 Segurança

### Senhas a Alterar

1. **PostgreSQL**: `POSTGRES_PASSWORD` em `.env.production`
2. **Redis**: `REDIS_PASSWORD` em `.env.production`
3. **Traefik Dashboard**: `TRAEFIK_AUTH` em `.env.production`
4. **NextAuth**: `NEXTAUTH_SECRET` em `.env.production`

### Gerar Nova Senha para Traefik

```bash
# Gerar hash da senha
echo $(htpasswd -nb admin suasenha) | sed -e s/\\$/\\$\\$/g
```

## 🆘 Troubleshooting

### Problemas Comuns

1. **Certificado SSL não gerado**
   - Verifique se o domínio aponta para o servidor
   - Verifique logs do Traefik: `docker-compose logs traefik`

2. **Aplicação não carrega**
   - Verifique logs: `docker-compose logs ticket-app`
   - Verifique se o banco está rodando: `docker-compose ps postgres`

3. **Erro de conexão com banco**
   - Verifique variáveis de ambiente
   - Verifique se o PostgreSQL está saudável

### Comandos de Debug

```bash
# Entrar no container da aplicação
docker-compose -f docker-compose.yml --env-file .env.production exec ticket-app sh

# Verificar conectividade
docker-compose -f docker-compose.yml --env-file .env.production exec ticket-app ping postgres

# Testar conexão com banco
docker-compose -f docker-compose.yml --env-file .env.production exec postgres psql -U ticket_user -d ticket_db -c "SELECT 1;"
```

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs dos containers
2. Consulte a documentação do Docker/Traefik
3. Verifique as configurações de DNS
4. Entre em contato com o administrador do sistema

---

**✅ Deploy configurado para:**

- **Aplicação**: `https://iadm.iaprojetos.com.br`
- **Traefik Dashboard**: `https://traefik.iaprojetos.com.br`
