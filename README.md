# Ticket System - Sistema de Gerenciamento de Chamados

![Version](https://img.shields.io/badge/version-2.1.7-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![Traefik](https://img.shields.io/badge/traefik-configured-orange.svg)

Sistema completo de gerenciamento de chamados (tickets) com interface cyberpunk, pronto para produção com Docker, Traefik e certificação SSL automática.

## 🚀 Características

### Funcionalidades Principais
- **Dashboard Interativo**: Visão geral completa do sistema
- **Gerenciamento de Tickets**: Criação, edição, atribuição e acompanhamento
- **Sistema de Usuários**: Controle de acesso com diferentes níveis (Usuário, Coordenador, Admin)
- **Base de Conhecimento**: Documentação e soluções
- **Interface Responsiva**: Funciona perfeitamente em desktop e mobile
- **Tema Cyberpunk**: Design moderno e atrativo

### Tecnologias Utilizadas
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL, Redis
- **Containerização**: Docker, Docker Compose
- **Proxy Reverso**: Traefik com SSL automático
- **Componentes UI**: Radix UI, Shadcn/ui
- **Validação**: Zod
- **Ícones**: Lucide React

### Arquitetura de Produção
- **Escalabilidade**: Configuração preparada para múltiplas instâncias
- **Segurança**: Headers de segurança, rate limiting, validação robusta
- **Monitoramento**: Health checks, logs estruturados
- **Backup**: Scripts automatizados de backup
- **SSL/TLS**: Certificados automáticos via Let's Encrypt

## 📋 Pré-requisitos

### Para Desenvolvimento
- Node.js 20+
- Docker e Docker Compose
- Git

### Para Produção
- VPS com Docker e Docker Compose
- Domínio configurado
- Portainer (opcional, mas recomendado)

## 🛠️ Instalação

### 1. Clone o Repositório
```bash
git clone https://github.com/betjuliano/Ticket.git
cd Ticket
```

### 2. Configuração de Ambiente

#### Para Desenvolvimento
```bash
cp .env.development .env
```

#### Para Produção
```bash
cp .env.production .env
# Edite o arquivo .env com suas configurações
nano .env
```

**⚠️ IMPORTANTE**: Altere todas as senhas padrão no arquivo `.env` antes de usar em produção!

### 3. Deploy Automático

#### Desenvolvimento
```bash
./deploy.sh development
```

#### Produção
```bash
./deploy.sh production
```

### 4. Deploy Manual (Alternativo)

```bash
# Iniciar serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

## 🔧 Configuração

### Variáveis de Ambiente Principais

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DOMAIN` | Domínio da aplicação | `ticket.seudominio.com` |
| `ACME_EMAIL` | Email para Let's Encrypt | `admin@seudominio.com` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | `senha_super_segura` |
| `REDIS_PASSWORD` | Senha do Redis | `senha_redis_segura` |
| `NEXTAUTH_SECRET` | Chave secreta NextAuth | `chave_32_caracteres_ou_mais` |

### Configuração do Domínio

1. Configure seu domínio para apontar para o IP da VPS
2. Certifique-se de que as portas 80 e 443 estão abertas
3. Aguarde a propagação DNS (pode levar até 24h)

### Configuração do Email (Opcional)

Para notificações por email, configure as variáveis SMTP:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

## 🐳 Docker e Portainer

### Usando com Portainer

1. Acesse seu Portainer
2. Vá em "Stacks" → "Add Stack"
3. Cole o conteúdo do `docker-compose.yml`
4. Configure as variáveis de ambiente
5. Deploy

### Comandos Docker Úteis

```bash
# Ver logs da aplicação
docker-compose logs -f ticket-app

# Reiniciar apenas a aplicação
docker-compose restart ticket-app

# Backup do banco de dados
docker exec ticket-postgres pg_dump -U ticket_user ticket_db > backup.sql

# Restaurar backup
docker exec -i ticket-postgres psql -U ticket_user ticket_db < backup.sql

# Acessar container da aplicação
docker exec -it ticket-app sh

# Ver uso de recursos
docker stats
```

## 🔐 Segurança

### Configurações Implementadas
- Headers de segurança (HSTS, CSP, etc.)
- Rate limiting
- Validação de entrada com Zod
- Sanitização de dados
- Autenticação robusta
- Criptografia de senhas

### Recomendações Adicionais
1. **Altere todas as senhas padrão**
2. **Configure firewall na VPS**
3. **Mantenha o sistema atualizado**
4. **Configure backups automáticos**
5. **Monitore logs regularmente**

## 📊 Monitoramento

### Health Checks
- Endpoint: `/api/health`
- Verifica status da aplicação, memória e uptime
- Integrado com Docker health checks

### Logs
- Logs estruturados em JSON
- Diferentes níveis (debug, info, warn, error)
- Rotação automática de logs

### Métricas
- Uptime do sistema
- Número de tickets ativos
- Usuários conectados
- Performance da aplicação

## 🔄 Backup e Restauração

### Backup Automático
O script de deploy cria backups automáticos em produção:
```bash
./deploy.sh production
```

### Backup Manual
```bash
# Backup completo
mkdir -p backups
docker exec ticket-postgres pg_dump -U ticket_user ticket_db > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Backup dos uploads
docker cp ticket-app:/app/uploads backups/uploads_$(date +%Y%m%d_%H%M%S)
```

### Restauração
```bash
# Restaurar banco de dados
docker exec -i ticket-postgres psql -U ticket_user ticket_db < backups/backup_YYYYMMDD_HHMMSS.sql

# Restaurar uploads
docker cp backups/uploads_YYYYMMDD_HHMMSS ticket-app:/app/uploads
```

## 🌐 URLs de Acesso

### Produção
- **Aplicação**: `https://seudominio.com`
- **Dashboard Traefik**: `https://traefik.seudominio.com`

### Desenvolvimento
- **Aplicação**: `http://localhost`
- **Dashboard Traefik**: `http://localhost:8080`

## 👥 Usuários Padrão

O sistema cria usuários padrão para teste:

| Email | Senha | Tipo |
|-------|-------|------|
| `admin@ticket.local` | `admin123` | Administrador |
| `coordenador@ticket.local` | `coord123` | Coordenador |
| `usuario@ticket.local` | `user123` | Usuário |

**⚠️ ALTERE ESSAS SENHAS IMEDIATAMENTE EM PRODUÇÃO!**

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
Ticket/
├── app/                    # Aplicação Next.js
│   ├── api/               # API Routes
│   ├── dashboard/         # Páginas do dashboard
│   ├── tickets/           # Gerenciamento de tickets
│   └── ...
├── components/            # Componentes React
├── lib/                   # Utilitários e validações
├── public/               # Arquivos estáticos
├── docker-compose.yml    # Configuração Docker
├── Dockerfile           # Imagem da aplicação
├── deploy.sh           # Script de deploy
└── init-db.sql        # Inicialização do banco
```

### Comandos de Desenvolvimento
```bash
# Instalar dependências
pnpm install

# Executar em modo desenvolvimento
pnpm dev

# Build da aplicação
pnpm build

# Executar testes
pnpm test

# Lint do código
pnpm lint
```

## 🚀 Deploy em Produção

### Checklist Pré-Deploy
- [ ] Domínio configurado e propagado
- [ ] Portas 80 e 443 abertas
- [ ] Docker e Docker Compose instalados
- [ ] Arquivo `.env` configurado
- [ ] Senhas padrão alteradas
- [ ] Backup dos dados existentes (se houver)

### Processo de Deploy
1. **Preparação**:
   ```bash
   git clone https://github.com/betjuliano/Ticket.git
   cd Ticket
   cp .env.production .env
   nano .env  # Configurar variáveis
   ```

2. **Deploy**:
   ```bash
   ./deploy.sh production
   ```

3. **Verificação**:
   - Acesse a aplicação no navegador
   - Verifique o dashboard do Traefik
   - Teste login com usuários padrão
   - Verifique certificado SSL

### Atualizações
```bash
# Atualizar código
git pull origin main

# Redeploy
./deploy.sh production clean
```

## 🐛 Solução de Problemas

### Problemas Comuns

#### Aplicação não inicia
```bash
# Verificar logs
docker-compose logs -f ticket-app

# Verificar configurações
docker-compose config
```

#### Certificado SSL não funciona
- Verifique se o domínio está propagado
- Confirme que as portas 80 e 443 estão abertas
- Verifique logs do Traefik: `docker-compose logs traefik`

#### Banco de dados não conecta
```bash
# Verificar status do PostgreSQL
docker-compose ps postgres

# Verificar logs
docker-compose logs postgres

# Testar conexão
docker exec -it ticket-postgres psql -U ticket_user ticket_db
```

#### Performance lenta
- Verifique uso de recursos: `docker stats`
- Analise logs da aplicação
- Considere aumentar recursos da VPS

### Logs Importantes
```bash
# Logs da aplicação
docker-compose logs -f ticket-app

# Logs do Traefik
docker-compose logs -f traefik

# Logs do banco de dados
docker-compose logs -f postgres

# Todos os logs
docker-compose logs -f
```

## 📞 Suporte

### Documentação Adicional
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)

### Contribuição
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🎯 Roadmap

### Próximas Funcionalidades
- [ ] Notificações em tempo real
- [ ] Integração com Slack/Teams
- [ ] Relatórios avançados
- [ ] API REST completa
- [ ] Mobile app
- [ ] Integração com LDAP/AD

### Melhorias Planejadas
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Monitoramento com Prometheus
- [ ] Logs centralizados com ELK
- [ ] Backup automático para cloud

---

**Desenvolvido com ❤️ para facilitar o gerenciamento de chamados de TI**

