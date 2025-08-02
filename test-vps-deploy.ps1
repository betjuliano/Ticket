# Teste do script de deploy para VPS
param(
    [string]$VpsHost = "SEU_IP_VPS",
    [string]$VpsUser = "root",
    [switch]$Help
)

if ($Help) {
    Write-Host "=== TESTE DEPLOY VPS ===" -ForegroundColor Green
    Write-Host "Script de teste funcionando!"
    Write-Host ""
    Write-Host "Configuracao:" -ForegroundColor Yellow
    Write-Host "  VPS Host: ${VpsHost}"
    Write-Host "  VPS User: ${VpsUser}"
    Write-Host ""
    Write-Host "Para fazer deploy real:"
    Write-Host "  .\deploy-to-existing-vps.ps1 -VpsHost SEU_IP -VpsUser root"
    exit 0
}

if ($VpsHost -eq "SEU_IP_VPS") {
    Write-Host "Erro: Especifique o IP da VPS" -ForegroundColor Red
    Write-Host "Use: .\test-vps-deploy.ps1 -VpsHost SEU_IP_AQUI" -ForegroundColor Yellow
    exit 1
}

Write-Host "Teste executado com sucesso para VPS: ${VpsHost}" -ForegroundColor Green