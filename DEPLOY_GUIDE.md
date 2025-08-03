# Guia de Deploy em VPS com Portainer e Traefik

Este guia detalha o processo completo de deploy do Ticket System em uma VPS usando Docker, Portainer e Traefik.

## 🎯 Objetivo

Configurar o Ticket System em produção com:

- SSL automático via Let's Encrypt
- Proxy reverso com Traefik
- Gerenciamento via Portainer
- Backup automático
- Monitoramento integrado

## 🖥️ Requisitos da VPS

### Especificações Mínimas

- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Armazenamento**: 50GB SSD
- **Rede**: 100 Mbps
- **OS**: Ubuntu 20.04+ ou CentOS 8+

### Especificações Recomendadas

- **CPU**: 4 vCPUs
- **RAM**: 8GB
- **Armazenamento**: 100GB SSD
- **Rede**: 1 Gbps
- **OS**: Ubuntu 22.04 LTS

## 🔧 Preparação da VPS

### 1. Atualização do Sistema

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. Instalação do Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Reiniciar sessão ou executar:
newgrp docker
```

### 3. Instalação do Docker Compose

```bash
# Versão mais recente
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

### 4. Configuração do Firewall

```bash
# Ubuntu (UFW)
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 9000/tcp  # Portainer
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=9000/tcp
sudo firewall-cmd --reload
```

## 🌐 Configuração do Domínio

### 1. Registros DNS

Configure os seguintes registros DNS:

| Tipo | Nome      | Valor     | TTL |
| ---- | --------- | --------- | --- |
| A    | @         | IP_DA_VPS | 300 |
| A    | www       | IP_DA_VPS | 300 |
| A    | traefik   | IP_DA_VPS | 300 |
| A    | portainer | IP_DA_VPS | 300 |

### 2. Verificação da Propagação

```bash
# Verificar propagação DNS
nslookup seudominio.com
dig seudominio.com

# Testar conectividade
curl -I http://seudominio.com
```

## 🐳 Instalação do Portainer

### 1. Criar Volume para Portainer

```bash
docker volume create portainer_data
```

### 2. Executar Portainer

```bash
docker run -d \
  --name portainer \
  --restart unless-stopped \
  -p 9000:9000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

### 3. Configuração Inicial

1. Acesse `http://IP_DA_VPS:9000`
2. Crie usuário administrador
3. Conecte ao Docker local
4. Configure ambiente

## 📦 Deploy do Ticket System

### Método 1: Via Portainer (Recomendado)

#### 1. Acessar Portainer

- URL: `http://IP_DA_VPS:9000`
- Login com credenciais criadas

#### 2. Criar Stack

1. Vá em **Stacks** → **Add Stack**
2. Nome: `ticket-system`
3. Cole o conteúdo do `docker-compose.yml`

#### 3. Configurar Variáveis de Ambiente

Na seção **Environment variables**, adicione:

```env
DOMAIN=seudominio.com
ACME_EMAIL=admin@seudominio.com
POSTGRES_PASSWORD=sua_senha_postgres_super_segura
REDIS_PASSWORD=sua_senha_redis_super_segura
NEXTAUTH_SECRET=sua_chave_secreta_nextauth_32_caracteres_ou_mais
TRAEFIK_AUTH=admin:$$2y$$10$$hash_da_senha_do_traefik
```

#### 4. Deploy

1. Clique em **Deploy the stack**
2. Aguarde o download das imagens
3. Verifique se todos os containers estão rodando

### Método 2: Via SSH

#### 1. Conectar na VPS

```bash
ssh usuario@IP_DA_VPS
```

#### 2. Clonar Repositório

```bash
git clone https://github.com/betjuliano/Ticket.git
cd Ticket
```

#### 3. Configurar Ambiente

```bash
cp .env.production .env
nano .env  # Editar configurações
```

#### 4. Executar Deploy

```bash
chmod +x deploy.sh
./deploy.sh production
```

## 🔐 Configuração de Segurança

### 1. Gerar Hash de Senha para Traefik

```bash
# Instalar htpasswd
sudo apt install apache2-utils

# Gerar hash (substitua 'suasenha' pela senha desejada)
htpasswd -nb admin suasenha

# Resultado será algo como:
# admin:$2y$10$K8V2VKDKHsOKOcUuLcGOOO...

# Para usar no docker-compose, escape os $ com $$:
# admin:$$2y$$10$$K8V2VKDKHsOKOcUuLcGOOO...
```

### 2. Configurar Chave NextAuth

```bash
# Gerar chave aleatória de 32 caracteres
openssl rand -base64 32
```

### 3. Configurar Senhas Seguras

```bash
# Gerar senhas seguras
openssl rand -base64 24  # Para PostgreSQL
openssl rand -base64 24  # Para Redis
```

