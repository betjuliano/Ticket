@echo off
REM Script de Deploy para Produção - Ticket System
REM Domínio: iadm.iaprojetos.com.br

echo 🚀 Iniciando deploy para produção...
echo 📍 Domínio: iadm.iaprojetos.com.br
echo.

REM Verificar se o arquivo .env.production existe
if not exist ".env.production" (
    echo ❌ Erro: Arquivo .env.production não encontrado!
    echo    Certifique-se de configurar as variáveis de ambiente para produção.
    pause
    exit /b 1
)

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Erro: Docker não está rodando!
    echo    Inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)

echo ✅ Verificações iniciais concluídas
echo.

REM Parar containers existentes (se houver)
echo 🛑 Parando containers existentes...
docker-compose -f docker-compose.yml --env-file .env.production down --remove-orphans
echo.

REM Build da aplicação
echo 🔨 Fazendo build da aplicação...
docker-compose -f docker-compose.yml --env-file .env.production build --no-cache
echo.

REM Iniciar serviços
echo 🚀 Iniciando serviços...
docker-compose -f docker-compose.yml --env-file .env.production up -d
echo.

REM Aguardar serviços ficarem prontos
echo ⏳ Aguardando serviços ficarem prontos...
timeout /t 30 /nobreak >nul

REM Verificar status dos containers
echo 📊 Status dos containers:
docker-compose -f docker-compose.yml --env-file .env.production ps
echo.

REM Verificar logs da aplicação
echo 📋 Últimos logs da aplicação:
docker-compose -f docker-compose.yml --env-file .env.production logs --tail=20 ticket-app
echo.

echo 🎉 Deploy concluído!
echo 🌐 Aplicação disponível em: https://iadm.iaprojetos.com.br
echo 📊 Dashboard Traefik: https://traefik.iadm.iaprojetos.com.br
echo.
echo 📝 Comandos úteis:
echo    Ver logs: docker-compose -f docker-compose.yml --env-file .env.production logs -f
echo    Parar: docker-compose -f docker-compose.yml --env-file .env.production down
echo    Reiniciar: docker-compose -f docker-compose.yml --env-file .env.production restart
echo.
pause