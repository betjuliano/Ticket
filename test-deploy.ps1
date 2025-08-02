# Script de teste para deploy
param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Script de Deploy para VPS" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "CONFIGURACOES:"
    Write-Host "  VPS: 207.180.254.250"
    Write-Host "  Usuario: root"
    Write-Host "  Caminho: /root/ticket-system"
    Write-Host ""
    Write-Host "COMANDOS:"
    Write-Host "  .\test-deploy.ps1 -Help    # Mostrar ajuda"
    Write-Host ""
    exit 0
}

# Teste de variaveis
$VpsHost = "207.180.254.250"
$VpsUser = "root"
$VpsPath = "/root/ticket-system"

Write-Host "PowerShell funcionando corretamente!" -ForegroundColor Green
Write-Host "Servidor: $VpsHost" -ForegroundColor Cyan
Write-Host "Usuario: $VpsUser" -ForegroundColor Cyan
Write-Host "Caminho: $VpsPath" -ForegroundColor Cyan

# Teste de concatenacao de strings
$testCmd = "ssh ${VpsUser}@${VpsHost} echo teste"
Write-Host "Comando de teste: $testCmd" -ForegroundColor Yellow

Write-Host "Sintaxe do script esta correta!" -ForegroundColor Green