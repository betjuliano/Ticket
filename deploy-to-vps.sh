#!/bin/bash

# ========================================
# SCRIPT DE DEPLOY COMPLETO PARA VPS
# Upload + Build + Deploy no Portainer
# ========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Variáveis padrão
VPS_HOST="207.180.254.250"
VPS_USER="root"
VPS_PATH="/root/ticket-system"
SSH_KEY=""
SKIP_UPLOAD=false
SKIP_BUILD=false
FORCE=false

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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

cyan() {
    echo -e "${CYAN}$1${NC}"
}

# Função de ajuda
show_help() {
    cyan "🚀 DEPLOY COMPLETO PARA VPS + PORTAINER"
    echo
    echo "USO:"
    echo "    ./deploy-to-vps.sh -h HOST -u USER [opções]"
    echo
    echo "PARÂMETROS:"
    echo "    -h, --host      IP ou domínio da VPS (obrigatório)"
    echo "    -u, --user      Usuário SSH da VPS (obrigatório)"
    echo "    -p, --path      Caminho no servidor (padrão: /home/\$USER/ticket-system)"
    echo "    -k, --key       Caminho para chave SSH privada (opcional)"
    echo "    --skip-upload   Pular upload dos arquivos"
    echo "    --skip-build    Pular build da imagem Docker"
    echo "    -f, --force     Forçar operações sem confirmação"
    echo "    --help          Mostrar esta ajuda"
    echo
    echo "EXEMPLOS:"
    echo "    ./deploy-to-vps.sh -h 192.168.1.100 -u root"
    echo "    ./deploy-to-vps.sh -h meuservidor.com -u ubuntu -k ~/.ssh/id_rsa"
    echo "    ./deploy-to-vps.sh -h vps.com -u user --skip-upload --force"
    echo
}

# Parse dos argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            VPS_HOST="$2"
            shift 2
            ;;
        -u|--user)
            VPS_USER="$2"
            shift 2
            ;;
        -p|--path)
            VPS_PATH="$2"
            shift 2
            ;;
        -k|--key)
            SSH_KEY="$2"
            shift 2
            ;;
        --skip-upload)
            SKIP_UPLOAD=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            error "Parâmetro desconhecido: $1"
            ;;
    esac
done

# Verificar parâmetros obrigatórios
if [[ -z "$VPS_HOST" ]]; then
    error "Parâmetro --host é obrigatório!"
fi

if [[ -z "$VPS_USER" ]]; then
    error "Parâmetro --user é obrigatório!"
fi

