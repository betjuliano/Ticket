# 🎫 Ticket System - Sistema de Gerenciamento de Chamados

Sistema completo de gerenciamento de tickets/chamados desenvolvido com Next.js 15, React 19, TypeScript e PostgreSQL.

## 🚀 Características

- **Frontend Moderno**: Next.js 15 + React 19 + TypeScript
- **UI/UX**: Tailwind CSS + Radix UI + Shadcn/ui
- **Backend**: API Routes do Next.js + Prisma ORM
- **Banco de Dados**: PostgreSQL
- **Autenticação**: NextAuth.js com JWT
- **Containerização**: Docker + Docker Compose
- **Deploy**: Pronto para Portainer + Traefik

## 📋 Funcionalidades

### ✅ Implementadas

- Sistema de autenticação completo (login/cadastro)
- Dashboard com métricas em tempo real
- Gerenciamento de tickets/chamados
- Sistema de usuários e permissões
- Interface responsiva e moderna
- API RESTful completa
- Containerização Docker

### 🔄 Em Desenvolvimento

- Sistema de comentários em tickets
- Upload de anexos
- Notificações em tempo real
- Relatórios avançados
- Knowledge Base

## 🛠️ Tecnologias Utilizadas

### Frontend

- **Next.js 15**: Framework React com SSR/SSG
- **React 19**: Biblioteca de interface
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Framework CSS utilitário
- **Radix UI**: Componentes acessíveis
- **Shadcn/ui**: Sistema de design

### Backend

- **Next.js API Routes**: Endpoints da API
- **Prisma ORM**: Mapeamento objeto-relacional
- **PostgreSQL**: Banco de dados relacional
- **NextAuth.js**: Autenticação
- **bcryptjs**: Hash de senhas
- **Zod**: Validação de schemas

### DevOps

- **Docker**: Containerização
- **Docker Compose**: Orquestração de containers
- **Traefik**: Proxy reverso e SSL
- **Portainer**: Gerenciamento de containers

## 🏗️ Arquitetura

```
ticket-system/
├── app/                    # App Router do Next.js
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticação
│   ├── tickets/           # Páginas de tickets
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── ui/               # Componentes base (Shadcn)
│   └── ...               # Componentes específicos
├── lib/                   # Utilitários e configurações
│   ├── auth.ts           # Configuração NextAuth
│   ├── prisma.ts         # Cliente Prisma
│   └── validations.ts    # Schemas Zod
├── prisma/               # Schema e migrações
├── scripts/              # Scripts de automação
├── types/                # Definições TypeScript
└── docker-compose.yml    # Configuração Docker
```

## 🚀 Execução Local

### Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- npm ou yarn

### 1. Clonar o Repositório

```bash
git clone https://github.com/betjuliano/Ticket.git
cd Ticket
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Banco de Dados

```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configurar usuário e banco
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres createdb ticket_system
```

### 4. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ticket_system"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 5. Executar Migrações

```bash
npx prisma generate
npx prisma db push
```

### 6. Criar Usuário Administrador

```bash
node seed-user.js
```

### 7. Iniciar Aplicação

```bash
npm run dev
```

A aplicação estará disponível em: http://localhost:3000

**Credenciais de teste:**

- Email: `admin@ticket.local`
- Senha: `admin123`

## 🐳 Deploy com Docker

### Desenvolvimento Local

```bash
# Build e iniciar todos os serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

### Produção com Portainer

#### 1. Preparar Ambiente

```bash
# Fazer build da aplicação
./scripts/build.sh

# Configurar variáveis de ambiente
cp .env.production .env.production.local
# Editar .env.production.local com suas configurações
```

#### 2. Deploy no Portainer

1. Acesse seu Portainer
2. Vá em **Stacks** → **Add Stack**
3. Nome: `ticket-system`
4. Copie o conteúdo de `docker-compose.portainer.yml`
5. Configure as variáveis de ambiente:
   - `POSTGRES_PASSWORD`: Senha do PostgreSQL
   - `NEXTAUTH_SECRET`: Chave secreta para JWT
   - `NEXTAUTH_URL`: URL da aplicação
   - `DOMAIN`: Domínio para Traefik
   - `APP_PORT`: Porta da aplicação (padrão: 3000)

#### 3. Configurar Traefik (se necessário)

```yaml
# traefik.yml
entryPoints:
  web:
    address: ':80'
  websecure:
    address: ':443'

certificatesResolvers:
  letsencrypt:
    acme:
      email: seu-email@exemplo.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

## 📊 Monitoramento

### Logs da Aplicação

```bash
# Docker Compose
docker-compose logs -f app

# Portainer
# Acesse Containers → ticket-app → Logs
```

### Métricas do Banco

```bash
# Conectar ao PostgreSQL
docker exec -it ticket-postgres psql -U postgres -d ticket_system

# Verificar tabelas
\dt

# Verificar usuários
SELECT id, name, email, role FROM "User";
```

## 🔧 Manutenção

### Backup do Banco de Dados

```bash
# Criar backup
docker exec ticket-postgres pg_dump -U postgres ticket_system > backup.sql

# Restaurar backup
docker exec -i ticket-postgres psql -U postgres ticket_system < backup.sql
```

### Atualização da Aplicação

```bash
# Parar serviços
docker-compose down

# Atualizar código
git pull origin main

# Rebuild e reiniciar
docker-compose up -d --build
```

## 🐛 Solução de Problemas

### Erro de Conexão com Banco

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps

# Verificar logs do banco
docker-compose logs postgres

# Testar conexão
docker exec ticket-postgres pg_isready -U postgres
```

### Erro de Autenticação

```bash
# Verificar variáveis de ambiente
docker exec ticket-app env | grep NEXTAUTH

# Regenerar secret
openssl rand -base64 32
```

### Erro de Build

```bash
# Limpar cache do Docker
docker system prune -a

# Rebuild sem cache
docker-compose build --no-cache
```

## 📝 Changelog

### v1.0.0 (Atual)

- ✅ Sistema de autenticação completo
- ✅ Dashboard com métricas
- ✅ CRUD de tickets
- ✅ Sistema de usuários
- ✅ Containerização Docker
- ✅ Deploy para Portainer

### Próximas Versões

- 🔄 Sistema de comentários
- 🔄 Upload de arquivos
- 🔄 Notificações push
- 🔄 Relatórios PDF
- 🔄 API mobile

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Juliano Alves**

- GitHub: [@betjuliano](https://github.com/betjuliano)
- Email: juliano@exemplo.com

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/)
- [Prisma](https://prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://radix-ui.com/)
- [Shadcn/ui](https://ui.shadcn.com/)

---

**🎯 Sistema pronto para produção com Docker + Portainer + Traefik!**
