/**
 * Fichier : tests/e2e/rooms.e2e.test.js
 *
 * Objectif : Tester les endpoints CRUD de "rooms" via l'API REST,
 * en récupérant le token Keycloak depuis le beforeAll défini
 * dans setupKeycloak.js
 */

const axios = require('axios');
const { getUsrToken } = require('../setup');

const BASE_URL = process.env.API_REST_URL || 'http://localhost:3000';

describe('Rooms E2E Tests', () => {
    let token;
    let createdRoomId;

    beforeAll(() => {
        // Récupère le token Keycloak initialisé par setupKeycloak.js
        token = getUsrToken();
    });

    it('should create a new room', async () => {
        const response = await axios.post(
            `${BASE_URL}/api/rooms`,
            {
                name: 'Meeting Room #1',
                capacity: 10,
                location: '2nd Floor'
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        createdRoomId = response.data.id;
    });

    it('should get the created room by ID', async () => {
        const response = await axios.get(
            `${BASE_URL}/api/rooms/${createdRoomId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        expect(response.status).toBe(200);
        expect(response.data.name).toBe('Meeting Room #1');
        expect(response.data.capacity).toBe(10);
        expect(response.data.location).toBe('2nd Floor');
    });

    it('should update the room', async () => {
        const response = await axios.put(
            `${BASE_URL}/api/rooms/${createdRoomId}`,
            {
                name: 'Updated Meeting Room',
                capacity: 12
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        expect(response.status).toBe(200);
        expect(response.data.name).toBe('Updated Meeting Room');
        expect(response.data.capacity).toBe(12);
    });

    it('should list rooms (with pagination)', async () => {
        // On utilise skip=0 / limit=10 en exemple
        const response = await axios.get(
            `${BASE_URL}/api/rooms?skip=0&limit=10`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data.rooms)).toBe(true);
    });

    it('should delete the created room', async () => {
        const response = await axios.delete(
            `${BASE_URL}/api/rooms/${createdRoomId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        expect(response.status).toBe(204);
    });

    it('should verify the room is deleted', async () => {
        try {
            await axios.get(
                `${BASE_URL}/api/rooms/${createdRoomId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            throw new Error('Room was not deleted properly');
        } catch (error) {
            // L'API devrait renvoyer une 404 si la ressource n'existe plus
            expect(error.response.status).toBe(404);
        }
    });
});
