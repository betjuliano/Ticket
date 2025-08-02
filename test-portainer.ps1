# Teste simples para Portainer
param(
    [switch]$Help
)

if ($Help) {
    Write-Host "=== TESTE PORTAINER ===" -ForegroundColor Green
    Write-Host "Script de teste funcionando!"
    Write-Host ""
    Write-Host "Configuracao:" -ForegroundColor Yellow
    Write-Host "  Dominio: iadm.iaprojetos.com.br"
    Write-Host "  Email: admin@iaprojetos.com.br"
    Write-Host ""
    Write-Host "Para iniciar o Portainer:"
    Write-Host "  docker-compose up -d"
    exit 0
}

Write-Host "Teste executado com sucesso!" -ForegroundColor Green