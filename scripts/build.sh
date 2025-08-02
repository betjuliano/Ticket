#!/bin/bash
set -e

echo "🏗️  Iniciando build do Ticket System..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se docker-compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Build da imagem
echo "🔨 Fazendo build da imagem Docker..."
docker build -t ticket-system:latest .

echo "✅ Build concluído com sucesso!"

# Opcional: fazer push para registry
if [ "$1" = "--push" ]; then
    if [ -z "$DOCKER_REGISTRY" ]; then
        echo "⚠️  DOCKER_REGISTRY não definido. Definindo como localhost:5000"
        DOCKER_REGISTRY="localhost:5000"
    fi
    
    echo "📤 Fazendo push para $DOCKER_REGISTRY..."
    docker tag ticket-system:latest $DOCKER_REGISTRY/ticket-system:latest
    docker push $DOCKER_REGISTRY/ticket-system:latest
    echo "✅ Push concluído!"
fi

echo "🎉 Processo concluído! Use 'docker-compose up -d' para iniciar os serviços."

