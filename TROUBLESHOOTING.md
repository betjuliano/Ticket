# Guia de Solução de Problemas - Sistema de Tickets

## 🚨 Problemas Comuns e Soluções

### 1. Docker Desktop não está rodando

**Erro:**
```
error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.51/containers/json": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**Solução:**
1. Abra o Docker Desktop
2. Aguarde até que o status mostre "Engine running"
3. Execute novamente: `docker-compose up -d`

### 2. Aplicação não carrega (Erro 502/503)

**Possíveis causas:**
- Containers não estão rodando
- Banco de dados não está conectado
- Variáveis de ambiente incorretas

**Verificações:**
```bash
# Verificar status dos containers
docker-compose ps

# Verificar logs da aplicação
docker-compose logs ticket-app

# Verificar logs do Traefik
docker-compose logs traefik

# Verificar logs do banco
docker-compose logs postgres
```

### 3. Erro de SSL/Certificado

**Sintomas:**
- Certificado inválido
- Conexão não segura

**Solução:**
1. Verificar se o DNS está apontando corretamente
2. Aguardar alguns minutos para o Let's Encrypt gerar o certificado
3. Verificar logs do Traefik: `docker-compose logs traefik`

### 4. Banco de dados não conecta

**Verificações:**
```bash
# Testar conexão com o banco
docker-compose exec postgres psql -U tickets_user -d tickets_db

# Verificar se o banco está rodando
docker-compose logs postgres

# Verificar variáveis de ambiente
cat .env.production | grep DATABASE
```

### 5. Traefik Dashboard não acessível

**Verificar:**
1. DNS para `traefik.iaprojetos.com.br` está configurado
2. Container do Traefik está rodando: `docker-compose ps traefik`
3. Logs do Traefik: `docker-compose logs traefik`

### 6. Erro de autenticação no Traefik Dashboard

**Gerar nova senha:**
```bash
# Gerar hash da senha
echo $(htpasswd -nb admin suasenha) | sed -e s/\$/\$\$/g

# Atualizar no .env.production
TRAEFIK_AUTH=admin:$$2y$$10$$...
```

## 🔧 Comandos Úteis

### Reiniciar todos os serviços
```bash
docker-compose down
docker-compose up -d
```

### Rebuild da aplicação
```bash
docker-compose down
docker-compose build --no-cache ticket-app
docker-compose up -d
```

### Verificar status completo
```bash
docker-compose ps
docker-compose logs --tail=50
```

### Limpar volumes (CUIDADO: apaga dados)
```bash
docker-compose down -v
docker-compose up -d
```

### Executar migrações manualmente
```bash
docker-compose exec ticket-app npm run db:migrate
```

## 📋 Checklist de Deploy

- [ ] Docker Desktop está rodando
- [ ] Arquivo `.env.production` configurado
- [ ] DNS configurado para:
  - [ ] `iadm.iaprojetos.com.br` → IP do servidor
  - [ ] `traefik.iaprojetos.com.br` → IP do servidor
- [ ] Portas 80 e 443 abertas no firewall
- [ ] Containers rodando: `docker-compose ps`
- [ ] Aplicação acessível: https://iadm.iaprojetos.com.br
- [ ] Traefik acessível: https://traefik.iaprojetos.com.br
- [ ] SSL funcionando (certificado válido)

## 🆘 Suporte

Se o problema persistir:
1. Colete os logs: `docker-compose logs > logs.txt`
2. Verifique o status: `docker-compose ps`
3. Documente o erro específico
4. Verifique se todas as configurações de DNS estão corretas

## 📞 Contatos de Emergência

- **Domínio/DNS:** Verificar com provedor de domínio
- **Servidor:** Verificar com provedor de hospedagem
- **Aplicação:** Verificar logs e configurações