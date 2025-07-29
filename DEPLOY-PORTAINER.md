# 🚀 Deploy do Sistema de Tickets no Portainer

## 📋 Informações do Ambiente

### Credenciais do Portainer
- **URL:** https://portainer.iaprojetos.com.br
- **Usuário:** iaprojetos
- **Senha:** Admjuliano1@
- **Token:** yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJpYXByb2pldG9zIiwicm9sZSI6MSwic2NvcGUiOiJkZWZhdWx0IiwiZm9yY2VDaGFuZ2VQYXNzd29yZCI6ZmFsc2UsImV4cCI6MTc1MjEzOTIzOSwiaWF0IjoxNzUyMTEwNDM5LCJqdGkiOiJjMDE2MGY5ZC1jZWFkLTQ1ZjEtOWY4Yi1jNzY4YWRkYWJhN2YifQ.sPR5c2N-6Gfjhmnkhj1yspA64mbn7VOlD9lLIjaeSlI

### Informações do Swarm
- **Swarm ID:** eg6ahp92i130xiavjv7unmrjg
- **Rede:** iaprojetos
- **Traefik Service ID:** y1worprtlx36uc3lu089zk9u0

## 🎯 Domínios Configurados

- **Aplicação Principal:** https://iadm.iaprojetos.com.br
- **Domínio Alternativo:** https://tickets.iaprojetos.com.br
- **Traefik Dashboard:** https://traefik.iaprojetos.com.br
- **Portainer:** https://portainer.iaprojetos.com.br

## 📦 Pré-requisitos

### 1. Verificar Infraestrutura
- [ ] Traefik está rodando no Swarm
- [ ] Rede `iaprojetos` existe e está ativa
- [ ] DNS configurado para os domínios
- [ ] Certificados SSL funcionando

### 2. Preparar Imagem Docker
```bash
# Build da imagem
docker build -t ticket-system:latest .

# Tag para registry (se necessário)
docker tag ticket-system:latest your-registry/ticket-system:latest

# Push para registry
docker push your-registry/ticket-system:latest
```

## 🚀 Deploy via Portainer

### Método 1: Interface Web do Portainer

1. **Acesse o Portainer:**
   - URL: https://portainer.iaprojetos.com.br
   - Login: iaprojetos / Admjuliano1@

2. **Navegue para Stacks:**
   - Sidebar → Stacks → Add Stack

3. **Configure o Stack:**
   - **Name:** ticket-system
   - **Build method:** Web editor
   - Cole o conteúdo do `docker-compose.portainer.yml`

4. **Configure Variáveis de Ambiente:**
   - Clique em "Advanced mode"
   - Cole o conteúdo do `.env.portainer`
   - Ajuste senhas e secrets conforme necessário

5. **Deploy:**
   - Clique em "Deploy the stack"
   - Aguarde a criação dos serviços

### Método 2: API do Portainer

```bash
# Definir variáveis
PORTAINER_URL="https://portainer.iaprojetos.com.br"
TOKEN="yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJpYXByb2pldG9zIiwicm9sZSI6MSwic2NvcGUiOiJkZWZhdWx0IiwiZm9yY2VDaGFuZ2VQYXNzd29yZCI6ZmFsc2UsImV4cCI6MTc1MjEzOTIzOSwiaWF0IjoxNzUyMTEwNDM5LCJqdGkiOiJjMDE2MGY5ZC1jZWFkLTQ1ZjEtOWY4Yi1jNzY4YWRkYWJhN2YifQ.sPR5c2N-6Gfjhmnkhj1yspA64mbn7VOlD9lLIjaeSlI"
SWARM_ID="eg6ahp92i130xiavjv7unmrjg"

# Criar stack via API
curl -X POST "$PORTAINER_URL/api/stacks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ticket-system",
    "swarmId": "'$SWARM_ID'",
    "stackFileContent": "'$(cat docker-compose.portainer.yml | sed 's/"/\\"/g' | tr '\n' ' ')'",
    "env": [
      {"name": "POSTGRES_PASSWORD", "value": "tickets123"},
      {"name": "REDIS_PASSWORD", "value": "redis123"},
      {"name": "NEXTAUTH_SECRET", "value": "your-super-secret-key"}
    ]
  }'
```

