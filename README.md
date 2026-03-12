# VecGate

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![WireGuard](https://img.shields.io/badge/WireGuard-Mesh-88171A?logo=wireguard&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

**WireGuard mesh management platform** with browser-based SSH terminal, real-time health monitoring, and multi-tenant support.

VecGate provides a single dashboard to manage WireGuard mesh networks across multiple servers. Add nodes, monitor their status, generate WireGuard configs, deploy configurations remotely, and open SSH sessions directly from your browser — all through a modern dark-themed UI.

---

## Screenshots

> Screenshots coming soon.

| View | Description |
|------|-------------|
| **Dashboard** | Overview with node status cards (online/offline), average latency, and recent activity feed |
| **Hosts** | Card grid of all mesh nodes with search, add/edit/remove, WireGuard key generation, and config viewer |
| **Topology** | Interactive network map (React Flow) with circular/grid layouts, colored mesh links, and detail panel |
| **Terminal** | Full xterm.js terminal in the browser connected via WebSocket SSH to any mesh node |
| **Users** | User management table with role assignment and password changes |
| **Audit Log** | Filterable log of all actions (login, SSH connections, host changes, deployments) |
| **Settings** | Instance configuration for network defaults and client branding |

---

## Features

- **Dashboard** — Real-time overview of all nodes with online/offline status and latency
- **SSH Terminal in Browser** — Full interactive terminal via WebSocket + ssh2 (xterm.js frontend)
- **Host Management** — Add, edit, remove mesh nodes with IP, provider, region, and SSH credentials
- **WireGuard Key Generation** — Generate keypairs and download `wg0.conf` for any node
- **Remote Deployment** — Push WireGuard configs to nodes via SSH with one click
- **Health Monitoring** — Automatic ping every 30 seconds to all nodes
- **Audit Trail** — Every action is logged: logins, SSH sessions, host changes, deployments
- **User Management** — Multiple users with role-based access
- **Multi-Tenant** — Each deployment gets its own branding via `client.config.json` (company name, colors, logo)
- **Network Topology** — Interactive mesh visualization with React Flow (circular and grid layouts)
- **JWT Authentication** — Secure API access with 24h token expiration
- **Docker Deployment** — Single `docker-compose up` connecting to your mesh network

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
│  React 18 + MUI + xterm.js + React Flow         │
│  (Vite build served as static files)            │
└──────────────┬──────────────┬───────────────────┘
               │ HTTP/REST    │ WebSocket
               ▼              ▼
┌─────────────────────────────────────────────────┐
│              Node.js + Express                  │
│                                                 │
│  /api/auth     — JWT login/session              │
│  /api/hosts    — CRUD + keygen + wgconf         │
│  /api/ssh      — Remote exec + WG deploy        │
│  /api/settings — Instance config + audit log    │
│  /api/users    — User management                │
│  /api/config   — Client branding (public)       │
│  /ws/ssh       — WebSocket SSH terminal         │
│                                                 │
│  Health check loop (ping every 30s)             │
└──────────────┬──────────────┬───────────────────┘
               │              │
               ▼              ▼
┌──────────────────┐  ┌──────────────────────────┐
│   SQLite (WAL)   │  │   Mesh Network (Docker)  │
│   better-sqlite3 │  │   SSH + Ping to nodes    │
└──────────────────┘  └──────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js 20, Express 4, better-sqlite3, jsonwebtoken, bcryptjs |
| **SSH** | ssh2 (SSH connections), ws (WebSocket server) |
| **Frontend** | React 18, Vite 5, Material UI 5, xterm.js, React Flow, Recharts, Framer Motion |
| **Database** | SQLite with WAL mode and foreign keys |
| **Container** | Docker (Alpine), Docker Compose |
| **Network** | WireGuard (wg-quick, wg genkey/pubkey), ICMP ping health checks |

---

## Quick Start

### Prerequisites

- Docker and Docker Compose
- A Docker network connected to your mesh (or create one)
- Node.js 20+ (for frontend build)

### 1. Clone and configure

```bash
git clone https://github.com/Vinicius-Costa14/vecgate.git
cd vecgate

# Edit client branding and default credentials
cp client.config.json client.config.json.bak
nano client.config.json

# Create .env from example
cp .env.example .env
nano .env  # Set JWT_SECRET
```

### 2. Build the frontend

```bash
cd frontend
npm install
npm run build   # Creates frontend/dist/
cd ..
```

### 3. Create the Docker network (if needed)

```bash
# Replace with your actual mesh network name
docker network create mesh-network
```

### 4. Deploy

```bash
# Update docker-compose.yml network name to match your mesh
docker compose up -d --build
```

### 5. Access

Open `http://localhost:3000` and log in with the credentials from `client.config.json`.

**Default:** `admin` / `changeme` (change this immediately)

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with username/password, returns JWT |
| `GET` | `/api/auth/me` | Get current user info |

### Hosts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/hosts` | List all mesh nodes |
| `GET` | `/api/hosts/:id` | Get node details |
| `POST` | `/api/hosts` | Create new node |
| `PUT` | `/api/hosts/:id` | Update node |
| `DELETE` | `/api/hosts/:id` | Remove node |
| `POST` | `/api/hosts/:id/keygen` | Generate WireGuard keypair |
| `GET` | `/api/hosts/:id/wgconf` | Download wg0.conf for node |
| `GET` | `/api/hosts/:id/health` | Ping node and update status |

### SSH

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ssh/exec` | Execute command on node via SSH |
| `POST` | `/api/ssh/deploy` | Deploy WireGuard config to node |
| `WS` | `/ws/ssh?token=...&host_id=...` | Interactive SSH terminal (WebSocket) |

### Settings & Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings` | Get all settings |
| `PUT` | `/api/settings` | Update settings |
| `GET` | `/api/settings/audit` | Get audit log |
| `GET` | `/api/users` | List users |
| `POST` | `/api/users` | Create user |
| `PUT` | `/api/users/:id` | Update user |
| `DELETE` | `/api/users/:id` | Delete user |

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/config` | Client branding (name, colors, logo) |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DB_PATH` | `/data/vecgate.db` | SQLite database file path |
| `JWT_SECRET` | `change-me-in-production` | Secret for JWT token signing |
| `CONFIG_PATH` | `./client.config.json` | Path to client config file |
| `INIT_SQL_PATH` | `./database/init.sql` | Path to SQL schema file |
| `FRONTEND_PATH` | `./frontend/dist` | Path to built frontend |

---

## Multi-Tenant Deployment

Each client gets their own VecGate instance with custom branding. Edit `client.config.json` per deployment:

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

## Database Schema

VecGate uses SQLite with four tables:

- **users** — Panel users with bcrypt password hashes and roles
- **hosts** — Mesh nodes with IPs, WireGuard keys, SSH credentials, and status
- **settings** — Key-value instance configuration
- **audit_log** — Action log with user, action type, target, and timestamp

---

## Development

```bash
# Backend (with auto-reload)
cd backend
npm install
npm run dev

# Frontend (with HMR and API proxy)
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/ws` to `http://localhost:3000`.

---

## License

MIT
