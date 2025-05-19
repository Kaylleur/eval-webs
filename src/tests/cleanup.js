// scripts/cleanupDB.js
require('dotenv').config();          // Charge les variables d'environnement
const axios = require('axios');
const { Pool } = require('pg');
const request = require("supertest");

// Configuration Postgres
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'pgdb',
    user: process.env.DB_USER || 'pguser',
    password: process.env.DB_PASS || 'pgpass',
    port: Number(process.env.DB_PORT) || 5432,
});

// Configuration Keycloak Admin
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'reservation-realm';
const KEYCLOAK_ADMIN_CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli';
const KEYCLOAK_ADMIN_CLIENT_SECRET = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || 'secret';

// Fonctions utilitaires
async function getAdminAccessToken() {
    try {
        const res = await request(process.env.KEYCLOAK_URL)
          .post(`/realms/master/protocol/openid-connect/token`)
          .type('form')
          .send({
              grant_type: 'password',
              client_id: KEYCLOAK_ADMIN_CLIENT_ID,
              username: process.env.KEYCLOAK_ADMIN_USERNAME,
              password: process.env.KEYCLOAK_ADMIN_PASSWORD,
          });

        if (res.status !== 200) {
            throw new Error(`Impossible de récupérer le token Keycloak: ${res.text}`);
        }

        return res.body.access_token;
    } catch (err) {
        console.error('Error fetching admin token:', err);
        throw err;
    }
}

async function cleanupTables() {
    //console.log('=== Truncating tables ===');
    // Attention à l’ordre si vous avez des clés étrangères
// Utilisation :
    await safeTruncate(pool, 'notifications');
    await safeTruncate(pool, 'reservations');
    await safeTruncate(pool, 'rooms');
    await safeTruncate(pool, 'users');
}

async function fetchAndInsertKeycloakUsers(adminToken) {
    //console.log('=== Fetching users from Keycloak ===');
    const url = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?max=1000`;

    const res = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${adminToken}`
        }
    });

    const keycloakUsers = res.data; // Liste d'utilisateurs
    //console.log(`Found ${keycloakUsers.length} users in Keycloak.`);

    for (const user of keycloakUsers) {
        const keycloakId = user.id; // champ "id" côté Keycloak
        const email = user.email || null;

        // Insertion dans la table "users" locale
        // Champs : keycloak_id, email, created_at
        await pool.query(
            `INSERT INTO "users" ("keycloak_id", email, "created_at", "updated_at")
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT ("keycloak_id") DO NOTHING;`,
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

        //console.log('=== Cleanup & Keycloak user sync completed ===');
    } catch (err) {
        console.error('Error in cleanupDB script:', err);
    } finally {
        await pool.end();
    }
}

async function safeTruncate(pool, tableName) {
    await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${tableName}') THEN
        EXECUTE 'TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE';
      END IF;
    END
    $$;
  `);
}


beforeAll(async () => {
    //console.log('=== Starting cleanupDB script ===');
    await main();
}, 10000); // Timeout de 10 secondes pour le beforeAll
module.exports = { main };