## 🔧 Configurações Importantes

### 1. Variáveis de Ambiente Críticas
```env
# Banco de dados
DATABASE_URL=postgresql://tickets_user:tickets123@postgres:5432/tickets_db
POSTGRES_PASSWORD=tickets123

# Redis
REDIS_URL=redis://:redis123@redis:6379
REDIS_PASSWORD=redis123

# NextAuth (GERAR NOVO!)
NEXTAUTH_SECRET=your-super-secret-key-change-in-production

# SMTP
SMTP_USER=admjulianoo@gmail.com
SMTP_PASS=your-gmail-app-password
```

### 2. Recursos e Limites
- **Aplicação:** 512MB RAM (limite) / 256MB (reserva)
- **PostgreSQL:** 256MB RAM (limite) / 128MB (reserva)
- **Redis:** 128MB RAM (limite) / 64MB (reserva)

## 📊 Monitoramento

### 1. Verificar Status dos Serviços
```bash
# Via Portainer API
curl -H "Authorization: Bearer $TOKEN" \
  "$PORTAINER_URL/api/endpoints/$SWARM_ID/docker/services"

# Via Docker CLI (no servidor)
docker service ls
docker service ps ticket-system_ticket-system-multidominio
```

### 2. Logs dos Serviços
- **Portainer:** Services → ticket-system → Logs
- **CLI:** `docker service logs ticket-system_ticket-system-multidominio`

### 3. Health Checks
- **Aplicação:** https://iadm.iaprojetos.com.br/api/health
- **Traefik:** https://traefik.iaprojetos.com.br

## 🔄 Atualizações

### 1. Atualizar Imagem
```bash
# Build nova versão
docker build -t ticket-system:v1.1.0 .

# Update via Portainer
# Services → ticket-system → Update → Change image tag
```

### 2. Atualizar Configurações
- Portainer → Stacks → ticket-system → Editor
- Modificar docker-compose ou variáveis
- Clique em "Update the stack"

## 🛠️ Troubleshooting

### 1. Serviço não inicia
```bash
# Verificar logs
docker service logs ticket-system_ticket-system-multidominio --tail 50

# Verificar constraints
docker service inspect ticket-system_ticket-system-multidominio
```

### 2. Problemas de Rede
```bash
# Verificar rede
docker network ls | grep iaprojetos
docker network inspect iaprojetos

# Testar conectividade
docker run --rm --network iaprojetos alpine ping postgres
```

### 3. Problemas SSL/Traefik
- Verificar se domínios estão no DNS
- Verificar logs do Traefik
- Verificar labels do serviço

## 📞 Suporte

### Comandos Úteis
```bash
# Status geral
docker service ls
docker stack ps ticket-system

# Logs específicos
docker service logs ticket-system_postgres
docker service logs ticket-system_redis

# Restart serviço
docker service update --force ticket-system_ticket-system-multidominio

# Remover stack
docker stack rm ticket-system
```

### Contatos
- **Portainer:** https://portainer.iaprojetos.com.br
- **Traefik:** https://traefik.iaprojetos.com.br
- **Aplicação:** https://iadm.iaprojetos.com.br

---

## ✅ Checklist de Deploy

- [ ] Traefik rodando e acessível
- [ ] Rede `iaprojetos` criada
- [ ] DNS configurado para domínios
- [ ] Imagem Docker buildada e disponível
- [ ] Variáveis de ambiente configuradas
- [ ] Stack deployado no Portainer
- [ ] Serviços rodando (3/3)
- [ ] Aplicação acessível via HTTPS
- [ ] SSL funcionando
- [ ] Banco de dados conectado
- [ ] Redis funcionando
- [ ] Logs sem erros críticos