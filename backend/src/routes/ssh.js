const express = require('express');
const fs = require('fs');
const { Client } = require('ssh2');
const { getDB } = require('../database');
const { authMiddleware } = require('../middleware/auth');

function buildSshOpts(host) {
    const target = host.ip_public || host.ip_mesh;
    const opts = { host: target, port: host.port_ssh, username: host.ssh_user || 'root', readyTimeout: 10000 };
    if (host.ssh_auth === 'key' && host.ssh_key_path) {
        opts.privateKey = fs.readFileSync(host.ssh_key_path, 'utf-8');
    } else {
        opts.password = host.ssh_password || '';
    }
    return opts;
}

const router = express.Router();
router.use(authMiddleware);

// POST /api/ssh/exec — executar comando num node via SSH
router.post('/exec', (req, res) => {
    const { host_id, command } = req.body;

    if (!host_id || !command) {
        return res.status(400).json({ error: 'host_id e command obrigatórios' });
    }

    const db = getDB();
    const host = db.prepare('SELECT * FROM hosts WHERE id = ?').get(host_id);
    if (!host) return res.status(404).json({ error: 'Host não encontrado' });

    const target = host.ip_public || host.ip_mesh;
    const conn = new Client();
    let output = '';

    conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
            if (err) {
                conn.end();
                return res.status(500).json({ error: err.message });
            }

            stream.on('data', (data) => { output += data.toString(); });
            stream.stderr.on('data', (data) => { output += data.toString(); });
            stream.on('close', (code) => {
                conn.end();

                db.prepare(
                    'INSERT INTO audit_log (user_id, action, target, details) VALUES (?, ?, ?, ?)'
                ).run(req.user.id, 'ssh.exec', host.hostname, JSON.stringify({ command, exit_code: code }));

                res.json({ hostname: host.hostname, command, exit_code: code, output });
            });
        });
    });

    conn.on('error', (err) => {
        res.status(500).json({ error: `SSH falhou: ${err.message}` });
    });

    conn.connect(buildSshOpts(host));
});

// POST /api/ssh/deploy — deploy WireGuard num node
router.post('/deploy', (req, res) => {
    const { host_id } = req.body;

    if (!host_id) {
        return res.status(400).json({ error: 'host_id obrigatório' });
    }

    const db = getDB();
    const host = db.prepare('SELECT * FROM hosts WHERE id = ?').get(host_id);
    if (!host) return res.status(404).json({ error: 'Host não encontrado' });

    if (!host.privkey_wg) {
        return res.status(400).json({ error: 'Gere as chaves primeiro (POST /api/hosts/:id/keygen)' });
    }

    // Gerar wg0.conf pro node
    const peers = db.prepare(
        'SELECT * FROM hosts WHERE id != ? AND subnet = ? AND pubkey_wg IS NOT NULL'
    ).all(host_id, host.subnet);

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

    // Conectar via SSH e deplovar
    const target = host.ip_public || host.ip_mesh;
    const conn = new Client();
    let output = '';

    db.prepare('UPDATE hosts SET status = ? WHERE id = ?').run('deploying', host.id);

    conn.on('ready', () => {
        const commands = [
            `mkdir -p /etc/wireguard`,
            `cat > /etc/wireguard/wg0.conf << 'WGEOF'\n${conf}\nWGEOF`,
            `chmod 600 /etc/wireguard/wg0.conf`,
            `wg-quick down wg0 2>/dev/null; wg-quick up wg0`,
            `systemctl enable wg-quick@wg0 2>/dev/null; echo "WireGuard ativo"`,
            `wg show wg0`
        ].join(' && ');

        conn.exec(commands, (err, stream) => {
            if (err) {
                conn.end();
                db.prepare('UPDATE hosts SET status = ? WHERE id = ?').run('offline', host.id);
                return res.status(500).json({ error: err.message });
            }

            stream.on('data', (data) => { output += data.toString(); });
            stream.stderr.on('data', (data) => { output += data.toString(); });
            stream.on('close', (code) => {
                conn.end();

                const newStatus = code === 0 ? 'online' : 'offline';
                db.prepare('UPDATE hosts SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?')
                    .run(newStatus, host.id);

                db.prepare(
                    'INSERT INTO audit_log (user_id, action, target, details) VALUES (?, ?, ?, ?)'
                ).run(req.user.id, 'ssh.deploy', host.hostname, JSON.stringify({ exit_code: code }));

                res.json({ hostname: host.hostname, status: newStatus, exit_code: code, output });
            });
        });
    });

    conn.on('error', (err) => {
        db.prepare('UPDATE hosts SET status = ? WHERE id = ?').run('offline', host.id);
        res.status(500).json({ error: `SSH falhou: ${err.message}` });
    });

    conn.connect(buildSshOpts(host));
});

module.exports = router;
