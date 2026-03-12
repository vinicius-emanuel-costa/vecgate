const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || '/data/vecgate.db';

let db;

function initDatabase(clientConfig) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Rodar schema
    const initSQL = fs.readFileSync(
        process.env.INIT_SQL_PATH || path.join(__dirname, '../../database/init.sql'),
        'utf-8'
    );
    db.exec(initSQL);

    // Criar admin padrão se não existir
    const adminExists = db.prepare('SELECT id FROM users WHERE username = ?')
        .get(clientConfig.admin.default_user);

    if (!adminExists) {
        const hash = bcrypt.hashSync(clientConfig.admin.default_password, 10);
        db.prepare(
            'INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)'
        ).run(clientConfig.admin.default_user, hash, 'Administrador', 'admin');
        console.log(`[DB] Admin criado: ${clientConfig.admin.default_user}`);
    }

    // Salvar configs do cliente no banco
    const upsert = db.prepare(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
    );
    upsert.run('company_name', clientConfig.company.name);
    upsert.run('company_slug', clientConfig.company.slug);
    upsert.run('primary_color', clientConfig.company.primary_color);
    upsert.run('network_block', String(clientConfig.network.block));
    upsert.run('default_port_wg', String(clientConfig.network.default_port_wg));
    upsert.run('default_port_ssh', String(clientConfig.network.default_port_ssh));
    upsert.run('keepalive', String(clientConfig.network.keepalive));

    console.log(`[DB] Banco inicializado para: ${clientConfig.company.name}`);
    return db;
}

function getDB() {
    return db;
}

module.exports = { initDatabase, getDB };
