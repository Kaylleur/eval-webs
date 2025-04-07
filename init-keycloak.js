// configure-keycloak.js
const KcAdminClient = require('keycloak-admin').default;

(async () => {
    const kcAdminClient = new KcAdminClient();

    // Variables that might change
    const KEYCLOAK_URL = 'http://localhost:8080';
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'admin';
    const REALM_NAME = 'myrealm';
    const CLIENT_ID = 'myclient';
    const CLIENT_SECRET = 'mysecret';
    const REDIRECT_URI = 'http://localhost:3000/callback';
    const LOGOUT_REDIRECT_URI = 'http://localhost:3000/';

    const users = [
        {
            username: 'test1',
            email: 'testuser1@example.com',
            firstName: 'Test',
            lastName: 'User',
            password: 'password',
        },
        {
            username: 'test2',
            email: 'testuser2@example.com',
            firstName: 'Test',
            lastName: 'User',
            password: 'password',
        }
        ];

    // Configure the client
    kcAdminClient.setConfig({
        baseUrl: KEYCLOAK_URL,
        realmName: 'master',
    });

    // Authenticate with admin credentials
    await kcAdminClient.auth({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        grantType: 'password',
        clientId: 'admin-cli',
    });

    // Create the realm
    try {
        await kcAdminClient.realms.create({
            realm: REALM_NAME,
            enabled: true,
        });
        console.log(`Realm ${REALM_NAME} created.`);
    } catch (err) {
        console.error('Error creating realm:', err.response?.data || err);
    }

    // Set the realm
    kcAdminClient.setConfig({
        realmName: REALM_NAME,
    });

    // Create the client
    const client = await kcAdminClient.clients.create({
        clientId: CLIENT_ID,
        secret: CLIENT_SECRET,
        redirectUris: [REDIRECT_URI,LOGOUT_REDIRECT_URI],
        standardFlowEnabled: true,
        directAccessGrantsEnabled: true,
        publicClient: false,
        serviceAccountsEnabled: true,
    });
    console.log(`Client ${CLIENT_ID} created.`);

    // Create the role
    await kcAdminClient.roles.create({
        name: 'user',
    });
    console.log(`Role user created.`);
    // Create the role
    await kcAdminClient.roles.create({
        name: 'admin',
    });
    console.log(`Role user created.`);

    const usersCreated = []
    // Create the user
    for(const user of users){
       const u = await kcAdminClient.users.create({
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            credentials: [
                {
                    type: 'password',
                    value: user.password,
                    temporary: false,
                },
            ],
            enabled: true,
        });
        console.log(`User ${user.username} created.`);
        console.log(u);
        usersCreated.push({...u,...user});
    }

    // Get the role
    const roleUser = await kcAdminClient.roles.findOneByName({ name: 'user' });
    const roleAdmin = await kcAdminClient.roles.findOneByName({ name: 'admin' });


    // Assign role to user
    await kcAdminClient.users.addRealmRoleMappings({
        id: usersCreated[0].id,
        roles: [
            {
                id: roleUser.id,
                name: roleUser.name,
            },
        ],
    });
    console.log(`Role ${roleUser.name} assigned to user ${usersCreated[0].email}.`);

    // Assign role to user
    await kcAdminClient.users.addRealmRoleMappings({
        id: usersCreated[1].id,
        roles: [
            {
                id: roleAdmin.id,
                name: roleAdmin.name,
            },
        ],
    });
    console.log(`Role ${roleAdmin.name} assigned to user ${usersCreated[1].email}.`);


    // 8) Donner à "test2" le droit de créer des utilisateurs dans ce *seul* realm
    //    En Keycloak, il faut lui attribuer le rôle "manage-users" du client "realm-management".
    const realmManagementClients = await kcAdminClient.clients.find({
        clientId: 'realm-management',
    });
    if (!realmManagementClients.length) {
        console.error(`Le client "realm-management" est introuvable dans le realm "${REALM_NAME}".`);
        process.exit(1);
    }

    const realmManagementClient = realmManagementClients[0];
    // Récupérer le rôle "manage-users" du client "realm-management"
    const manageUsersRole = await kcAdminClient.clients.findRole({
        id: realmManagementClient.id,
        roleName: 'manage-users',
    });
    if (!manageUsersRole) {
        console.error(`Le rôle "manage-users" n'existe pas pour "realm-management" dans le realm "${REALM_NAME}".`);
        process.exit(1);
    }

    // Assigner ce rôle à l'utilisateur test2
    await kcAdminClient.users.addClientRoleMappings({
        id: usersCreated[1].id, // test2
        clientUniqueId: realmManagementClient.id,
        roles: [
            { id: manageUsersRole.id, name: manageUsersRole.name },
        ],
    });
    console.log(`Rôle "manage-users" (client "realm-management") assigné à ${usersCreated[1].username}.`);

})();
