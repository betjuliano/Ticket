#!/bin/bash
set -e

echo "🚀 Iniciando deploy do Ticket System..."

# Verificar se o arquivo .env.production existe
if [ ! -f ".env.production" ]; then
    echo "❌ Arquivo .env.production não encontrado!"
    echo "📝 Copie o arquivo .env.production.example e configure as variáveis necessárias."
    exit 1
fi

# Carregar variáveis de ambiente
source .env.production

# Verificar variáveis obrigatórias
required_vars=("POSTGRES_PASSWORD" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Variável $var não está definida no .env.production"
        exit 1
    fi
done

echo "✅ Variáveis de ambiente verificadas!"

# Fazer build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

echo "🐳 Iniciando serviços Docker..."

# Usar docker-compose para Portainer ou desenvolvimento local
if [ "$1" = "--portainer" ]; then
    echo "📦 Usando configuração para Portainer..."
    docker-compose -f docker-compose.portainer.yml up -d
else
    echo "🏠 Usando configuração para desenvolvimento local..."
    docker-compose up -d
fi

echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar se os serviços estão rodando
if docker-compose ps | grep -q "Up"; then
    echo "✅ Serviços iniciados com sucesso!"
    echo "🌐 Aplicação disponível em: $NEXTAUTH_URL"
else
    echo "❌ Erro ao iniciar serviços. Verificando logs..."
    docker-compose logs
    exit 1
fi

echo "🎉 Deploy concluído com sucesso!"

