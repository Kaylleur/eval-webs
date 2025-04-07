require('dotenv').config();          // Charge les variables d'environnement
const { Pool } = require('pg');

// Configuration Postgres
let pool;

module.exports = {
    getPool: () => {
        if(!pool) {
            pool = new Pool({
                host: process.env.DB_HOST || 'localhost',
                database: process.env.DB_NAME || 'pgdb',
                user: process.env.DB_USER || 'pguser',
                password: process.env.DB_PASS || 'pgpass',
                port: Number(process.env.DB_PORT) || 5432,
            });
        }
        return pool;
    },
    closePool: async () => {
        if(pool) {
            await pool.end();
            pool = null;
        }
    }
}