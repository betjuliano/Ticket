# Gerenciamento Remoto da VPS com Portainer

Guia para conectar e gerenciar os serviços Docker na VPS onde Traefik, Docker e Portainer já estão funcionando.

## 🔗 Conexão com a VPS

### 1. Verificar Status dos Serviços na VPS

```bash
# Conectar via SSH
ssh root@SEU_IP_VPS

# Verificar containers rodando
docker ps

# Verificar redes Docker
docker network ls

# Verificar volumes
docker volume ls
```

### 2. Acessar Portainer Remoto

Se o Portainer já está rodando na VPS:
- **URL**: `https://iadm.iaprojetos.com.br`
- **Dashboard Traefik**: `https://traefik.iadm.iaprojetos.com.br`

## 📦 Deploy da Aplicação na VPS

### Opção 1: Via Portainer Web Interface

1. Acesse o Portainer na VPS
2. Vá em **Stacks** → **Add Stack**
3. Cole o conteúdo do `docker-compose.yml`
4. Configure as variáveis de ambiente
5. Deploy

### Opção 2: Via SSH e Docker Compose

```bash
# Conectar na VPS
ssh root@SEU_IP_VPS

# Navegar para diretório do projeto
cd /root/ticket-system

# Fazer upload dos arquivos (via scp ou git)
scp docker-compose.yml root@SEU_IP_VPS:/root/ticket-system/
scp .env root@SEU_IP_VPS:/root/ticket-system/

# Executar na VPS
docker-compose up -d
```

### Opção 3: Via Script de Deploy Automático

```bash
# No seu computador local
.\deploy-to-vps.ps1 -VpsHost SEU_IP_VPS -VpsUser root
```

## 🔧 Configuração do Docker Compose para VPS

### Arquivo docker-compose.yml Otimizado para VPS

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ticket-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/ticketsystem
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=https://app.iadm.iaprojetos.com.br
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - postgres
      - redis
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`app.iadm.iaprojetos.com.br`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
      - "traefik.http.services.app.loadbalancer.server.port=3000"
    networks:
      - traefik

  postgres:
    image: postgres:15
    container_name: ticket-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=ticketsystem
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres123
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - traefik

  redis:
    image: redis:7-alpine
    container_name: ticket-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - traefik

volumes:
  postgres_data:
  redis_data:

networks:
  traefik:
    external: true
```

## 🌐 Configuração de Rede

### Verificar Rede Traefik Existente

```bash
# Na VPS
docker network ls | grep traefik

# Se não existir, criar
docker network create traefik
```

### Conectar Aplicação à Rede Existente

```bash
# Conectar container à rede do Traefik
docker network connect traefik ticket-app
docker network connect traefik ticket-postgres
docker network connect traefik ticket-redis
```

## 📋 Comandos Úteis para VPS

### Monitoramento

```bash
# Ver todos os containers
docker ps -a

# Ver logs da aplicação
docker logs -f ticket-app

# Ver logs do Traefik
docker logs -f traefik

# Ver uso de recursos
docker stats

# Ver espaço em disco
df -h
docker system df
```

### Manutenção

```bash
# Limpar containers parados
docker container prune

# Limpar imagens não utilizadas
docker image prune

# Limpar volumes não utilizados
docker volume prune

# Backup do banco
docker exec ticket-postgres pg_dump -U postgres ticketsystem > backup.sql

# Restaurar backup
docker exec -i ticket-postgres psql -U postgres ticketsystem < backup.sql
```

### Atualizações

```bash
# Atualizar imagens
docker-compose pull

# Recriar containers com novas imagens
docker-compose up -d --force-recreate

# Reiniciar serviço específico
docker-compose restart app
```

## 🔒 Segurança na VPS

### Configurações Recomendadas

```bash
# Configurar firewall (se não estiver configurado)
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable

# Verificar portas abertas
netstat -tlnp

# Verificar logs de acesso
tail -f /var/log/auth.log
```

### Backup Automático

```bash
# Criar script de backup
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec ticket-postgres pg_dump -U postgres ticketsystem > /root/backups/backup_$DATE.sql
find /root/backups -name "*.sql" -mtime +7 -delete
EOF

# Tornar executável
chmod +x /root/backup.sh

# Adicionar ao crontab (backup diário às 2h)
crontab -e
# Adicionar linha:
0 2 * * * /root/backup.sh
```

## 📞 Troubleshooting

### Problemas Comuns

1. **Aplicação não carrega**
   ```bash
   docker logs ticket-app
   docker exec -it ticket-app sh
   ```

2. **Erro de conexão com banco**
   ```bash
   docker logs ticket-postgres
   docker exec -it ticket-postgres psql -U postgres
   ```

3. **Certificado SSL não funciona**
   ```bash
   docker logs traefik
   # Verificar se domínio aponta para VPS
   nslookup iadm.iaprojetos.com.br
   ```

4. **Erro de rede**
   ```bash
   docker network ls
   docker network inspect traefik
   ```

### Logs Importantes

```bash
# Logs do sistema
tail -f /var/log/syslog

# Logs do Docker
journalctl -u docker.service -f

# Logs específicos da aplicação
docker-compose logs -f
```

---

**Nota**: Certifique-se de que o domínio `iadm.iaprojetos.com.br` está apontando para o IP da sua VPS para que o SSL funcione corretamente.