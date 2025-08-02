#!/usr/bin/env pwsh
# Teste simples para verificar o IP da VPS

param(
    [Parameter(Mandatory=$false)]
    [string]$VpsHost = "207.180.254.250",
    [switch]$Help
)

function Show-Help {
    Write-Host "=== TESTE VPS IP ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "VPS Host configurado: $VpsHost" -ForegroundColor Green
    Write-Host "Script funcionando corretamente!" -ForegroundColor Green
}

if ($Help) {
    Show-Help
    exit 0
}

Write-Host "VPS configurada para: $VpsHost" -ForegroundColor Green
Write-Host "Script executado com sucesso!" -ForegroundColor Green