## 📊 Verificação do Deploy

### 1. Status dos Containers

```bash
# Via Docker
docker ps

# Via Portainer
# Acesse Containers → Verificar status
```

### 2. Logs dos Serviços

```bash
# Logs da aplicação
docker logs ticket-app

# Logs do Traefik
docker logs ticket-traefik

# Logs do PostgreSQL
docker logs ticket-postgres
```

### 3. Testes de Conectividade

```bash
# Testar aplicação
curl -I https://seudominio.com

# Testar API
curl https://seudominio.com/api/health

# Testar Traefik dashboard
curl -I https://traefik.seudominio.com
```

## 🔄 Configuração de Backup

### 1. Script de Backup Automático

```bash
# Criar diretório de backup
sudo mkdir -p /opt/backups/ticket-system

# Criar script de backup
sudo nano /opt/backups/backup-ticket.sh
```

Conteúdo do script:

```bash
#!/bin/bash

BACKUP_DIR="/opt/backups/ticket-system"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup do banco de dados
docker exec ticket-postgres pg_dump -U ticket_user ticket_db > "$BACKUP_DIR/db_backup_$DATE.sql"

# Backup dos uploads
docker cp ticket-app:/app/uploads "$BACKUP_DIR/uploads_$DATE"

# Compactar backups antigos (manter últimos 7 dias)
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "uploads_*" -mtime +7 -exec rm -rf {} \;

echo "Backup concluído: $DATE"
```

### 2. Configurar Cron

```bash
# Tornar script executável
sudo chmod +x /opt/backups/backup-ticket.sh

# Configurar cron (backup diário às 2h)
sudo crontab -e

# Adicionar linha:
0 2 * * * /opt/backups/backup-ticket.sh >> /var/log/ticket-backup.log 2>&1
```

## 📈 Monitoramento

### 1. Health Checks

```bash
# Verificar saúde da aplicação
curl https://seudominio.com/api/health

# Verificar via Portainer
# Containers → ticket-app → Stats
```

### 2. Logs Centralizados

```bash
# Ver logs em tempo real
docker logs -f ticket-app

# Configurar rotação de logs
sudo nano /etc/docker/daemon.json
```

Conteúdo:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### 3. Alertas (Opcional)

Configure alertas para:

- Uso de CPU > 80%
- Uso de RAM > 90%
- Espaço em disco < 10%
- Containers parados

## 🔧 Manutenção

### 1. Atualizações

```bash
# Atualizar código
cd Ticket
git pull origin main

# Redeploy via Portainer ou:
./deploy.sh production clean
```

### 2. Limpeza do Sistema

```bash
# Remover imagens não utilizadas
docker image prune -a

# Remover volumes órfãos
docker volume prune

# Remover containers parados
docker container prune
```

### 3. Monitoramento de Recursos

```bash
# Uso de recursos
docker stats

# Espaço em disco
df -h

# Uso de memória
free -h

# Processos
htop
```

## 🚨 Solução de Problemas

### Problema: Certificado SSL não funciona

**Solução:**

1. Verificar propagação DNS
2. Verificar portas 80/443 abertas
3. Verificar logs do Traefik
4. Aguardar até 10 minutos para emissão

### Problema: Aplicação não carrega

**Solução:**

1. Verificar logs: `docker logs ticket-app`
2. Verificar conectividade com banco
3. Verificar configurações de ambiente
4. Reiniciar containers

### Problema: Performance lenta

**Solução:**

1. Verificar recursos da VPS
2. Otimizar consultas do banco
3. Configurar cache Redis
4. Aumentar recursos se necessário

### Problema: Backup falha

**Solução:**

1. Verificar permissões do diretório
2. Verificar espaço em disco
3. Verificar conectividade com banco
4. Verificar logs do cron

## 📞 Suporte Pós-Deploy

### Comandos Úteis

```bash
# Status geral
docker ps -a

# Reiniciar aplicação
docker restart ticket-app

# Ver configuração atual
docker-compose config

# Backup manual
./backup-ticket.sh

# Logs detalhados
docker-compose logs -f --tail=100
```

### Checklist de Verificação Semanal

- [ ] Verificar status dos containers
- [ ] Verificar logs de erro
- [ ] Verificar espaço em disco
- [ ] Verificar backups
- [ ] Verificar certificados SSL
- [ ] Verificar performance
- [ ] Verificar atualizações disponíveis

### Contatos de Emergência

- **Suporte VPS**: [Contato do provedor]
- **Suporte DNS**: [Contato do registrar]
- **Desenvolvedor**: [Seu contato]

---

**Este guia garante um deploy seguro e confiável do Ticket System em produção.**