# Substituir $USER no path
VPS_PATH=${VPS_PATH//\$USER/$VPS_USER}

cyan "[DEPLOY] SISTEMA DE TICKETS - VPS + PORTAINER"
info "Servidor: $VPS_HOST"
info "Usuário: $VPS_USER"
info "Caminho: $VPS_PATH"

# Verificar se rsync está disponível
if command -v rsync &> /dev/null; then
    log "rsync detectado - usando sincronização eficiente"
    USE_RSYNC=true
else
    warn "rsync não detectado - usando scp (menos eficiente)"
    USE_RSYNC=false
fi

# Função para executar comandos SSH
ssh_command() {
    local cmd="$1"
    local desc="$2"
    
    info "[SSH] $desc"
    
    local ssh_cmd="ssh"
    if [[ -n "$SSH_KEY" ]]; then
        ssh_cmd="$ssh_cmd -i $SSH_KEY"
    fi
    ssh_cmd="$ssh_cmd $VPS_USER@$VPS_HOST"
    
    if $ssh_cmd "$cmd"; then
        return 0
    else
        error "Falha ao executar: $desc"
        return 1
    fi
}

# 1. UPLOAD DOS ARQUIVOS
if [[ "$SKIP_UPLOAD" != "true" ]]; then
    cyan "\n=== ETAPA 1: UPLOAD DOS ARQUIVOS ==="
    
    # Criar diretório no servidor
    ssh_command "mkdir -p $VPS_PATH" "Criando diretório no servidor"
    
    # Lista de arquivos/pastas para upload
    files_to_upload=(
        "app"
        "components"
        "lib"
        "prisma"
        "public"
        "styles"
        "types"
        "docker-compose.portainer.yml"
        ".env.portainer"
        "Dockerfile"
        "next.config.js"
        "package.json"
        "package-lock.json"
        "tailwind.config.js"
        "tsconfig.json"
        "postcss.config.js"
        "deploy-portainer.ps1"
        "portainer-deploy.json"
    )
    
    info "Fazendo upload dos arquivos..."
    
    for item in "${files_to_upload[@]}"; do
        if [[ -e "$item" ]]; then
            echo -e "${GRAY}  → Uploading $item${NC}"
            
            if [[ "$USE_RSYNC" == "true" ]]; then
                # Usar rsync
                local rsync_cmd="rsync -avz --delete"
                if [[ -n "$SSH_KEY" ]]; then
                    rsync_cmd="$rsync_cmd -e 'ssh -i $SSH_KEY'"
                fi
                
                if [[ -d "$item" ]]; then
                    $rsync_cmd "$item/" "$VPS_USER@$VPS_HOST:$VPS_PATH/$item/"
                else
                    $rsync_cmd "$item" "$VPS_USER@$VPS_HOST:$VPS_PATH/"
                fi
            else
                # Usar scp
                local scp_cmd="scp -r"
                if [[ -n "$SSH_KEY" ]]; then
                    scp_cmd="$scp_cmd -i $SSH_KEY"
                fi
                $scp_cmd "$item" "$VPS_USER@$VPS_HOST:$VPS_PATH/"
            fi
            
            if [[ $? -ne 0 ]]; then
                error "Falha no upload de $item"
            fi
        else
            warn "$item não encontrado - pulando"
        fi
    done
    
    log "Upload concluído com sucesso!"
else
    warn "Upload pulado conforme solicitado"
fi

# 2. BUILD DA IMAGEM DOCKER
if [[ "$SKIP_BUILD" != "true" ]]; then
    cyan "\n=== ETAPA 2: BUILD DA IMAGEM DOCKER ==="
    
    # Verificar se Docker está instalado na VPS
    ssh_command "docker --version" "Verificando Docker na VPS"
    
    # Fazer build da imagem
    ssh_command "cd $VPS_PATH && docker build -t ticket-system:latest ." "Fazendo build da imagem Docker"
    
    log "Build da imagem concluído!"
else
    warn "Build pulado conforme solicitado"
fi

# 3. DEPLOY NO PORTAINER
cyan "\n=== ETAPA 3: DEPLOY NO PORTAINER ==="

# Executar o script de deploy do Portainer
local deploy_cmd="cd $VPS_PATH && pwsh -File deploy-portainer.ps1 deploy"
if [[ "$FORCE" == "true" ]]; then
    deploy_cmd="$deploy_cmd -Force"
fi

if ! ssh_command "$deploy_cmd" "Executando deploy no Portainer"; then
    warn "Falha no deploy do Portainer! Tentando deploy manual..."
    
    # Tentar deploy manual via API
    local manual_deploy_cmd='cd '$VPS_PATH' && curl -X POST "https://portainer.iaprojetos.com.br/api/stacks" \
  -H "Authorization: Bearer yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJpYXByb2pldG9zIiwicm9sZSI6MSwic2NvcGUiOiJkZWZhdWx0IiwiZm9yY2VDaGFuZ2VQYXNzd29yZCI6ZmFsc2UsImV4cCI6MTc1MjEzOTIzOSwiaWF0IjoxNzUyMTEwNDM5LCJqdGkiOiJjMDE2MGY5ZC1jZWFkLTQ1ZjEtOWY4Yi1jNzY4YWRkYWJhN2YifQ.sPR5c2N-6Gfjhmnkhj1yspA64mbn7VOlD9lLIjaeSlI" \
  -H "Content-Type: application/json" \
  -d @portainer-deploy.json'
    
    if ! ssh_command "$manual_deploy_cmd" "Deploy manual via API"; then
        error "Deploy manual também falhou!"
    fi
fi

log "Deploy no Portainer concluído!"

# 4. VERIFICAÇÕES FINAIS
cyan "\n=== ETAPA 4: VERIFICAÇÕES FINAIS ==="

# Verificar se os containers estão rodando
if ssh_command "docker ps | grep ticket" "Verificando containers"; then
    log "Containers estão rodando!"
else
    warn "Containers podem não estar rodando ainda"
fi

# Verificar logs
ssh_command "docker logs ticket-system_ticket-system-multidominio --tail 10" "Verificando logs da aplicação" || true

log "\n✅ DEPLOY CONCLUÍDO COM SUCESSO!"
cyan "
📊 ACESSE SUA APLICAÇÃO:
   🌐 Aplicação: https://iadm.iaprojetos.com.br
   🐳 Portainer: https://portainer.iaprojetos.com.br
   🔀 Traefik: https://traefik.iaprojetos.com.br

🔧 COMANDOS ÚTEIS:
   ssh $VPS_USER@$VPS_HOST
   docker ps
   docker logs ticket-system_ticket-system-multidominio
   docker service ls
"

info "Deploy finalizado em $(date)"