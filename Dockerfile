# Dockerfile multi-stage para Next.js com Prisma
FROM node:20-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat openssl

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Gerar cliente Prisma
RUN npx prisma generate

# Stage de build
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma

# Copiar código fonte
COPY . .

# Instalar dependências de desenvolvimento
RUN npm ci

# Gerar cliente Prisma novamente
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Stage de produção
FROM node:20-alpine AS runner
WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Copiar build da aplicação
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar node_modules com Prisma
COPY --from=builder /app/node_modules ./node_modules

# Definir usuário
USER nextjs

# Expor porta
EXPOSE 3000

# Definir variáveis de ambiente
ENV PORT=3000
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Comando de inicialização
CMD ["node", "server.js"]

