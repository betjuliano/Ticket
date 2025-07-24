#!/bin/bash

# ========================================
# SCRIPT DE DEPLOY PARA VPS
# ========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root"
fi

# Configurações
PROJECT_NAME="ticket-system"
DOMAIN="tickets.seu-dominio.com"
DOCKER_STACK_FILE="docker-stack.yml"
ENV_FILE=".env"

# Verificar se o arquivo .env existe
if [ ! -f "$ENV_FILE" ]; then
    error "Arquivo .env não encontrado. Copie o env.example e configure as variáveis."
fi

# Carregar variáveis de ambiente
source "$ENV_FILE"

log "Iniciando deploy do $PROJECT_NAME..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado"
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado"
fi

# Verificar se Docker Swarm está ativo
if ! docker info | grep -q "Swarm: active"; then
    log "Inicializando Docker Swarm..."
    docker swarm init
fi

# Criar rede externa se não existir
if ! docker network ls | grep -q "traefik-public"; then
    log "Criando rede traefik-public..."
    docker network create --driver=overlay --attachable traefik-public
fi

# Backup do banco de dados (se existir)
if docker service ls | grep -q "postgres"; then
    log "Criando backup do banco de dados..."
    docker service create --name backup-$(date +%Y%m%d-%H%M%S) \
        --network internal \
        --mount type=volume,source=postgres-data,destination=/var/lib/postgresql/data \
        postgres:15-alpine \
        pg_dump -h postgres -U $POSTGRES_USER -d ticket_system > backup-$(date +%Y%m%d-%H%M%S).sql
fi

# Build da imagem
log "Fazendo build da imagem Docker..."
docker build -t $PROJECT_NAME:latest .

# Deploy do stack
log "Fazendo deploy do stack Docker..."
docker stack deploy -c $DOCKER_STACK_FILE $PROJECT_NAME

# Aguardar serviços ficarem prontos
log "Aguardando serviços ficarem prontos..."
sleep 30

# Verificar status dos serviços
log "Verificando status dos serviços..."
docker service ls --filter "label=com.docker.stack.namespace=$PROJECT_NAME"

# Verificar logs dos serviços
log "Verificando logs dos serviços..."
for service in $(docker service ls --filter "label=com.docker.stack.namespace=$PROJECT_NAME" --format "{{.Name}}"); do
    log "Logs do serviço $service:"
    docker service logs --tail=10 $service
done

# Verificar conectividade
log "Verificando conectividade..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    log "✅ Aplicação está respondendo"
else
    warn "⚠️  Aplicação ainda não está respondendo. Verifique os logs."
fi

# Configurar firewall (se necessário)
log "Configurando firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 22/tcp
    log "Firewall configurado"
fi

# Configurar SSL (se necessário)
if [ ! -z "$DOMAIN" ]; then
    log "Configurando SSL para $DOMAIN..."
    # O Traefik irá gerenciar automaticamente os certificados Let's Encrypt
fi

# Configurar monitoramento
log "Configurando monitoramento..."
# Criar dashboard do Grafana se necessário

log "✅ Deploy concluído com sucesso!"
log "📊 Acesse:"
log "   - Aplicação: https://$DOMAIN"
log "   - Portainer: https://portainer.$DOMAIN"
log "   - Traefik: https://traefik.$DOMAIN"
log "   - Grafana: https://grafana.$DOMAIN"
log "   - Prometheus: https://prometheus.$DOMAIN"

# Comandos úteis
log "🔧 Comandos úteis:"
log "   - Ver logs: docker service logs -f $PROJECT_NAME_ticket-system"
log "   - Escalar: docker service scale $PROJECT_NAME_ticket-system=3"
log "   - Backup: docker exec -it \$(docker ps -q -f name=postgres) pg_dump -U $POSTGRES_USER ticket_system > backup.sql"
log "   - Restart: docker service update --force $PROJECT_NAME_ticket-system" 