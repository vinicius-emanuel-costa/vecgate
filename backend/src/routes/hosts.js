const express = require('express');
const { getDB } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// GET /api/hosts — listar todos os nodes
router.get('/', (req, res) => {
    const db = getDB();
    const hosts = db.prepare(
        'SELECT id, hostname, ip_public, ip_mesh, subnet, port_wg, port_ssh, pubkey_wg, provider, region, node_type, status, last_seen, notes, ssh_user, ssh_auth, ssh_password, ssh_key_path, created_at FROM hosts ORDER BY ip_mesh'
    ).all();
    res.json(hosts);
});

// GET /api/hosts/:id — detalhes de um node
router.get('/:id', (req, res) => {
    const db = getDB();
    const host = db.prepare(
        'SELECT * FROM hosts WHERE id = ?'
    ).get(req.params.id);

    if (!host) return res.status(404).json({ error: 'Host não encontrado' });

    // Não retorna chaves sensíveis na listagem
    delete host.privkey_wg;
    delete host.ssh_password;
    res.json(host);
});

// POST /api/hosts — criar novo node
router.post('/', (req, res) => {
    const { hostname, ip_public, ip_mesh, subnet, port_wg, port_ssh, provider, region, node_type, notes, ssh_user, ssh_auth, ssh_password, ssh_key_path } = req.body;

    if (!hostname || !ip_mesh) {
        return res.status(400).json({ error: 'hostname e ip_mesh obrigatórios' });
    }

    const db = getDB();

    // Verificar IP duplicado
    const exists = db.prepare('SELECT id FROM hosts WHERE ip_mesh = ?').get(ip_mesh);
    if (exists) {
        return res.status(409).json({ error: 'IP mesh já em uso' });
    }

    const result = db.prepare(`
        INSERT INTO hosts (hostname, ip_public, ip_mesh, subnet, port_wg, port_ssh, provider, region, node_type, notes, ssh_user, ssh_auth, ssh_password, ssh_key_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        hostname,
        ip_public || null,
        ip_mesh,
        subnet || '0',
        port_wg || 51820,
        port_ssh || 7412,
        provider || null,
        region || null,
        node_type || 'vps',
        notes || null,
        ssh_user || 'root',
        ssh_auth || 'password',
        ssh_password || '',
        ssh_key_path || null
    );

    // Log
    db.prepare(
        'INSERT INTO audit_log (user_id, action, target, details) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, 'host.create', hostname, JSON.stringify({ ip_mesh, provider }));

    const host = db.prepare('SELECT * FROM hosts WHERE id = ?').get(result.lastInsertRowid);
    delete host.privkey_wg;
    res.status(201).json(host);
});

// PUT /api/hosts/:id — atualizar node
router.put('/:id', (req, res) => {
    const db = getDB();
    const host = db.prepare('SELECT * FROM hosts WHERE id = ?').get(req.params.id);
    if (!host) return res.status(404).json({ error: 'Host não encontrado' });

    const { hostname, ip_public, ip_mesh, subnet, port_wg, port_ssh, provider, region, node_type, status, notes, ssh_user, ssh_auth, ssh_password, ssh_key_path } = req.body;

    db.prepare(`
        UPDATE hosts SET
            hostname = ?, ip_public = ?, ip_mesh = ?, subnet = ?,
            port_wg = ?, port_ssh = ?, provider = ?, region = ?,
            node_type = ?, status = ?, notes = ?,
            ssh_user = ?, ssh_auth = ?, ssh_password = ?, ssh_key_path = ?
        WHERE id = ?
    `).run(
        hostname || host.hostname,
        ip_public !== undefined ? ip_public : host.ip_public,
        ip_mesh || host.ip_mesh,
        subnet || host.subnet,
        port_wg || host.port_wg,
        port_ssh || host.port_ssh,
        provider !== undefined ? provider : host.provider,
        region !== undefined ? region : host.region,
        node_type || host.node_type,
        status || host.status,
        notes !== undefined ? notes : host.notes,
        ssh_user || host.ssh_user || 'root',
        ssh_auth || host.ssh_auth || 'password',
        ssh_password !== undefined ? ssh_password : (host.ssh_password || ''),
        ssh_key_path !== undefined ? ssh_key_path : host.ssh_key_path,
        req.params.id
    );

    db.prepare(
        'INSERT INTO audit_log (user_id, action, target) VALUES (?, ?, ?)'
    ).run(req.user.id, 'host.update', hostname || host.hostname);

    const updated = db.prepare('SELECT * FROM hosts WHERE id = ?').get(req.params.id);
    delete updated.privkey_wg;
    res.json(updated);
});

// DELETE /api/hosts/:id — remover node
router.delete('/:id', (req, res) => {
    const db = getDB();
    const host = db.prepare('SELECT * FROM hosts WHERE id = ?').get(req.params.id);
    if (!host) return res.status(404).json({ error: 'Host não encontrado' });

    db.prepare('DELETE FROM hosts WHERE id = ?').run(req.params.id);

    db.prepare(
        'INSERT INTO audit_log (user_id, action, target) VALUES (?, ?, ?)'
    ).run(req.user.id, 'host.delete', host.hostname);

    res.json({ message: 'Host removido', hostname: host.hostname });
});

// POST /api/hosts/:id/keygen — gerar chaves WireGuard pro node
router.post('/:id/keygen', (req, res) => {
    const db = getDB();
    const host = db.prepare('SELECT * FROM hosts WHERE id = ?').get(req.params.id);
    if (!host) return res.status(404).json({ error: 'Host não encontrado' });

    // Gerar chaves usando wg (se disponível no container)
    const { execSync } = require('child_process');
    try {
        const privkey = execSync('wg genkey', { encoding: 'utf-8' }).trim();
        const pubkey = execSync(`echo "${privkey}" | wg pubkey`, { encoding: 'utf-8' }).trim();

        db.prepare(
            'UPDATE hosts SET pubkey_wg = ?, privkey_wg = ? WHERE id = ?'
        ).run(pubkey, privkey, req.params.id);

        db.prepare(
            'INSERT INTO audit_log (user_id, action, target) VALUES (?, ?, ?)'
        ).run(req.user.id, 'host.keygen', host.hostname);

        res.json({ pubkey, message: 'Chaves geradas com sucesso' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao gerar chaves: ' + err.message });
    }
});

// GET /api/hosts/:id/wgconf — gerar wg0.conf do node
router.get('/:id/wgconf', (req, res) => {
    const db = getDB();
    const host = db.prepare('SELECT * FROM hosts WHERE id = ?').get(req.params.id);
    if (!host) return res.status(404).json({ error: 'Host não encontrado' });

    if (!host.privkey_wg) {
        return res.status(400).json({ error: 'Node sem chaves. Use /keygen primeiro.' });
    }

    // Buscar todos os outros nodes da mesma subnet como peers
    const peers = db.prepare(
        'SELECT * FROM hosts WHERE id != ? AND subnet = ? AND pubkey_wg IS NOT NULL'
    ).all(req.params.id, host.subnet);

    const settings = {};
    db.prepare('SELECT key, value FROM settings').all().forEach(s => {
        settings[s.key] = s.value;
    });

    let conf = `# ${host.hostname} — IP mesh: ${host.ip_mesh}\n`;
    conf += `[Interface]\n`;
    conf += `PrivateKey = ${host.privkey_wg}\n`;
    conf += `Address = ${host.ip_mesh}/24\n`;
    conf += `ListenPort = ${host.port_wg}\n`;

    for (const peer of peers) {
        conf += `\n# ${peer.hostname}\n`;
        conf += `[Peer]\n`;
        conf += `PublicKey = ${peer.pubkey_wg}\n`;
        conf += `AllowedIPs = ${peer.ip_mesh}/32\n`;
        if (peer.ip_public) {
            conf += `Endpoint = ${peer.ip_public}:${peer.port_wg}\n`;
        }
        conf += `PersistentKeepalive = ${settings.keepalive || '25'}\n`;
    }

    res.type('text/plain').send(conf);
});

// GET /api/hosts/:id/health — verificar status do node
router.get('/:id/health', (req, res) => {
    const db = getDB();
    const host = db.prepare('SELECT * FROM hosts WHERE id = ?').get(req.params.id);
    if (!host) return res.status(404).json({ error: 'Host não encontrado' });

    const { execSync } = require('child_process');
    try {
        const target = host.ip_mesh;
        const result = execSync(
            `ping -c 1 -W 3 ${target} 2>&1`,
            { encoding: 'utf-8', timeout: 5000 }
        );
        const latency = result.match(/time=([\d.]+)/);

        db.prepare('UPDATE hosts SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?')
            .run('online', host.id);

        res.json({
            status: 'online',
            latency_ms: latency ? parseFloat(latency[1]) : null,
            last_seen: new Date().toISOString()
        });
    } catch {
        db.prepare('UPDATE hosts SET status = ? WHERE id = ?').run('offline', host.id);
        res.json({ status: 'offline', latency_ms: null, last_seen: host.last_seen });
    }
});

module.exports = router;
