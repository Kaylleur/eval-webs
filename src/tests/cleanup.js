// scripts/cleanupDB.js
require('dotenv').config();          // Charge les variables d'environnement
const axios = require('axios');
const { Pool } = require('pg');

// Configuration Postgres
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'pgdb',
    user: process.env.DB_USER || 'pguser',
    password: process.env.DB_PASS || 'admin',
    port: Number(process.env.DB_PORT) || 5432,
});

// Configuration Keycloak Admin
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'reservation-realm';
const KEYCLOAK_ADMIN_CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli';
const KEYCLOAK_ADMIN_CLIENT_SECRET = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || 'secret';

// Fonctions utilitaires
async function getAdminAccessToken() {
    const url = `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`;
    // Flow "client_credentials"
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', KEYCLOAK_ADMIN_CLIENT_ID);
    params.append('client_secret', KEYCLOAK_ADMIN_CLIENT_SECRET);

    const res = await axios.post(url, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return res.data.access_token; // On récupère juste access_token
}

async function cleanupTables() {
    console.log('=== Truncating tables ===');
    // Attention à l’ordre si vous avez des clés étrangères
    await pool.query('TRUNCATE TABLE notifications RESTART IDENTITY CASCADE;');
    await pool.query('TRUNCATE TABLE reservations RESTART IDENTITY CASCADE;');
    await pool.query('TRUNCATE TABLE rooms RESTART IDENTITY CASCADE;');
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
}

async function fetchAndInsertKeycloakUsers(adminToken) {
    console.log('=== Fetching users from Keycloak ===');
    const url = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?max=1000`;

    const res = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${adminToken}`
        }
    });

    const keycloakUsers = res.data; // Liste d'utilisateurs
    console.log(`Found ${keycloakUsers.length} users in Keycloak.`);

    for (const user of keycloakUsers) {
        const keycloakId = user.id; // champ "id" côté Keycloak
        const email = user.email || null;

        // Insertion dans la table "users" locale
        // Champs : keycloak_id, email, created_at
        await pool.query(
            `INSERT INTO users (keycloak_id, email, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (keycloak_id) DO NOTHING;`,
            [keycloakId, email]
        );
    }
}

async function main() {
    try {
        // 1) Nettoyage des tables
        await cleanupTables();

        // 2) Récupération du token Admin Keycloak
        const adminToken = await getAdminAccessToken();

        // 3) Récupérer la liste des users Keycloak et insérer dans DB
        await fetchAndInsertKeycloakUsers(adminToken);

        console.log('=== Cleanup & Keycloak user sync completed ===');
    } catch (err) {
        console.error('Error in cleanupDB script:', err);
    } finally {
        await pool.end();
    }
}

// Lancer le script si exécuté directement
if (require.main === module) {
    main();
}

module.exports = { main };
