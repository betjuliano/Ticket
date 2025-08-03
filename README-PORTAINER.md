# Portainer com Traefik e SSL Automático

Este guia explica como configurar e executar o Portainer com Traefik para gerenciamento de containers Docker com certificados SSL automáticos.

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Domínio configurado apontando para seu servidor
- Portas 80 e 443 abertas no firewall
- PowerShell (para Windows)

## 🚀 Configuração Rápida

### 1. Configurar Domínio

Certifique-se de que o domínio `iadm.iaprojetos.com.br` está apontando para o IP do seu servidor.

### 2. Executar Script de Inicialização

```powershell
# Usar configurações padrão
.\start-portainer.ps1

# Ou personalizar domínio e email
.\start-portainer.ps1 -Domain "meudominio.com" -Email "admin@meudominio.com"
```

### 3. Acessar Serviços

Após alguns minutos (para geração dos certificados):

- **Portainer**: https://iadm.iaprojetos.com.br
- **Traefik Dashboard**: https://traefik.iadm.iaprojetos.com.br
- **Aplicação**: https://app.iadm.iaprojetos.com.br

## 🔧 Configuração Manual

### 1. Criar Rede Docker

```bash
docker network create traefik
```

### 2. Criar Diretórios

```bash
mkdir traefik letsencrypt
touch letsencrypt/acme.json
chmod 600 letsencrypt/acme.json  # Linux/Mac
```

### 3. Iniciar Serviços

```bash
docker-compose up -d
```

## 📁 Estrutura de Arquivos

```
├── docker-compose.yml          # Configuração principal
├── traefik.yml                 # Configuração do Traefik
├── start-portainer.ps1         # Script de inicialização
├── .env.portainer              # Variáveis de ambiente
├── traefik/                    # Configurações do Traefik
└── letsencrypt/                # Certificados SSL
    └── acme.json              # Armazenamento de certificados
```

## 🔍 Monitoramento

### Verificar Status dos Containers

```bash
docker-compose ps
```

### Ver Logs

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f traefik
docker-compose logs -f portainer
```

### Verificar Certificados

```bash
# Ver certificados gerados
docker-compose exec traefik cat /letsencrypt/acme.json
```

## 🛠️ Comandos Úteis

```bash
# Parar todos os serviços
docker-compose down

# Reiniciar serviços
docker-compose restart

# Atualizar imagens
docker-compose pull
docker-compose up -d

# Remover tudo (cuidado!)
docker-compose down -v
```

## 🔒 Segurança

### Configurações Aplicadas

- ✅ SSL/TLS automático via Let's Encrypt
- ✅ Redirecionamento HTTP → HTTPS
- ✅ Headers de segurança
- ✅ Isolamento de rede Docker

### Recomendações Adicionais

1. **Alterar senhas padrão** no arquivo `.env`
2. **Configurar backup** dos volumes Docker
3. **Monitorar logs** regularmente
4. **Atualizar imagens** periodicamente

## 🐛 Solução de Problemas

### Certificados SSL não funcionam

1. Verificar se o domínio aponta para o servidor
2. Verificar se as portas 80/443 estão abertas
3. Aguardar alguns minutos para propagação DNS
4. Verificar logs do Traefik: `docker-compose logs traefik`

### Portainer não carrega

1. Verificar se o container está rodando: `docker-compose ps`
2. Verificar logs: `docker-compose logs portainer`
3. Verificar conectividade de rede

### Erro de permissão no acme.json

```bash
# Linux/Mac
chmod 600 letsencrypt/acme.json

# Windows (PowerShell como Admin)
icacls letsencrypt\acme.json /inheritance:r /grant:r "$env:USERNAME:F"
```

## 📞 Suporte

Para problemas ou dúvidas:

1. Verificar logs dos containers
2. Consultar documentação oficial do Traefik
3. Verificar configurações de DNS
4. Testar conectividade de rede

## 🔄 Atualizações

Para atualizar os serviços:

```bash
docker-compose pull
docker-compose up -d
```

---

**Nota**: Este setup é otimizado para produção com SSL automático e alta disponibilidade.
