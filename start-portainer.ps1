#!/usr/bin/env pwsh
# Script para inicializar Portainer com Traefik e SSL

param(
    [string]$Domain = "iadm.iaprojetos.com.br",
    [string]$Email = "admin@iaprojetos.com.br",
    [switch]$Help
)

function Show-Help {
    Write-Host "=== INICIALIZAÇÃO PORTAINER COM TRAEFIK ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Este script configura e inicia o Portainer com Traefik para SSL automático."
    Write-Host ""
    Write-Host "USO:" -ForegroundColor Yellow
    Write-Host "  .\start-portainer.ps1 [-Domain <dominio>] [-Email <email>] [-Help]"
    Write-Host ""
    Write-Host "PARÂMETROS:" -ForegroundColor Yellow
    Write-Host "  -Domain    Domínio para o Portainer (padrão: iadm.iaprojetos.com.br)"
    Write-Host "  -Email     Email para certificados Let's Encrypt (padrão: admin@iaprojetos.com.br)"
    Write-Host "  -Help      Mostra esta ajuda"
    Write-Host ""
    Write-Host "EXEMPLOS:" -ForegroundColor Yellow
    Write-Host "  .\start-portainer.ps1"
    Write-Host "  .\start-portainer.ps1 -Domain meudominio.com -Email admin@meudominio.com"
    Write-Host ""
    Write-Host "ACESSO:" -ForegroundColor Green
    Write-Host "  Portainer: https://$Domain"
    Write-Host "  Traefik Dashboard: https://traefik.$Domain"
    Write-Host ""
}

if ($Help) {
    Show-Help
    exit 0
}

Write-Host "=== CONFIGURANDO PORTAINER COM TRAEFIK ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está rodando
Write-Host "Verificando Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✓ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker não está rodando ou não está instalado" -ForegroundColor Red
    exit 1
}

# Criar diretórios necessários
Write-Host "Criando diretórios..." -ForegroundColor Yellow
$dirs = @("traefik", "letsencrypt")
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✓ Criado diretório: $dir" -ForegroundColor Green
    } else {
        Write-Host "✓ Diretório já existe: $dir" -ForegroundColor Green
    }
}

# Criar arquivo acme.json com permissões corretas
$acmeFile = "letsencrypt\acme.json"
if (!(Test-Path $acmeFile)) {
    New-Item -ItemType File -Path $acmeFile -Force | Out-Null
    Write-Host "✓ Criado arquivo: $acmeFile" -ForegroundColor Green
}

# Criar rede do Traefik
Write-Host "Configurando rede Docker..." -ForegroundColor Yellow
try {
    docker network create traefik 2>$null
    Write-Host "✓ Rede 'traefik' criada" -ForegroundColor Green
} catch {
    Write-Host "✓ Rede 'traefik' já existe" -ForegroundColor Green
}

# Parar containers existentes
Write-Host "Parando containers existentes..." -ForegroundColor Yellow
docker-compose down 2>$null

# Iniciar serviços
Write-Host "Iniciando serviços..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== PORTAINER INICIADO COM SUCESSO! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "ACESSO:" -ForegroundColor Cyan
    Write-Host "  Portainer: https://$Domain" -ForegroundColor White
    Write-Host "  Traefik Dashboard: https://traefik.$Domain" -ForegroundColor White
    Write-Host ""
    Write-Host "COMANDOS ÚTEIS:" -ForegroundColor Cyan
    Write-Host "  Ver logs: docker-compose logs -f" -ForegroundColor White
    Write-Host "  Parar: docker-compose down" -ForegroundColor White
    Write-Host "  Status: docker-compose ps" -ForegroundColor White
    Write-Host ""
    Write-Host "NOTA: Aguarde alguns minutos para os certificados SSL serem gerados." -ForegroundColor Yellow
} else {
    Write-Host "✗ Erro ao iniciar os serviços" -ForegroundColor Red
    Write-Host "Verifique os logs com: docker-compose logs" -ForegroundColor Yellow
    exit 1
}