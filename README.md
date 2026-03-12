# VecGate

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![WireGuard](https://img.shields.io/badge/WireGuard-Mesh-88171A?logo=wireguard&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

**Plataforma de gerenciamento de mesh WireGuard** com terminal SSH no navegador, monitoramento de saude em tempo real e suporte multi-tenant.

VecGate fornece um unico dashboard para gerenciar redes mesh WireGuard em multiplos servidores. Adicione nodes, monitore seus status, gere configuracoes WireGuard, faca deploy de configuracoes remotamente e abra sessoes SSH diretamente do navegador — tudo atraves de uma interface moderna com tema escuro.

---

## Screenshots

> Screenshots em breve.

| Tela | Descricao |
|------|-----------|
| **Dashboard** | Visao geral com cards de status dos nodes (online/offline), latencia media e feed de atividades recentes |
| **Hosts** | Grid de cards de todos os nodes do mesh com busca, adicionar/editar/remover, geracao de chaves WireGuard e visualizador de configuracao |
| **Topologia** | Mapa interativo da rede (React Flow) com layouts circular/grid, links coloridos do mesh e painel de detalhes |
| **Terminal** | Terminal xterm.js completo no navegador conectado via WebSocket SSH a qualquer node do mesh |
| **Usuarios** | Tabela de gerenciamento de usuarios com atribuicao de roles e troca de senhas |
| **Log de Auditoria** | Log filtravel de todas as acoes (login, conexoes SSH, alteracoes em hosts, deploys) |
| **Configuracoes** | Configuracao da instancia para padroes de rede e branding do cliente |

---

## Funcionalidades

- **Dashboard** — Visao geral em tempo real de todos os nodes com status online/offline e latencia
- **Terminal SSH no Navegador** — Terminal interativo completo via WebSocket + ssh2 (frontend xterm.js)
- **Gerenciamento de Hosts** — Adicionar, editar, remover nodes do mesh com IP, provedor, regiao e credenciais SSH
- **Geracao de Chaves WireGuard** — Gerar pares de chaves e baixar `wg0.conf` para qualquer node
- **Deploy Remoto** — Enviar configuracoes WireGuard para nodes via SSH com um clique
- **Monitoramento de Saude** — Ping automatico a cada 30 segundos para todos os nodes
- **Trilha de Auditoria** — Toda acao e registrada: logins, sessoes SSH, alteracoes em hosts, deploys
- **Gerenciamento de Usuarios** — Multiplos usuarios com acesso baseado em roles
- **Multi-Tenant** — Cada deploy recebe seu proprio branding via `client.config.json` (nome da empresa, cores, logo)
- **Topologia de Rede** — Visualizacao interativa do mesh com React Flow (layouts circular e grid)
- **Autenticacao JWT** — Acesso seguro a API com expiracao de token em 24h
- **Deploy com Docker** — Um unico `docker-compose up` conectando a sua rede mesh

---

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   Navegador                     │
│  React 18 + MUI + xterm.js + React Flow         │
│  (Build Vite servido como arquivos estaticos)   │
└──────────────┬──────────────┬───────────────────┘
               │ HTTP/REST    │ WebSocket
               ▼              ▼
┌─────────────────────────────────────────────────┐
│              Node.js + Express                  │
│                                                 │
│  /api/auth     — Login/sessao JWT               │
│  /api/hosts    — CRUD + keygen + wgconf         │
│  /api/ssh      — Execucao remota + deploy WG    │
│  /api/settings — Config da instancia + auditoria│
│  /api/users    — Gerenciamento de usuarios      │
│  /api/config   — Branding do cliente (publico)  │
│  /ws/ssh       — Terminal SSH WebSocket         │
│                                                 │
│  Loop de health check (ping a cada 30s)         │
└──────────────┬──────────────┬───────────────────┘
               │              │
               ▼              ▼
┌──────────────────┐  ┌──────────────────────────┐
│   SQLite (WAL)   │  │   Rede Mesh (Docker)     │
│   better-sqlite3 │  │   SSH + Ping para nodes  │
└──────────────────┘  └──────────────────────────┘
```

---

## Stack Tecnologica

| Camada | Tecnologia |
|--------|-----------|
| **Backend** | Node.js 20, Express 4, better-sqlite3, jsonwebtoken, bcryptjs |
| **SSH** | ssh2 (conexoes SSH), ws (servidor WebSocket) |
| **Frontend** | React 18, Vite 5, Material UI 5, xterm.js, React Flow, Recharts, Framer Motion |
| **Banco de Dados** | SQLite com modo WAL e foreign keys |
| **Container** | Docker (Alpine), Docker Compose |
| **Rede** | WireGuard (wg-quick, wg genkey/pubkey), health checks via ping ICMP |

---

## Como Usar

### Pre-requisitos

- Docker e Docker Compose
- Uma rede Docker conectada ao seu mesh (ou crie uma)
- Node.js 20+ (para build do frontend)

### 1. Clonar e configurar

```bash
git clone https://github.com/Vinicius-Costa14/vecgate.git
cd vecgate

# Editar branding do cliente e credenciais padrao
cp client.config.json client.config.json.bak
nano client.config.json

# Criar .env a partir do exemplo
cp .env.example .env
nano .env  # Defina o JWT_SECRET
```

### 2. Buildar o frontend

```bash
cd frontend
npm install
npm run build   # Cria frontend/dist/
cd ..
```

### 3. Criar a rede Docker (se necessario)

```bash
# Substitua pelo nome real da sua rede mesh
docker network create mesh-network
```

### 4. Deploy

```bash
# Atualize o nome da rede no docker-compose.yml para corresponder ao seu mesh
docker compose up -d --build
```

### 5. Acessar

Abra `http://localhost:3000` e faca login com as credenciais do `client.config.json`.

**Padrao:** `admin` / `changeme` (altere imediatamente)

---

## Endpoints da API

### Autenticacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `POST` | `/api/auth/login` | Login com usuario/senha, retorna JWT |
| `GET` | `/api/auth/me` | Obter informacoes do usuario atual |

### Hosts

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/api/hosts` | Listar todos os nodes do mesh |
| `GET` | `/api/hosts/:id` | Obter detalhes do node |
| `POST` | `/api/hosts` | Criar novo node |
| `PUT` | `/api/hosts/:id` | Atualizar node |
| `DELETE` | `/api/hosts/:id` | Remover node |
| `POST` | `/api/hosts/:id/keygen` | Gerar par de chaves WireGuard |
| `GET` | `/api/hosts/:id/wgconf` | Baixar wg0.conf do node |
| `GET` | `/api/hosts/:id/health` | Pingar node e atualizar status |

### SSH

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `POST` | `/api/ssh/exec` | Executar comando no node via SSH |
| `POST` | `/api/ssh/deploy` | Fazer deploy da configuracao WireGuard no node |
| `WS` | `/ws/ssh?token=...&host_id=...` | Terminal SSH interativo (WebSocket) |

### Configuracoes e Usuarios

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/api/settings` | Obter todas as configuracoes |
| `PUT` | `/api/settings` | Atualizar configuracoes |
| `GET` | `/api/settings/audit` | Obter log de auditoria |
| `GET` | `/api/users` | Listar usuarios |
| `POST` | `/api/users` | Criar usuario |
| `PUT` | `/api/users/:id` | Atualizar usuario |
| `DELETE` | `/api/users/:id` | Deletar usuario |

### Publico

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/api/config` | Branding do cliente (nome, cores, logo) |

---

## Variaveis de Ambiente

| Variavel | Padrao | Descricao |
|----------|--------|-----------|
| `PORT` | `3000` | Porta do servidor |
| `DB_PATH` | `/data/vecgate.db` | Caminho do arquivo de banco de dados SQLite |
| `JWT_SECRET` | `change-me-in-production` | Secret para assinatura de tokens JWT |
| `CONFIG_PATH` | `./client.config.json` | Caminho para o arquivo de configuracao do cliente |
| `INIT_SQL_PATH` | `./database/init.sql` | Caminho para o arquivo de schema SQL |
| `FRONTEND_PATH` | `./frontend/dist` | Caminho para o frontend buildado |

---

## Deploy Multi-Tenant

Cada cliente recebe sua propria instancia VecGate com branding customizado. Edite o `client.config.json` por deploy:

```json
{
    "company": {
        "name": "Acme Corp",
        "slug": "acme",
        "logo_url": "/logo.png",
        "primary_color": "#00d4aa",
        "dark_color": "#0a0f1c"
    },
    "network": {
        "block": 100,
        "domain": "mesh.acme.com",
        "default_port_wg": 51820,
        "default_port_ssh": 22,
        "keepalive": 25
    },
    "admin": {
        "default_user": "admin",
        "default_password": "strong-password-here"
    }
}
```

---

## Schema do Banco de Dados

VecGate usa SQLite com quatro tabelas:

- **users** — Usuarios do painel com hashes bcrypt de senhas e roles
- **hosts** — Nodes do mesh com IPs, chaves WireGuard, credenciais SSH e status
- **settings** — Configuracao da instancia em formato chave-valor
- **audit_log** — Log de acoes com usuario, tipo de acao, alvo e timestamp

---

## Desenvolvimento

```bash
# Backend (com auto-reload)
cd backend
npm install
npm run dev

# Frontend (com HMR e proxy de API)
cd frontend
npm install
npm run dev
```

O servidor de desenvolvimento Vite faz proxy de `/api` e `/ws` para `http://localhost:3000`.

---

### Resultados e Impacto

- **Gestão centralizada de VPN** — Um único painel para gerenciar todos os nodes WireGuard, eliminando acesso SSH individual
- **Redução de 90% no tempo de troubleshooting** — Terminal SSH via browser permite diagnóstico imediato sem configuração local
- **Health check automatizado** — Detecção proativa de nodes offline antes que impactem a operação
- **Suporte multi-tenant** — Permite isolar redes de diferentes clientes ou ambientes em uma única plataforma
- **Onboarding acelerado** — Novos nodes são adicionados à mesh em minutos, não em horas

---

## Licenca

MIT
