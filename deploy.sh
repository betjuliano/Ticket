#!/bin/bash

# Script de deploy para Ticket System
# Uso: ./deploy.sh [ambiente]
# Ambientes: development, production

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado. Instale o Docker primeiro."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
    fi
}

# Verificar se o arquivo .env existe
check_env_file() {
    local env_file=".env.${ENVIRONMENT}"
    
    if [ ! -f "$env_file" ]; then
        error "Arquivo de ambiente $env_file não encontrado!"
    fi
    
    # Copiar arquivo de ambiente
    cp "$env_file" .env
    log "Arquivo de ambiente $env_file carregado"
}

# Verificar configurações de segurança
check_security() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Verificando configurações de segurança..."
        
        # Verificar se senhas padrão foram alteradas
        if grep -q "sua_senha_" .env; then
            error "Senhas padrão detectadas no arquivo .env! Altere todas as senhas antes do deploy em produção."
        fi
        
        if grep -q "seudominio.com" .env; then
            warning "Domínio padrão detectado. Certifique-se de alterar DOMAIN no arquivo .env"
        fi
        
        success "Verificações de segurança concluídas"
    fi
}

# Fazer backup dos dados
backup_data() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Criando backup dos dados..."
        
        # Criar diretório de backup
        mkdir -p backups
        
        # Backup do banco de dados
        if docker ps | grep -q "ticket-postgres"; then
            docker exec ticket-postgres pg_dump -U ticket_user ticket_db > "backups/backup_$(date +%Y%m%d_%H%M%S).sql"
            success "Backup do banco de dados criado"
        fi
    fi
}

# Build da aplicação
build_app() {
    log "Fazendo build da aplicação..."
    
    # Parar containers existentes
    docker-compose down
    
    # Remover imagens antigas (opcional)
    if [ "$CLEAN_BUILD" = "true" ]; then
        log "Removendo imagens antigas..."
        docker-compose down --rmi all --volumes --remove-orphans
    fi
    
    # Build da nova imagem
    docker-compose build --no-cache
    
    success "Build da aplicação concluído"
}

# Deploy da aplicação
deploy_app() {
    log "Iniciando deploy da aplicação..."
    
    # Iniciar serviços
    docker-compose up -d
    
    # Aguardar serviços ficarem prontos
    log "Aguardando serviços ficarem prontos..."
    sleep 30
    
    # Verificar status dos serviços
    if docker-compose ps | grep -q "Up"; then
        success "Aplicação deployada com sucesso!"
    else
        error "Falha no deploy. Verifique os logs: docker-compose logs"
    fi
}

# Verificar saúde da aplicação
health_check() {
    log "Verificando saúde da aplicação..."
    
    # Aguardar um pouco mais para a aplicação inicializar
    sleep 10
    
    # Verificar endpoint de health
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        success "Aplicação está respondendo corretamente"
    else
        warning "Aplicação pode não estar respondendo. Verifique os logs."
    fi
}

# Mostrar informações pós-deploy
show_info() {
    echo ""
    echo "=================================="
    echo "  DEPLOY CONCLUÍDO"
    echo "=================================="
    echo ""
    echo "Ambiente: $ENVIRONMENT"
    echo ""
    echo "URLs de acesso:"
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "  - Aplicação: https://$(grep DOMAIN .env | cut -d'=' -f2)"
        echo "  - Traefik Dashboard: https://traefik.$(grep DOMAIN .env | cut -d'=' -f2)"
    else
        echo "  - Aplicação: http://localhost"
        echo "  - Traefik Dashboard: http://localhost:8080"
    fi
    echo ""
    echo "Comandos úteis:"
    echo "  - Ver logs: docker-compose logs -f"
    echo "  - Parar aplicação: docker-compose down"
    echo "  - Reiniciar aplicação: docker-compose restart"
    echo "  - Ver status: docker-compose ps"
    echo ""
}

# Função principal
main() {
    # Definir ambiente
    ENVIRONMENT=${1:-development}
    CLEAN_BUILD=${2:-false}
    
    log "Iniciando deploy para ambiente: $ENVIRONMENT"
    
    # Verificações
    check_docker
    check_env_file
    check_security
    
    # Deploy
    backup_data
    build_app
    deploy_app
    health_check
    show_info
}

# Verificar argumentos
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Uso: $0 [ambiente] [clean]"
    echo ""
    echo "Ambientes:"
    echo "  development  - Deploy para desenvolvimento (padrão)"
    echo "  production   - Deploy para produção"
    echo ""
    echo "Opções:"
    echo "  clean        - Remove imagens antigas antes do build"
    echo ""
    echo "Exemplos:"
    echo "  $0                    # Deploy development"
    echo "  $0 production         # Deploy production"
    echo "  $0 production clean   # Deploy production com limpeza"
    exit 0
fi

# Executar função principal
main "$@"

