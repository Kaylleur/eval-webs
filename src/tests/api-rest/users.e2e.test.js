
const axios = require('axios');
const { getToken, getAdminToken} = require('../setup');
const {defaultUser} = require("../utils/user.utils");

const BASE_URL = process.env.API_REST_URL || 'http://localhost:3000';

let token = '', adminToken = '';

describe('Users E2E Tests', () => {
   beforeAll(() => {
       // Récupère le token Keycloak initialisé par setupKeycloak.js
       token = getToken();
       adminToken = getAdminToken();
   });

   let newUserId;

    it('should create a new user', async () => {
        const response = await axios.post(
            `${BASE_URL}/api/users`,
            {
                name: 'John Doe',
                email: 'john.doe@foo.bar',
                firstName: 'John',
                lastName: 'Doe',
                password: 'password'
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });
        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('keycloak_id');
        expect(response.data).toHaveProperty('created_at');
        expect(response.data).toHaveProperty('email');

        newUserId = response.data.id;
    });

    it('should get the created user by ID', async () => {
        const response = await axios.get(
            `${BASE_URL}/api/users/${newUserId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        expect(response.status).toBe(200);
        expect(response.data.name).toBe('John Doe');
        expect(response.data.email).toBe('john.doe@foo.bar');
    });

    it('should retrieve the user in list of users', async () => {
        const response = await axios.get(
            `${BASE_URL}/api/users`,
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
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
                        Authorization: `Bearer ${token}`
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