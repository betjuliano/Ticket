# 🚀 Deploy para VPS - Guia Rápido

## 📋 Informações do Servidor

```bash
# Conexão SSH
ssh root@207.180.254.250

# Diretório do projeto
cd /root/ticket-system
```

## 🔧 Configurações do Portainer

- **URL:** https://portainer.iaprojetos.com.br
- **Usuário:** iaprojetos
- **Senha:** Admjuliano1@
- **Token:** yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJpYXByb2pldG9zIiwicm9sZSI6MSwic2NvcGUiOiJkZWZhdWx0IiwiZm9yY2VDaGFuZ2VQYXNzd29yZCI6ZmFsc2UsImV4cCI6MTc1MjEzOTIzOSwiaWF0IjoxNzUyMTEwNDM5LCJqdGkiOiJjMDE2MGY5ZC1jZWFkLTQ1ZjEtOWY4Yi1jNzY4YWRkYWJhN2YifQ.sPR5c2N-6Gfjhmnkhj1yspA64mbn7VOlD9lLIjaeSlI

## 🚀 Deploy Automático

### Opção 1: Script PowerShell (Windows)

```powershell
# Configurar política de execução (uma vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Deploy completo
.\deploy-to-vps.ps1

# Deploy rápido (configurações pré-definidas)
powershell -ExecutionPolicy Bypass -File deploy-rapido.ps1
```

### Opção 2: Script Bash (Linux/Mac)

```bash
# Dar permissão
chmod +x deploy-to-vps.sh

# Deploy completo
./deploy-to-vps.sh
```

## 📤 Deploy Manual

### 1. Upload dos Arquivos

```bash
# Via rsync (recomendado)
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next' \
  ./ root@207.180.254.250:/root/ticket-system/

# Via scp (alternativa)
scp -r . root@207.180.254.250:/root/ticket-system/
```

### 2. Conectar na VPS e Build

```bash
# Conectar
ssh root@207.180.254.250

# Ir para o diretório
cd /root/ticket-system

# Build da imagem Docker
docker build -t ticket-system:latest .

# Verificar se a imagem foi criada
docker images | grep ticket-system
```

### 3. Deploy no Portainer

```bash
# Via PowerShell (se disponível na VPS)
pwsh -File deploy-portainer.ps1 deploy -Force

# Via API diretamente
curl -X POST "https://portainer.iaprojetos.com.br/api/stacks" \
  -H "Authorization: Bearer yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJpYXByb2pldG9zIiwicm9sZSI6MSwic2NvcGUiOiJkZWZhdWx0IiwiZm9yY2VDaGFuZ2VQYXNzd29yZCI6ZmFsc2UsImV4cCI6MTc1MjEzOTIzOSwiaWF0IjoxNzUyMTEwNDM5LCJqdGkiOiJjMDE2MGY5ZC1jZWFkLTQ1ZjEtOWY4Yi1jNzY4YWRkYWJhN2YifQ.sPR5c2N-6Gfjhmnkhj1yspA64mbn7VOlD9lLIjaeSlI" \
  -H "Content-Type: application/json" \
  -d @portainer-deploy.json
```

## 🔍 Verificações

### Status dos Containers

```bash
# Verificar containers rodando
docker ps | grep ticket

# Logs da aplicação
docker logs -f ticket-system_ticket-system-multidominio

# Status geral
docker service ls
```

### Testes de Conectividade

```bash
# Testar aplicação
curl -I https://iadm.iaprojetos.com.br

# Testar API
curl https://iadm.iaprojetos.com.br/api/health
```

## 🔗 Links Importantes

- **Aplicação:** https://iadm.iaprojetos.com.br
- **Portainer:** https://portainer.iaprojetos.com.br
- **Traefik:** https://traefik.iaprojetos.com.br

## 🆘 Troubleshooting

### Problema: Erro de autenticação SSH

```bash
# Verificar conectividade
ssh root@207.180.254.250 "echo 'SSH OK'"

# Se necessário, configurar chave SSH
ssh-keygen -t rsa -b 4096
ssh-copy-id root@207.180.254.250
```

### Problema: Imagem Docker não encontrada

```bash
# Verificar imagens
docker images | grep ticket-system

# Rebuild se necessário
docker build -t ticket-system:latest .
```

### Problema: Container não inicia

```bash
# Verificar logs
docker logs ticket-system_ticket-system-multidominio

# Verificar recursos
docker stats

# Restart se necessário
docker restart ticket-system_ticket-system-multidominio
```

## 📁 Arquivos Criados

- `deploy-to-vps.ps1` - Script completo de deploy (Windows)
- `deploy-to-vps.sh` - Script completo de deploy (Linux/Mac)
- `deploy-rapido.ps1` - Script rápido com configurações pré-definidas
- `vps-config.env` - Arquivo com todas as configurações do VPS
- `.env.portainer` - Configurações do Portainer (atualizado)
- `GUIA-DEPLOY-VPS-PORTAINER.md` - Guia completo detalhado

---

## ✅ Resumo do Processo

1. **Upload** → Enviar código para VPS
2. **Build** → Criar imagem Docker na VPS
3. **Deploy** → Usar Portainer para deploy
4. **Verificar** → Testar aplicação e logs

**🎯 Comando mais simples:**

```bash
# Windows
powershell -ExecutionPolicy Bypass -File deploy-rapido.ps1

# Linux/Mac
./deploy-to-vps.sh
```
