const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');
const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const { Client } = require('ssh2');
const { initDatabase, getDB } = require('./database');
const { JWT_SECRET } = require('./middleware/auth');

// Carregar config do cliente
const configPath = process.env.CONFIG_PATH || path.join(__dirname, '../../client.config.json');
const clientConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Inicializar banco
initDatabase(clientConfig);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir frontend (build estático)
const FRONTEND_PATH = process.env.FRONTEND_PATH || path.join(__dirname, '../../frontend/dist');
app.use(express.static(FRONTEND_PATH));

// Rota pública — config do cliente pro frontend
app.get('/api/config', (req, res) => {
    res.json({
        name: clientConfig.company.name,
        logo_url: clientConfig.company.logo_url,
        primary_color: clientConfig.company.primary_color,
        dark_color: clientConfig.company.dark_color
    });
});

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hosts', require('./routes/hosts'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/ssh', require('./routes/ssh'));
app.use('/api/users', require('./routes/users'));

// SPA fallback
app.get('*', (req, res) => {
    const indexPath = path.join(FRONTEND_PATH, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({ name: 'VecGate API', version: '1.0.0', client: clientConfig.company.name });
    }
});

// HTTP server (pra compartilhar com WebSocket)
const server = http.createServer(app);

// ===== WEBSOCKET SSH TERMINAL =====
const wss = new WebSocketServer({ server, path: '/ws/ssh' });

wss.on('connection', (ws, req) => {
    // Extrair token da query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const hostId = url.searchParams.get('host_id');

    if (!token || !hostId) {
        ws.send(JSON.stringify({ type: 'error', data: 'Token e host_id obrigatorios' }));
        ws.close();
        return;
    }

    // Validar JWT
    let user;
    try {
        user = jwt.verify(token, JWT_SECRET);
    } catch {
        ws.send(JSON.stringify({ type: 'error', data: 'Token invalido' }));
        ws.close();
        return;
    }

    // Buscar host
    const db = getDB();
    const host = db.prepare('SELECT * FROM hosts WHERE id = ?').get(hostId);
    if (!host) {
        ws.send(JSON.stringify({ type: 'error', data: 'Host nao encontrado' }));
        ws.close();
        return;
    }

    const target = host.ip_public || host.ip_mesh;
    const sshConn = new Client();
    let stream = null;

    ws.send(JSON.stringify({ type: 'status', data: `Conectando a ${host.hostname} (${target})...\r\n` }));

    sshConn.on('ready', () => {
        ws.send(JSON.stringify({ type: 'status', data: `Conectado a ${host.hostname}!\r\n` }));

        // Log
        db.prepare('INSERT INTO audit_log (user_id, action, target) VALUES (?, ?, ?)')
            .run(user.id, 'ssh.connect', host.hostname);

        // Abrir shell interativo
        sshConn.shell({ term: 'xterm-256color', cols: 120, rows: 30 }, (err, s) => {
            if (err) {
                ws.send(JSON.stringify({ type: 'error', data: `Erro ao abrir shell: ${err.message}` }));
                ws.close();
                return;
            }

            stream = s;

            // SSH → WebSocket (output do servidor pro terminal)
            stream.on('data', (data) => {
                if (ws.readyState === 1) {
                    ws.send(JSON.stringify({ type: 'data', data: data.toString('utf-8') }));
                }
            });

            stream.stderr.on('data', (data) => {
                if (ws.readyState === 1) {
                    ws.send(JSON.stringify({ type: 'data', data: data.toString('utf-8') }));
                }
            });

            stream.on('close', () => {
                ws.send(JSON.stringify({ type: 'status', data: '\r\nConexao encerrada.\r\n' }));
                ws.close();
            });
        });
    });

    sshConn.on('error', (err) => {
        ws.send(JSON.stringify({ type: 'error', data: `SSH erro: ${err.message}\r\n` }));
        ws.close();
    });

    // WebSocket → SSH (input do terminal pro servidor)
    ws.on('message', (msg) => {
        try {
            const parsed = JSON.parse(msg.toString());
            if (parsed.type === 'input' && stream) {
                stream.write(parsed.data);
            } else if (parsed.type === 'resize' && stream) {
                stream.setWindow(parsed.rows, parsed.cols, 0, 0);
            }
        } catch {
            // Se não é JSON, trata como input direto
            if (stream) stream.write(msg.toString());
        }
    });

    ws.on('close', () => {
        if (stream) stream.end();
        sshConn.end();
    });

    // Conectar SSH
    const sshOpts = {
        host: target,
        port: host.port_ssh,
        username: host.ssh_user || 'root',
        readyTimeout: 10000
    };

    if (host.ssh_auth === 'key' && host.ssh_key_path) {
        sshOpts.privateKey = fs.readFileSync(host.ssh_key_path, 'utf-8');
    } else {
        sshOpts.password = host.ssh_password || '';
    }

    sshConn.connect(sshOpts);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║         VECGATE v1.0.0               ║`);
    console.log(`║   Vinícius Costa — Mesh Manager       ║`);
    console.log(`╠══════════════════════════════════════╣`);
    console.log(`║  Cliente: ${clientConfig.company.name.padEnd(25)}║`);
    console.log(`║  Porta:   ${String(PORT).padEnd(25)}║`);
    console.log(`║  Banco:   ${(process.env.DB_PATH || '/data/vecgate.db').padEnd(25)}║`);
    console.log(`║  WebSocket: ws://0.0.0.0:${String(PORT).padEnd(13)}║`);
    console.log(`║  Health:  a cada 30s              ║`);
    console.log(`╚══════════════════════════════════════╝\n`);

    // ===== HEALTH CHECK AUTOMÁTICO =====
    const HEALTH_INTERVAL = 30000; // 30 segundos

    async function healthCheckAll() {
        const db = getDB();
        const hosts = db.prepare('SELECT * FROM hosts').all();

        for (const host of hosts) {
            const target = host.ip_mesh;
            try {
                const start = Date.now();
                execSync(`ping -c 1 -W 2 ${target}`, { stdio: 'ignore' });
                const latency = Date.now() - start;
                db.prepare('UPDATE hosts SET status = ?, last_seen = ? WHERE id = ?')
                    .run('online', new Date().toISOString(), host.id);
            } catch {
                db.prepare('UPDATE hosts SET status = ? WHERE id = ?')
                    .run('offline', host.id);
            }
        }
    }

    // Primeira checagem após 5s, depois a cada 30s
    setTimeout(() => {
        healthCheckAll();
        setInterval(healthCheckAll, HEALTH_INTERVAL);
    }, 5000);

    console.log('Health check automático iniciado (30s)\n');
});
