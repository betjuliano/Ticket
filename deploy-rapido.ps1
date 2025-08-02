#!/usr/bin/env pwsh
# Script de Deploy Rápido para VPS
# Configurações pré-definidas para o servidor 207.180.254.250

param(
    [switch]$SkipUpload,
    [switch]$SkipBuild,
    [switch]$Force,
    [switch]$Help
)

# Configurações fixas do VPS
$VPS_HOST = "207.180.254.250"
$VPS_USER = "root"
$VPS_PATH = "/root/ticket-system"

# Cores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Info { Write-ColorOutput Cyan $args }

if ($Help) {
    Write-Info "🚀 Script de Deploy Rápido para VPS"
    Write-Output ""
    Write-Output "USO:"
    Write-Output "  .\deploy-rapido.ps1                    # Deploy completo"
    Write-Output "  .\deploy-rapido.ps1 -SkipUpload        # Pular upload"
    Write-Output "  .\deploy-rapido.ps1 -SkipBuild         # Pular build"
    Write-Output "  .\deploy-rapido.ps1 -Force             # Forçar deploy"
    Write-Output ""
    Write-Output "CONFIGURAÇÕES:"
    Write-Output "  VPS: $VPS_HOST"
    Write-Output "  Usuário: $VPS_USER"
    Write-Output "  Caminho: $VPS_PATH"
    Write-Output ""
    Write-Output "COMANDOS SSH:"
    Write-Output "  ssh $VPS_USER@$VPS_HOST"
    Write-Output ""
    exit 0
}

Write-Info "🚀 Iniciando Deploy Rápido para VPS"
Write-Info "📡 Servidor: $VPS_HOST"
Write-Info "👤 Usuário: $VPS_USER"
Write-Info "📁 Caminho: $VPS_PATH"
Write-Output ""

# Verificar conectividade SSH
Write-Info "🔍 Verificando conectividade SSH..."
try {
    $testResult = ssh -o ConnectTimeout=10 -o BatchMode=yes "$VPS_USER@$VPS_HOST" "echo 'SSH OK'"
    if ($testResult -eq "SSH OK") {
        Write-Success "✅ Conexão SSH estabelecida"
    } else {
        Write-Error "❌ Falha na conexão SSH"
        exit 1
    }
} catch {
    Write-Error "❌ Erro ao testar SSH: $($_.Exception.Message)"
    exit 1
}

# 1. Upload dos arquivos (se não pular)
if (-not $SkipUpload) {
    Write-Info "📤 Fazendo upload dos arquivos..."
    
    # Criar diretório no VPS
    ssh "$VPS_USER@$VPS_HOST" "mkdir -p $VPS_PATH"
    
    # Verificar se rsync está disponível via WSL
    $useRsync = $false
    try {
        $wslCheck = wsl --list --quiet 2>$null
        if ($wslCheck) {
            Write-Info "📦 Usando rsync via WSL..."
            $excludes = @(
                "--exclude=node_modules",
                "--exclude=.git",
                "--exclude=.next",
                "--exclude=dist",
                "--exclude=build",
                "--exclude=.venv",
                "--exclude=__pycache__",
                "--exclude=*.log"
            )
            
            $rsyncCmd = "rsync -avz --delete $($excludes -join ' ') ./ $VPS_USER@${VPS_HOST}:$VPS_PATH/"
            wsl bash -c $rsyncCmd
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "✅ Upload via rsync concluído"
                $useRsync = $true
            }
        }
    } catch {
        Write-Warning "⚠️ Rsync não disponível, usando scp..."
    }
    
    # Fallback para scp se rsync falhar
    if (-not $useRsync) {
        Write-Info "📦 Usando scp para upload..."
        scp -r . "$VPS_USER@${VPS_HOST}:$VPS_PATH/"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✅ Upload via scp concluído"
        } else {
            Write-Error "❌ Falha no upload via scp"
            exit 1
        }
    }
} else {
    Write-Warning "⏭️ Upload pulado"
}

# 2. Build da imagem Docker (se não pular)
if (-not $SkipBuild) {
    Write-Info "🐳 Fazendo build da imagem Docker..."
    
    $buildCmd = @"
cd $VPS_PATH && \
docker build -t ticket-system:latest . && \
echo 'Build concluído com sucesso'
"@
    
    $buildResult = ssh "$VPS_USER@$VPS_HOST" $buildCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✅ Build da imagem concluído"
    } else {
        Write-Error "❌ Falha no build da imagem"
        Write-Error $buildResult
        exit 1
    }
} else {
    Write-Warning "⏭️ Build pulado"
}

# 3. Deploy no Portainer
Write-Info "🚀 Fazendo deploy no Portainer..."

$deployCmd = @"
cd $VPS_PATH && \
if command -v pwsh >/dev/null 2>&1; then
    pwsh -File deploy-portainer.ps1 deploy $(if ($Force) { '-Force' })
else
    echo 'PowerShell não encontrado, tentando deploy via API...'
    curl -X POST 'https://portainer.iaprojetos.com.br/api/stacks' \
        -H 'Authorization: Bearer yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJpYXByb2pldG9zIiwicm9sZSI6MSwic2NvcGUiOiJkZWZhdWx0IiwiZm9yY2VDaGFuZ2VQYXNzd29yZCI6ZmFsc2UsImV4cCI6MTc1MjEzOTIzOSwiaWF0IjoxNzUyMTEwNDM5LCJqdGkiOiJjMDE2MGY5ZC1jZWFkLTQ1ZjEtOWY4Yi1jNzY4YWRkYWJhN2YifQ.sPR5c2N-6Gfjhmnkhj1yspA64mbn7VOlD9lLIjaeSlI' \
        -H 'Content-Type: application/json' \
        -d @portainer-deploy.json
fi
"@

$deployResult = ssh "$VPS_USER@$VPS_HOST" $deployCmd

if ($LASTEXITCODE -eq 0) {
    Write-Success "✅ Deploy no Portainer concluído"
    Write-Output ""
    Write-Success "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
    Write-Output ""
    Write-Info "🔗 Links importantes:"
    Write-Output "   • Aplicação: https://iadm.iaprojetos.com.br"
    Write-Output "   • Portainer: https://portainer.iaprojetos.com.br"
    Write-Output "   • Traefik: https://traefik.iaprojetos.com.br"
    Write-Output ""
    Write-Info "📊 Para verificar status:"
    Write-Output "   ssh $VPS_USER@$VPS_HOST `"docker ps | grep ticket`""
    Write-Output ""
} else {
    Write-Error "❌ Falha no deploy no Portainer"
    Write-Error $deployResult
    Write-Output ""
    Write-Warning "🔧 Comandos para debug:"
    Write-Output "   ssh $VPS_USER@$VPS_HOST"
    Write-Output "   cd $VPS_PATH"
    Write-Output "   docker images | grep ticket-system"
    Write-Output "   docker ps -a"
    exit 1
}

Write-Info "✨ Deploy finalizado!"