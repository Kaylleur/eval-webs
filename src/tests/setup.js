// tests/setupKeycloak.js
const request = require('supertest');
const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

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
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET, // si le client est en mode "confidential"
      username: process.env.KEYCLOAK_TEST_USERNAME,
      password: process.env.KEYCLOAK_TEST_PASSWORD,
    });

  if (res.status !== 200) {
    throw new Error(`Impossible de récupérer le token Keycloak: ${res.text}`);
  }

  keycloakAccessToken = res.body.access_token;
}

/**
 * Récupère un token admin Keycloak pour effectuer des actions d'administration
 * et le stocke dans keycloakAdminToken.
 */
async function getKeycloakAdminToken() {
  try {

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
  } catch (err) {
    console.error('Error fetching admin token:', err);
    throw err;
  }
}

// Getter pour récupérer le token dans d'autres fichiers de test
function getToken() {
  return keycloakAccessToken;
}

function getAdminToken() {
  return keycloakAdminToken;
}

/**
 * Vérifie le token JWT généré via le JWKS de Keycloak.
 *
 * @param {string} token - Le token JWT que l'on souhaite vérifier.
 * @returns {Promise<Object>} - Retourne le payload décodé du token si la vérification réussit, sinon lève une erreur.
 */
async function verifyJwtToken(token) {
  // Initialise un client JWKS pointant vers les clés publiques du realm Keycloak
  const client = jwksClient({
    jwksUri: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  });

  // Cette fonction permet à `jsonwebtoken` de récupérer la clé correspondant au kid du token
  function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        return callback(err);
      }
      // Récupère la clé publique et renvoie au callback
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  }

  // On retourne une Promise pour pouvoir faire un `await` dessus
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        // Vérifie que l'issuer correspond à ton realm Keycloak
        issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      },
      (err, decoded) => {
        if (err) {
          return reject(err);
        }
        return resolve(decoded);
      },
    );
  });
}

// Hook Jest appelé avant tous les tests
beforeAll(async () => {
  await getKeycloakToken();
  await getKeycloakAdminToken();
}, 30000); // Timeout plus large si nécessaire

module.exports = {
  getToken,
  getAdminToken,
  verifyJwtToken,
};
