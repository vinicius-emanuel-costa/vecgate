-- =============================================
--  VECGATE — Schema do banco de dados
--  Produto: Vinícius Costa
--  Deploy por cliente — cada instância tem seu banco
-- =============================================

-- Usuários do painel (por instância)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Nodes (servidores na mesh do cliente)
CREATE TABLE IF NOT EXISTS hosts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostname TEXT NOT NULL,
    ip_public TEXT,
    ip_mesh TEXT NOT NULL,
    subnet TEXT DEFAULT '0',
    port_wg INTEGER DEFAULT 51820,
    port_ssh INTEGER DEFAULT 7412,
    pubkey_wg TEXT,
    privkey_wg TEXT,
    provider TEXT,
    region TEXT,
    node_type TEXT DEFAULT 'vps',
    status TEXT DEFAULT 'offline',
    last_seen DATETIME,
    notes TEXT,
    ssh_user TEXT DEFAULT 'root',
    ssh_auth TEXT DEFAULT 'password',
    ssh_password TEXT,
    ssh_key_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configurações da instância
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Log de ações
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    target TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
