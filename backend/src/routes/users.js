const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/users — listar todos
router.get('/', (req, res) => {
    const db = getDB();
    const users = db.prepare(
        'SELECT id, username, name, role, created_at FROM users ORDER BY id'
    ).all();
    res.json(users);
});

// POST /api/users — criar novo
router.post('/', (req, res) => {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
        return res.status(400).json({ error: 'username, password e name obrigatorios' });
    }

    const db = getDB();
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (exists) {
        return res.status(409).json({ error: 'Username ja existe' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
        'INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)'
    ).run(username, hash, name, role || 'admin');

    db.prepare(
        'INSERT INTO audit_log (user_id, action, target) VALUES (?, ?, ?)'
    ).run(req.user.id, 'user.create', username);

    const user = db.prepare(
        'SELECT id, username, name, role, created_at FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json(user);
});

// PUT /api/users/:id — atualizar
router.put('/:id', (req, res) => {
    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

    const { name, role, password } = req.body;

    if (password) {
        const hash = bcrypt.hashSync(password, 10);
        db.prepare('UPDATE users SET name = ?, role = ?, password_hash = ? WHERE id = ?')
            .run(name || user.name, role || user.role, hash, req.params.id);
    } else {
        db.prepare('UPDATE users SET name = ?, role = ? WHERE id = ?')
            .run(name || user.name, role || user.role, req.params.id);
    }

    db.prepare(
        'INSERT INTO audit_log (user_id, action, target) VALUES (?, ?, ?)'
    ).run(req.user.id, 'user.update', user.username);

    const updated = db.prepare(
        'SELECT id, username, name, role, created_at FROM users WHERE id = ?'
    ).get(req.params.id);

    res.json(updated);
});

// DELETE /api/users/:id — remover
router.delete('/:id', (req, res) => {
    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

    // Não pode deletar a si mesmo
    if (user.id === req.user.id) {
        return res.status(400).json({ error: 'Nao pode remover seu proprio usuario' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

    db.prepare(
        'INSERT INTO audit_log (user_id, action, target) VALUES (?, ?, ?)'
    ).run(req.user.id, 'user.delete', user.username);

    res.json({ message: 'Usuario removido', username: user.username });
});

module.exports = router;
