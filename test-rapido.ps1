# Script de teste para deploy rapido
param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Deploy Rapido para VPS" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "CONFIGURACOES:"
    Write-Host "  VPS: 207.180.254.250"
    Write-Host "  Usuario: root"
    Write-Host "  Caminho: /root/ticket-system"
    Write-Host ""
    Write-Host "COMANDOS:"
    Write-Host "  .\test-rapido.ps1 -Help    # Mostrar ajuda"
    Write-Host ""
    exit 0
}

Write-Host "Script de teste funcionando!" -ForegroundColor Green
Write-Host "Para usar o deploy completo: .\deploy-to-vps.ps1 -Help" -ForegroundColor Yellow