#!/usr/bin/env pwsh
# Script para deploy na VPS com Traefik/Portainer já configurados

param(
    [Parameter(Mandatory=$false)]
    [string]$VpsHost = "207.180.254.250",
    [string]$VpsUser = "root",
    [string]$VpsPath = "/root/ticket-system",
    [string]$Domain = "app.iadm.iaprojetos.com.br",
    [string]$SshKey = "Admjuliano1",
    [switch]$SkipBuild,
    [switch]$Help
)

function Show-Help {
    Write-Host "=== DEPLOY PARA VPS COM TRAEFIK EXISTENTE ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Deploy da aplicação para VPS onde Traefik/Portainer já estão funcionando."
    Write-Host ""
    Write-Host "USO:" -ForegroundColor Yellow
    Write-Host "  .\deploy-to-existing-vps.ps1 -VpsHost IP -VpsUser USER [opções]"
    Write-Host ""
    Write-Host "PARÂMETROS:" -ForegroundColor Yellow
    Write-Host "  -VpsHost     IP ou hostname da VPS"
    Write-Host "  -VpsUser     Usuário SSH (padrão: root)"
    Write-Host "  -VpsPath     Caminho no servidor (padrão: /root/ticket-system)"
    Write-Host "  -Domain      Domínio da aplicação (padrão: app.iadm.iaprojetos.com.br)"
    Write-Host "  -SshKey      Caminho para chave SSH privada"
    Write-Host "  -SkipBuild   Pular build da aplicação"
    Write-Host "  -Help        Mostra esta ajuda"
    Write-Host ""
    Write-Host "EXEMPLOS:" -ForegroundColor Yellow
    Write-Host "  .\deploy-to-existing-vps.ps1 -VpsHost 192.168.1.100 -VpsUser root"
    Write-Host "  .\deploy-to-existing-vps.ps1 -VpsHost minha-vps.com -SshKey ~/.ssh/id_rsa"
    Write-Host ""
}

if ($Help) {
    Show-Help
    exit 0
}

if ($VpsHost -eq "SEU_IP_VPS") {
    Write-Host "❌ Erro: Você precisa especificar o IP da VPS" -ForegroundColor Red
    Write-Host "Use: .\deploy-to-existing-vps.ps1 -VpsHost SEU_IP_AQUI" -ForegroundColor Yellow
    exit 1
}

Write-Host "=== DEPLOY PARA VPS EXISTENTE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuração:" -ForegroundColor Yellow
Write-Host "  VPS: $VpsHost"
Write-Host "  Usuário: $VpsUser"
Write-Host "  Caminho: $VpsPath"
Write-Host "  Domínio: $Domain"
Write-Host ""

