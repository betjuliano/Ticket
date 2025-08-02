# ========================================
# SCRIPT DE DEPLOY COMPLETO PARA VPS
# Upload + Build + Deploy no Portainer
# ========================================

param(
    [string]$VpsHost = "207.180.254.250",
    [string]$VpsUser = "root",
    [string]$VpsPath = "/root/ticket-system",
    [string]$SshKey = "",
    [switch]$SkipUpload,
    [switch]$SkipBuild,
    [switch]$Force,
    [switch]$Help
)

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

function Show-Help {
    Write-ColorOutput Cyan @"
🚀 DEPLOY COMPLETO PARA VPS + PORTAINER

USO:
    .\deploy-to-vps.ps1 -VpsHost "seu-servidor.com" -VpsUser "usuario" [opções]

PARÂMETROS:
    -VpsHost     IP ou domínio da VPS (obrigatório)
    -VpsUser     Usuário SSH da VPS (obrigatório)
    -VpsPath     Caminho no servidor (padrão: /home/usuario/ticket-system)
    -SshKey      Caminho para chave SSH privada (opcional)
    -SkipUpload  Pular upload dos arquivos
    -SkipBuild   Pular build da imagem Docker
    -Force       Forçar operações sem confirmação

EXEMPLOS:
    .\deploy-to-vps.ps1 -VpsHost "192.168.1.100" -VpsUser "root"
    .\deploy-to-vps.ps1 -VpsHost "meuservidor.com" -VpsUser "ubuntu" -SshKey "~\.ssh\id_rsa"
    .\deploy-to-vps.ps1 -VpsHost "vps.com" -VpsUser "user" -SkipUpload -Force

"@
}

# Verificar se foi solicitada ajuda
if ($Help) {
    Show-Help
    exit 0
}

# Se nenhum parâmetro foi fornecido, mostrar ajuda
if (-not $VpsHost -and -not $VpsUser) {
    Show-Help
    exit 0
}

# Verificar parâmetros obrigatórios
if (-not $VpsHost -or $VpsHost -eq "seu-servidor.com") {
    Write-ColorOutput Red "[ERRO] Parâmetro -VpsHost é obrigatório!"
    Show-Help
    exit 1
}

if (-not $VpsUser -or $VpsUser -eq "usuario") {
    Write-ColorOutput Red "[ERRO] Parâmetro -VpsUser é obrigatório!"
    Show-Help
    exit 1
}

Write-ColorOutput Green "[DEPLOY] SISTEMA DE TICKETS - VPS + PORTAINER"
Write-ColorOutput Yellow "[INFO] Servidor: $VpsHost"
Write-ColorOutput Yellow "[INFO] Usuário: $VpsUser"
Write-ColorOutput Yellow "[INFO] Caminho: $VpsPath"

# Verificar se WSL está disponível para rsync
$useWsl = $false
if (Get-Command wsl -ErrorAction SilentlyContinue) {
    Write-ColorOutput Green "[OK] WSL detectado - usando rsync nativo"
    $useWsl = $true
} else {
    Write-ColorOutput Yellow "[AVISO] WSL não detectado - usando scp via PowerShell"
}

# Função para executar comandos SSH
function Invoke-SshCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-ColorOutput Yellow "[SSH] $Description"
    
    $sshCmd = "ssh"
    if ($SshKey) {
        $sshCmd += " -i `"$SshKey`""
    }
    $sshCmd += " ${VpsUser}@${VpsHost} `"$Command`""
    
    if ($useWsl) {
        $result = wsl bash -c $sshCmd
    } else {
        # Usar ssh do Windows (se disponível) ou plink
        $result = Invoke-Expression $sshCmd
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "[ERRO] Falha ao executar: $Description"
        return $false
    }
    
    return $true
}

