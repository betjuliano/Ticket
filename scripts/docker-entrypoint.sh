#!/bin/bash
set -e

echo "🚀 Iniciando aplicação Ticket System..."

# Aguardar o banco de dados estar disponível
echo "⏳ Aguardando banco de dados..."
until npx prisma db push --accept-data-loss; do
  echo "Banco de dados não está pronto - aguardando..."
  sleep 2
done

echo "✅ Banco de dados conectado!"

# Executar migrações
echo "🔄 Executando migrações do Prisma..."
npx prisma db push

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

echo "🎉 Aplicação pronta para iniciar!"

# Iniciar aplicação
exec "$@"

