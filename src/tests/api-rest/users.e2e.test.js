const axios = require('axios');
const {getUsrToken, getAdmToken, getAdminToken, verifyJwtToken} = require('../setup');
const {defaultUser} = require("../utils/user.utils");

const BASE_URL = process.env.API_REST_URL || 'http://localhost:3000';

let usrToken = '',admToken= '', adminToken = '';
let timestamp = new Date().getTime();

describe('Users E2E Tests', () => {
  beforeAll(async () => {
    // Récupère le token Keycloak initialisé par setupKeycloak.js
    usrToken = getUsrToken();
    expect(usrToken).toBeDefined();
    const decoded = await verifyJwtToken(usrToken);
    expect(decoded).toHaveProperty('email');

    admToken = getAdmToken();
    expect(admToken).toBeDefined();
    const admDecoded = await verifyJwtToken(admToken);
    expect(admDecoded).toHaveProperty('email');

    adminToken = getAdminToken();
    expect(adminToken).toBeDefined();
  });

  let newUserId;

  it('should create a new user', async () => {

    try {
      const response = await axios.post(
        `${BASE_URL}/api/users`,
        {
          email: `john.doe_${timestamp}@foo.bar`,
          password: 'password',
          username: `john_doe_${timestamp}`,
          firstName: "john",
          lastName: "doe",
        },
        {
          headers: {
            Authorization: `Bearer ${admToken}`
          }
        });
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('keycloakId');
      expect(response.data).toHaveProperty('createdAt');
      expect(response.data).toHaveProperty('email');

      newUserId = response.data.id;
      //console.log(response.data);
      //console.log(newUserId);
    } catch (err) {
      console.error(err);
      console.error('Error creating user:', err.response.data);
      throw err;
    }

  });

  it('should get the created user by ID', async () => {
    const response = await axios.get(
      `${BASE_URL}/api/users/${newUserId}`,
      {
        headers: {
          Authorization: `Bearer ${usrToken}`
        }
      }
    );
    expect(response.status).toBe(200);
    expect(response.data.email).toBe(`john.doe_${timestamp}@foo.bar`);
  });

  it('should retrieve the user in list of users', async () => {
    const response = await axios.get(
      `${BASE_URL}/api/users`,
      {
        headers: {
          Authorization: `Bearer ${usrToken}`
        }
      }
    );
    expect(response.status).toBe(200);
    expect(response.data.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: newUserId
        })
      ])
    );
  });

  it('should get a 403 error when creating user with basic token', async () => {
    try {
      await axios.post(
        `${BASE_URL}/api/users`,
        defaultUser,
        {
          headers: {
            Authorization: `Bearer ${usrToken}`
          }
        });
    } catch (err) {
      expect(err.response.status).toBe(403);
    }
  });

  it('should get a 401 error when creating user without token', async () => {
    try {
      await axios.post(
        `${BASE_URL}/api/users`,
        defaultUser
      );
    } catch (err) {
      expect(err.response.status).toBe(401);
    }
  });
});