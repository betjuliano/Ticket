# 🚀 Guia de Deploy - Ticket System

Este guia detalha como fazer o deploy do Ticket System em produção usando Docker, Portainer e Traefik.

## 📋 Pré-requisitos

### Servidor VPS
- Ubuntu 20.04+ ou Debian 11+
- 2GB RAM mínimo (4GB recomendado)
- 20GB de espaço em disco
- Docker e Docker Compose instalados
- Portainer configurado
- Traefik configurado (opcional, para SSL automático)

### Domínio
- Domínio próprio apontando para o servidor
- Subdomínio configurado (ex: tickets.seudominio.com)

## 🔧 Preparação do Ambiente

### 1. Instalar Docker (se não instalado)
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Instalar Portainer (se não instalado)
```bash
# Criar volume para Portainer
docker volume create portainer_data

# Executar Portainer
docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest
```

### 3. Configurar Traefik (opcional)
```bash
# Criar rede para Traefik
docker network create traefik

# Criar diretório de configuração
mkdir -p /opt/traefik
cd /opt/traefik

# Criar arquivo de configuração
cat > traefik.yml << EOF
api:
  dashboard: true
  debug: true

entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik

certificatesResolvers:
  letsencrypt:
    acme:
      tlsChallenge: {}
      email: seu-email@exemplo.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
EOF

# Criar docker-compose para Traefik
cat > docker-compose.yml << EOF
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(\`traefik.seudominio.com\`)"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"

networks:
  traefik:
    external: true
EOF

# Iniciar Traefik
docker-compose up -d
```

## 📦 Deploy do Ticket System

### Método 1: Via Portainer (Recomendado)

#### 1. Acessar Portainer
- Acesse: `https://seu-servidor:9443`
- Faça login com suas credenciais

#### 2. Criar Stack
1. Vá em **Stacks** → **Add Stack**
2. Nome: `ticket-system`
3. Build method: **Web editor**

#### 3. Configurar Docker Compose
Cole o seguinte conteúdo:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ticket-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ticket_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ticket-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  app:
    image: ticket-system:latest
    container_name: ticket-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/ticket_system
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    ports:
      - "${APP_PORT:-3000}:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ticket-network
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ticket.rule=Host(\`${DOMAIN}\`)"
      - "traefik.http.routers.ticket.entrypoints=websecure"
      - "traefik.http.routers.ticket.tls.certresolver=letsencrypt"
      - "traefik.http.services.ticket.loadbalancer.server.port=3000"

volumes:
  postgres_data:
    driver: local

networks:
  ticket-network:
    driver: bridge
  traefik:
    external: true
```

#### 4. Configurar Variáveis de Ambiente
Na seção **Environment variables**, adicione:

| Nome | Valor | Descrição |
|------|-------|-----------|
| `POSTGRES_PASSWORD` | `sua_senha_segura` | Senha do PostgreSQL |
| `NEXTAUTH_SECRET` | `sua_chave_secreta` | Chave para JWT (use: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://tickets.seudominio.com` | URL da aplicação |
| `DOMAIN` | `tickets.seudominio.com` | Domínio para Traefik |
| `APP_PORT` | `3000` | Porta da aplicação |

#### 5. Deploy
1. Clique em **Deploy the stack**
2. Aguarde o download das imagens
3. Verifique se todos os containers estão rodando

### Método 2: Via Linha de Comando

#### 1. Clonar Repositório
```bash
git clone https://github.com/betjuliano/Ticket.git
cd Ticket
```

#### 2. Configurar Variáveis
```bash
cp .env.production .env.production.local
nano .env.production.local
```

Edite com suas configurações:
```env
POSTGRES_PASSWORD=sua_senha_segura
NEXTAUTH_SECRET=sua_chave_secreta
NEXTAUTH_URL=https://tickets.seudominio.com
DOMAIN=tickets.seudominio.com
APP_PORT=3000
```

#### 3. Build da Imagem
```bash
docker build -t ticket-system:latest .
```

#### 4. Deploy
```bash
# Com Traefik
docker-compose -f docker-compose.portainer.yml up -d

# Sem Traefik (apenas porta)
docker-compose up -d
```

## 🔍 Verificação do Deploy

### 1. Verificar Containers
```bash
# Via Docker
docker ps

# Via Portainer
# Acesse Containers e verifique status
```

### 2. Verificar Logs
```bash
# Logs da aplicação
docker logs ticket-app -f

# Logs do banco
docker logs ticket-postgres -f
```

### 3. Testar Aplicação
1. Acesse: `https://tickets.seudominio.com`
2. Faça login com:
   - Email: `admin@ticket.local`
   - Senha: `admin123`

### 4. Verificar SSL (se usando Traefik)
```bash
# Verificar certificado
curl -I https://tickets.seudominio.com

# Verificar redirecionamento HTTP → HTTPS
curl -I http://tickets.seudominio.com
```

## 🔧 Configurações Avançadas

### Backup Automático
```bash
# Criar script de backup
cat > /opt/backup-ticket.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/ticket"
mkdir -p $BACKUP_DIR

# Backup do banco
docker exec ticket-postgres pg_dump -U postgres ticket_system > $BACKUP_DIR/db_$DATE.sql

# Backup dos volumes
docker run --rm -v ticket_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/volumes_$DATE.tar.gz -C /data .

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup-ticket.sh

# Adicionar ao crontab (backup diário às 2h)
echo "0 2 * * * /opt/backup-ticket.sh" | crontab -
```

### Monitoramento
```bash
# Instalar ctop para monitoramento
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop

# Usar ctop
ctop
```

### Logs Centralizados
```yaml
# Adicionar ao docker-compose
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🚨 Solução de Problemas

### Container não inicia
```bash
# Verificar logs
docker logs ticket-app

# Verificar recursos
docker stats

# Verificar rede
docker network ls
docker network inspect ticket_ticket-network
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
docker exec ticket-postgres pg_isready -U postgres

# Testar conexão
docker exec ticket-app npx prisma db push
```

### SSL não funciona
```bash
# Verificar Traefik
docker logs traefik

# Verificar DNS
nslookup tickets.seudominio.com

# Verificar certificado
openssl s_client -connect tickets.seudominio.com:443
```

### Performance lenta
```bash
# Verificar recursos
htop
df -h

# Otimizar PostgreSQL
docker exec -it ticket-postgres psql -U postgres -d ticket_system -c "VACUUM ANALYZE;"
```

## 📊 Monitoramento de Produção

### Métricas Importantes
- CPU e RAM dos containers
- Espaço em disco
- Conexões do banco de dados
- Tempo de resposta da aplicação
- Logs de erro

### Alertas Recomendados
- Container parado
- Uso de CPU > 80%
- Uso de RAM > 90%
- Espaço em disco < 10%
- Erro 500 na aplicação

## 🔄 Atualizações

### Atualizar Aplicação
```bash
# Parar containers
docker-compose down

# Atualizar código
git pull origin main

# Rebuild
docker build -t ticket-system:latest .

# Reiniciar
docker-compose up -d
```

### Atualizar via Portainer
1. Acesse **Images** → **Build**
2. Faça upload do novo código
3. Rebuild a imagem
4. Restart o stack

---

**✅ Deploy concluído! Sua aplicação está rodando em produção com Docker + Portainer + Traefik.**

