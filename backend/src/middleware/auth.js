const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function authMiddleware(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const token = header.split(' ')[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

module.exports = { authMiddleware, JWT_SECRET };
