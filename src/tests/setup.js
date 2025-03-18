// tests/setupKeycloak.js
const request = require('supertest');

let keycloakAccessToken = '';
let keycloakAdminToken = '';

/**
 * Récupère un token Keycloak via le flow "Resource Owner Password Credentials"
 * et le stocke dans keycloakAccessToken.
 */
async function getKeycloakToken() {
    const res = await request(process.env.KEYCLOAK_URL)
        .post(`/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`)
        .type('form')
        .send({
            grant_type: 'password',
            client_id: process.env.KEYCLOAK_CLIENT_ID,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET, // si client_id est en mode confidential
            username: process.env.KEYCLOAK_TEST_USERNAME,
            password: process.env.KEYCLOAK_TEST_PASSWORD,
        });

    if (res.status !== 200) {
        throw new Error(`Impossible de récupérer le token Keycloak: ${res.text}`);
    }

    keycloakAccessToken = res.body.access_token;
}

async function getKeycloakAdminToken() {
    const res = await request(process.env.KEYCLOAK_URL)
        .post(`/realms/master/protocol/openid-connect/token`)
        .type('form')
        .send({
            grant_type: 'password',
            client_id: 'admin-cli',
            username: process.env.KEYCLOAK_ADMIN_USERNAME,
            password: process.env.KEYCLOAK_ADMIN_PASSWORD,
        });

    if (res.status !== 200) {
        throw new Error(`Impossible de récupérer le token Keycloak: ${res.text}`);
    }

    keycloakAdminToken = res.body.access_token;
}

// Getter pour récupérer le token dans d'autres fichiers de test
function getToken() {
    return keycloakAccessToken;
}
function getAdminToken() {
    return keycloakAdminToken;
}

// Hook Jest appelé avant tous les tests
beforeAll(async () => {
    await getKeycloakToken();
    await getKeycloakAdminToken();
}, 30000); // Timeout plus large si nécessaire

module.exports = {
    getToken,
    getAdminToken,
};