# Verificar conexão SSH
Write-Host "Testando conexão SSH..." -ForegroundColor Yellow
$sshCmd = if ($SshKey) { "ssh -i `"$SshKey`" -o ConnectTimeout=10" } else { "ssh -o ConnectTimeout=10" }
$testConnection = "$sshCmd ${VpsUser}@${VpsHost} 'echo Conexao OK'"

try {
    $result = Invoke-Expression $testConnection 2>$null
    if ($result -match "Conexao OK") {
        Write-Host "✓ Conexão SSH estabelecida" -ForegroundColor Green
    } else {
        throw "Falha na conexão"
    }
} catch {
    Write-Host "❌ Erro: Não foi possível conectar via SSH" -ForegroundColor Red
    Write-Host "Verifique: IP, usuário, chave SSH e conectividade" -ForegroundColor Yellow
    exit 1
}

# Criar diretório na VPS
Write-Host "Criando diretório na VPS..." -ForegroundColor Yellow
$createDirCmd = "$sshCmd ${VpsUser}@${VpsHost} 'mkdir -p ${VpsPath}'"
Invoke-Expression $createDirCmd

# Verificar se Docker está rodando na VPS
Write-Host "Verificando Docker na VPS..." -ForegroundColor Yellow
$dockerCheckCmd = "$sshCmd ${VpsUser}@${VpsHost} 'docker --version && docker ps'"
try {
    $dockerResult = Invoke-Expression $dockerCheckCmd 2>$null
    Write-Host "✓ Docker está funcionando na VPS" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: Docker não está funcionando na VPS" -ForegroundColor Red
    exit 1
}

# Verificar se rede traefik existe
Write-Host "Verificando rede Traefik..." -ForegroundColor Yellow
$networkCheckCmd = "$sshCmd ${VpsUser}@${VpsHost} 'docker network ls | grep traefik'"
try {
    $networkResult = Invoke-Expression $networkCheckCmd 2>$null
    if ($networkResult) {
        Write-Host "✓ Rede Traefik encontrada" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Criando rede Traefik..." -ForegroundColor Yellow
        $createNetworkCmd = "$sshCmd ${VpsUser}@${VpsHost} 'docker network create traefik'"
        Invoke-Expression $createNetworkCmd
    }
} catch {
    Write-Host "⚠️  Criando rede Traefik..." -ForegroundColor Yellow
    $createNetworkCmd = "$sshCmd ${VpsUser}@${VpsHost} 'docker network create traefik'"
    Invoke-Expression $createNetworkCmd
}

# Build da aplicação (se não pular)
if (-not $SkipBuild) {
    Write-Host "Fazendo build da aplicação..." -ForegroundColor Yellow
    try {
        npm run build
        Write-Host "✓ Build concluído" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro no build da aplicação" -ForegroundColor Red
        exit 1
    }
}

# Criar docker-compose.yml para VPS
Write-Host "Criando configuração para VPS..." -ForegroundColor Yellow
$dockerComposeContent = @"
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ticket-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/ticketsystem
      - NEXTAUTH_SECRET=your-super-secret-key-change-this
      - NEXTAUTH_URL=https://$Domain
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - postgres
      - redis
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(``$Domain``)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
      - "traefik.http.services.app.loadbalancer.server.port=3000"
    networks:
      - traefik

  postgres:
    image: postgres:15
    container_name: ticket-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=ticketsystem
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres123
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - traefik

  redis:
    image: redis:7-alpine
    container_name: ticket-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - traefik

volumes:
  postgres_data:
  redis_data:

networks:
  traefik:
    external: true
"@

$dockerComposeContent | Out-File -FilePath "docker-compose.vps.yml" -Encoding UTF8

# Upload dos arquivos
Write-Host "Fazendo upload dos arquivos..." -ForegroundColor Yellow
$filesToUpload = @(
    "docker-compose.vps.yml:docker-compose.yml",
    "Dockerfile",
    "package.json",
    "package-lock.json",
    "next.config.js",
    "tailwind.config.ts",
    "tsconfig.json",
    "init-db.sql"
)

foreach ($file in $filesToUpload) {
    $parts = $file.Split(":")
    $localFile = $parts[0]
    $remoteFile = if ($parts.Length -gt 1) { $parts[1] } else { $parts[0] }
    
    if (Test-Path $localFile) {
        $scpCmd = if ($SshKey) { "scp -i `"$SshKey`"" } else { "scp" }
        $uploadCmd = "$scpCmd `"$localFile`" ${VpsUser}@${VpsHost}:${VpsPath}/$remoteFile"
        
        try {
            Invoke-Expression $uploadCmd
            Write-Host "✓ Upload: $localFile" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erro no upload: $localFile" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Arquivo não encontrado: $localFile" -ForegroundColor Yellow
    }
}

# Upload das pastas necessárias
Write-Host "Fazendo upload das pastas..." -ForegroundColor Yellow
$foldersToUpload = @("app", "components", "lib", "prisma", "public", "types")

foreach ($folder in $foldersToUpload) {
    if (Test-Path $folder) {
        $scpCmd = if ($SshKey) { "scp -r -i `"$SshKey`"" } else { "scp -r" }
        $uploadCmd = "$scpCmd `"$folder`" ${VpsUser}@${VpsHost}:${VpsPath}/"
        
        try {
            Invoke-Expression $uploadCmd
            Write-Host "✓ Upload pasta: $folder" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erro no upload da pasta: $folder" -ForegroundColor Red
        }
    }
}

# Deploy na VPS
Write-Host "Fazendo deploy na VPS..." -ForegroundColor Yellow
$deployCommands = @(
    "cd $VpsPath",
    "docker-compose down 2>/dev/null || true",
    "docker-compose up -d --build"
)

$deployCmd = "$sshCmd ${VpsUser}@${VpsHost} '$($deployCommands -join ' && ')'"

try {
    Invoke-Expression $deployCmd
    Write-Host ""
    Write-Host "=== DEPLOY CONCLUÍDO COM SUCESSO! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Acesso:" -ForegroundColor Cyan
    Write-Host "  Aplicação: https://$Domain" -ForegroundColor White
    Write-Host "  Portainer: https://iadm.iaprojetos.com.br" -ForegroundColor White
    Write-Host ""
    Write-Host "Comandos úteis na VPS:" -ForegroundColor Cyan
    Write-Host "  ssh ${VpsUser}@${VpsHost}" -ForegroundColor White
    Write-Host "  cd ${VpsPath} && docker-compose logs -f" -ForegroundColor White
    Write-Host "  cd ${VpsPath} && docker-compose ps" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Erro durante o deploy" -ForegroundColor Red
    Write-Host "Verifique os logs na VPS:" -ForegroundColor Yellow
    Write-Host "  ssh ${VpsUser}@${VpsHost} 'cd ${VpsPath} && docker-compose logs'" -ForegroundColor White
    exit 1
}

# Limpeza
Remove-Item "docker-compose.vps.yml" -ErrorAction SilentlyContinue