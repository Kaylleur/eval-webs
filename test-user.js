// test-manage-users.js
const KcAdminClient = require('keycloak-admin').default;           // ou @keycloak/keycloak-admin-client
const kcAdminClient = new KcAdminClient({
  baseUrl: 'http://localhost:8080',
  realmName: 'myrealm',
});

(async () => {
  try {
    /* 1) Authentification en tant que test2 */
    await kcAdminClient.auth({
      username: 'test2',
      password: 'password',          // le mot de passe que vous avez mis dans l’init
      grantType: 'password',
      clientId: 'admin-cli',         // client built-in présent dans chaque realm
    });

    /* 2) Création d’un utilisateur jetable */
    const suffix   = Date.now();                 // évite les collisions de nom
    const username = `probe_${suffix}`;

    const newUser = await kcAdminClient.users.create({
      username,
      email:    `${username}@example.com`,
      enabled:  true,
      firstName: 'Probe',
      lastName:  'User',
      credentials: [{
        type:  'password',
        value: 'Temp#123',
        temporary: false,
      }],
    });

    console.log(`✅  Création réussie : id = ${newUser.id}`);

    /* 3) Nettoyage (optionnel mais conseillé dans un test) */
    await kcAdminClient.users.del({ id: newUser.id });
    console.log('🚮  Utilisateur de test supprimé — droit "manage-users" confirmé.');
    process.exit(0);

  } catch (err) {
    const details = err.response?.data || err;
    console.error('❌  Échec — probable absence du droit "manage-users":', details);
    process.exit(1);
  }
})();