# 1. UPLOAD DOS ARQUIVOS
if (-not $SkipUpload) {
    Write-ColorOutput Cyan "\n=== ETAPA 1: UPLOAD DOS ARQUIVOS ==="
    
    # Criar diretório no servidor
    if (-not (Invoke-SshCommand "mkdir -p $VpsPath" "Criando diretório no servidor")) {
        exit 1
    }
    
    # Lista de arquivos/pastas para upload
    $filesToUpload = @(
        "app",
        "components",
        "lib",
        "prisma",
        "public",
        "styles",
        "types",
        "docker-compose.portainer.yml",
        ".env.portainer",
        "Dockerfile",
        "next.config.js",
        "package.json",
        "package-lock.json",
        "tailwind.config.js",
        "tsconfig.json",
        "postcss.config.js"
    )
    
    Write-ColorOutput Yellow "[INFO] Fazendo upload dos arquivos..."
    
    foreach ($item in $filesToUpload) {
        if (Test-Path $item) {
            Write-ColorOutput Gray "  → Uploading $item"
            
            if ($useWsl) {
                # Usar rsync via WSL
                $rsyncCmd = "rsync -avz --delete"
                if ($SshKey) {
                    $rsyncCmd += " -e 'ssh -i $SshKey'"
                }
                $rsyncCmd += " ./$item/ ${VpsUser}@${VpsHost}:${VpsPath}/$item/"
                
                $result = wsl bash -c $rsyncCmd
            } else {
                # Usar scp (menos eficiente)
                $scpCmd = "scp -r"
                if ($SshKey) {
                    $scpCmd += " -i `"$SshKey`""
                }
                $scpCmd += " `"$item`" ${VpsUser}@${VpsHost}:${VpsPath}/"
                
                $result = Invoke-Expression $scpCmd
            }
            
            if ($LASTEXITCODE -ne 0) {
                Write-ColorOutput Red "[ERRO] Falha no upload de $item"
                exit 1
            }
        } else {
            Write-ColorOutput Yellow "[AVISO] $item não encontrado - pulando"
        }
    }
    
    Write-ColorOutput Green "[OK] Upload concluído com sucesso!"
} else {
    Write-ColorOutput Yellow "[SKIP] Upload pulado conforme solicitado"
}

# 2. BUILD DA IMAGEM DOCKER
if (-not $SkipBuild) {
    Write-ColorOutput Cyan "\n=== ETAPA 2: BUILD DA IMAGEM DOCKER ==="
    
    # Verificar se Docker está instalado na VPS
    if (-not (Invoke-SshCommand "docker --version" "Verificando Docker na VPS")) {
        Write-ColorOutput Red "[ERRO] Docker não está instalado na VPS!"
        exit 1
    }
    
    # Fazer build da imagem
    $buildCmd = "cd $VpsPath && docker build -t ticket-system:latest ."
    if (-not (Invoke-SshCommand $buildCmd "Fazendo build da imagem Docker")) {
        Write-ColorOutput Red "[ERRO] Falha no build da imagem!"
        exit 1
    }
    
    Write-ColorOutput Green "[OK] Build da imagem concluído!"
} else {
    Write-ColorOutput Yellow "[SKIP] Build pulado conforme solicitado"
}

# 3. DEPLOY NO PORTAINER
Write-ColorOutput Cyan "\n=== ETAPA 3: DEPLOY NO PORTAINER ==="

# Executar o script de deploy do Portainer
$deployCmd = "cd $VpsPath && pwsh -File deploy-portainer.ps1 deploy"
if ($Force) {
    $deployCmd += " -Force"
}

if (-not (Invoke-SshCommand $deployCmd "Executando deploy no Portainer")) {
    Write-ColorOutput Red "[ERRO] Falha no deploy do Portainer!"
    Write-ColorOutput Yellow "[INFO] Tentando deploy manual..."
    
    # Tentar deploy manual via API
    $manualDeployCmd = @"
cd $VpsPath
curl -X POST "https://portainer.iaprojetos.com.br/api/stacks" \
  -H "Authorization: Bearer yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJpYXByb2pldG9zIiwicm9sZSI6MSwic2NvcGUiOiJkZWZhdWx0IiwiZm9yY2VDaGFuZ2VQYXNzd29yZCI6ZmFsc2UsImV4cCI6MTc1MjEzOTIzOSwiaWF0IjoxNzUyMTEwNDM5LCJqdGkiOiJjMDE2MGY5ZC1jZWFkLTQ1ZjEtOWY4Yi1jNzY4YWRkYWJhN2YifQ.sPR5c2N-6Gfjhmnkhj1yspA64mbn7VOlD9lLIjaeSlI" \
  -H "Content-Type: application/json" \
  -d @portainer-deploy.json
"@
    
    if (-not (Invoke-SshCommand $manualDeployCmd "Deploy manual via API")) {
        Write-ColorOutput Red "[ERRO] Deploy manual também falhou!"
        exit 1
    }
}

Write-ColorOutput Green "[OK] Deploy no Portainer concluído!"

# 4. VERIFICAÇÕES FINAIS
Write-ColorOutput Cyan "\n=== ETAPA 4: VERIFICAÇÕES FINAIS ==="

# Verificar se os containers estão rodando
if (Invoke-SshCommand "docker ps | grep ticket" "Verificando containers") {
    Write-ColorOutput Green "[OK] Containers estão rodando!"
} else {
    Write-ColorOutput Yellow "[AVISO] Containers podem não estar rodando ainda"
}

# Verificar logs
Invoke-SshCommand "docker logs ticket-system_ticket-system-multidominio --tail 10" "Verificando logs da aplicação"

Write-ColorOutput Green "\n✅ DEPLOY CONCLUÍDO COM SUCESSO!"
Write-ColorOutput Cyan @"

📊 ACESSE SUA APLICAÇÃO:
   🌐 Aplicação: https://iadm.iaprojetos.com.br
   🐳 Portainer: https://portainer.iaprojetos.com.br
   🔀 Traefik: https://traefik.iaprojetos.com.br

🔧 COMANDOS ÚTEIS:
   ssh $VpsUser@$VpsHost
   docker ps
   docker logs ticket-system_ticket-system-multidominio
   docker service ls

"@

Write-ColorOutput Yellow "[INFO] Deploy finalizado em $(Get-Date)"