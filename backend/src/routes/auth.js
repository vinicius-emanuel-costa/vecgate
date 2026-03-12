const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username e password obrigatórios' });
    }

    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    db.prepare(
        'INSERT INTO audit_log (user_id, action, target) VALUES (?, ?, ?)'
    ).run(user.id, 'auth.login', user.username);

    res.json({
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role }
    });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
    const db = getDB();
    const user = db.prepare(
        'SELECT id, username, name, role, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
});

module.exports = router;
