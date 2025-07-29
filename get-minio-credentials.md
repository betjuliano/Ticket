# Como Obter as Credenciais do MinIO na VPS

Para obter as credenciais corretas do MinIO na sua VPS, siga estes passos:

## 1. Conectar via SSH

```bash
ssh root@207.180.254.250
```

## 2. Verificar se o MinIO está rodando

```bash
# Verificar containers Docker
docker ps | grep minio

# Ou verificar processos
ps aux | grep minio
```

## 3. Localizar as credenciais do MinIO

### Opção A: Verificar variáveis de ambiente
```bash
# Se rodando via Docker
docker inspect <container_id_minio> | grep -A 10 -B 10 "MINIO_ROOT_USER\|MINIO_ACCESS_KEY"

# Ou verificar logs do container
docker logs <container_id_minio> | head -20
```

### Opção B: Verificar arquivos de configuração
```bash
# Procurar por arquivos de configuração
find /etc -name "*minio*" 2>/dev/null
find /opt -name "*minio*" 2>/dev/null
find /var -name "*minio*" 2>/dev/null

# Verificar docker-compose se existir
find / -name "docker-compose*.yml" -exec grep -l "minio" {} \; 2>/dev/null
```

### Opção C: Verificar configuração padrão
```bash
# Credenciais padrão do MinIO (se não foram alteradas)
# MINIO_ROOT_USER=minioadmin
# MINIO_ROOT_PASSWORD=minioadmin
```

## 4. Testar as credenciais encontradas

Após encontrar as credenciais, atualize o arquivo `.env.local`:

```env
MINIO_ACCESS_KEY=credencial_encontrada
MINIO_SECRET_KEY=senha_encontrada
```

## 5. Comandos úteis para diagnóstico

```bash
# Verificar portas abertas
netstat -tlnp | grep :9000
netstat -tlnp | grep :9001

# Verificar se o MinIO responde
curl -I https://s3.iaprojetos.com.br
curl -I https://minio.iaprojetos.com.br

# Verificar logs do sistema
journalctl -u minio --no-pager -n 50
```

## 6. Possíveis localizações das credenciais

- `/etc/default/minio`
- `/etc/minio/minio.conf`
- `~/.minio/config.json`
- `/opt/minio/config`
- Docker Compose files
- Variáveis de ambiente do sistema

## 7. Se não encontrar as credenciais

Se não conseguir encontrar as credenciais, você pode:

1. **Resetar as credenciais** (se tiver acesso root ao MinIO)
2. **Recriar o container** com novas credenciais
3. **Verificar a documentação** da instalação específica

## Exemplo de comando para encontrar credenciais em Docker Compose:

```bash
# Procurar por arquivos docker-compose
find / -name "*compose*.yml" -o -name "*compose*.yaml" 2>/dev/null | xargs grep -l "minio" 2>/dev/null

# Visualizar o conteúdo
cat /caminho/para/docker-compose.yml | grep -A 10 -B 10 "minio"
```