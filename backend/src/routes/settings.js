const express = require('express');
const { getDB } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/settings — todas as configurações
router.get('/', (req, res) => {
    const db = getDB();
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
});

// PUT /api/settings — atualizar configurações
router.put('/', (req, res) => {
    const db = getDB();
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    const transaction = db.transaction((entries) => {
        for (const [key, value] of Object.entries(entries)) {
            upsert.run(key, String(value));
        }
    });

    transaction(req.body);

    db.prepare(
        'INSERT INTO audit_log (user_id, action, target) VALUES (?, ?, ?)'
    ).run(req.user.id, 'settings.update', Object.keys(req.body).join(', '));

    res.json({ message: 'Configurações atualizadas' });
});

// GET /api/audit — log de ações
router.get('/audit', (req, res) => {
    const db = getDB();
    const limit = parseInt(req.query.limit) || 50;
    const logs = db.prepare(`
        SELECT a.*, u.username
        FROM audit_log a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT ?
    `).all(limit);
    res.json(logs);
});

module.exports = router;
