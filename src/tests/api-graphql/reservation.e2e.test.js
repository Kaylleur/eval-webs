const axios = require('axios');
const { getUsrToken } = require('../setup');
const {createRoom} = require("../utils/room.utils");
const {getPool, closePool} = require("../utils/db.utils");
const {graphqlRequest} = require("../utils/graphql.utils");

const API_REST_URL = process.env.API_REST_URL || 'http://localhost:3000';

describe('Reservations E2E Tests', () => {
    let token;
    let createdRoomId;
    let userId;
    let createdReservationId;

    beforeAll(async () => {
        token = getUsrToken();

        // 1. Créer une salle via l’API REST
        const roomRes = await createRoom({
            base_url: API_REST_URL,
            room: {
                name: 'Meeting Room #1',
                capacity: 10,
                location: '2nd Floor',
            },
            token,
        })
        createdRoomId = roomRes.data.id;

        //console.log(createdRoomId);

        // 2. Récupérer un user existant via l’API REST
        const responseUsers = await axios.get(`${API_REST_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        //console.log(responseUsers.data);
        if (responseUsers.data.users.length === 0) {
            throw new Error('No user found');
        }
        userId = responseUsers.data.users[0].id;
    });

    it('should create a reservation using the created room', async () => {
        const mutation = `
      mutation CreateReservation($user_id: ID!, $room_id: ID!, $start_time: DateTime!, $end_time: DateTime!) {
        createReservation(user_id: $user_id, room_id: $room_id, start_time: $start_time, end_time: $end_time) {
          id
          user_id
          room_id
          start_time
          end_time
        }
      }
    `;

        // Par exemple, on crée une réservation qui commence "maintenant" et finit dans 1 heure
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        const variables = {
            user_id: userId,
            room_id: createdRoomId, // selon comment est géré l'ID
            start_time: now.toISOString(),
            end_time: oneHourLater.toISOString(),
        };


        const data = await graphqlRequest(mutation, variables, token);

        //console.log(data);


        expect(data.createReservation).toBeDefined();
        expect(data.createReservation.id).toBeDefined();
        expect(data.createReservation.user_id).toBe(userId);
        expect(data.createReservation.room_id).toBe(createdRoomId);

        // On stocke l'ID de la réservation pour les tests suivants
        createdReservationId = data.createReservation.id;
    });

    it('should get the created reservation by ID in database', async () => {
        const pool = getPool();
        const {rows} = await pool.query(
            `SELECT * FROM reservations WHERE id = $1`,
            [createdReservationId]
        );
        expect(rows.length).toBe(1);
        expect(rows[0].user_id).toBe(userId);
        expect(rows[0].room_id).toBe(createdRoomId);
        await closePool();
    });

    it('should find a notification in table notifications with this reservation id', async () => {
        const pool = getPool();
        const {rows} = await pool.query(
            `SELECT * FROM notifications WHERE "reservation_id" = $1`,
            [createdReservationId]
        );
        expect(rows.length).toBe(1);
        await closePool();
    });

    it('should get the created reservation by ID', async () => {
        const query = `
      query Reservation($id: ID!) {
        reservation(id: $id) {
          id
          user_id
          room_id
          start_time
          end_time
        }
      }
    `;

        const variables = { id: createdReservationId };
        const data = await graphqlRequest(query, variables, token);

        expect(data.reservation).toBeDefined();
        expect(data.reservation.id).toBe(createdReservationId);
        expect(data.reservation.user_id).toBe(userId);
        expect(data.reservation.room_id).toBe(createdRoomId);
    });

    it('should update the reservation times', async () => {
        const mutation = `
      mutation UpdateReservation($id: ID!, $start_time: DateTime, $end_time: DateTime) {
        updateReservation(id: $id, start_time: $start_time, end_time: $end_time) {
          id
          user_id
          room_id
          start_time
          end_time
        }
      }
    `;

        // Nouvelle plage horaire: on décale de 2h
        const newStart = new Date();
        newStart.setHours(newStart.getHours() + 2);

        const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);

        const variables = {
            id: createdReservationId,
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
        };

        const data = await graphqlRequest(mutation, variables, token);

        expect(data.updateReservation).toBeDefined();
        expect(data.updateReservation.id).toBe(createdReservationId);
        expect(data.updateReservation.start_time).toBe(newStart.toISOString());
        expect(data.updateReservation.end_time).toBe(newEnd.toISOString());
    });

    it('should list reservations (with pagination)', async () => {
        const query = `
      query ListReservations($skip: Int, $limit: Int) {
        listReservations(skip: $skip, limit: $limit) {
          id
          user_id
          room_id
          start_time
          end_time
        }
      }
    `;

        const variables = { skip: 0, limit: 10 };
        const data = await graphqlRequest(query, variables, token);

        expect(Array.isArray(data.listReservations)).toBe(true);
        expect(data.listReservations.length).toBeGreaterThan(0);

        // On doit trouver la réservation créée
        const found = data.listReservations.find(
            (r) => r.id === createdReservationId
        );
        expect(found).toBeDefined();
        expect(found.user_id).toBe(userId);
        expect(found.room_id).toBe(createdRoomId);
    });

    it('should delete the created reservation', async () => {
        const mutation = `
      mutation DeleteReservation($id: ID!) {
        deleteReservation(id: $id)
      }
    `;

        const variables = { id: createdReservationId };
        const data = await graphqlRequest(mutation, variables, token);

        // La mutation deleteReservation retourne un Boolean!
        expect(data.deleteReservation).toBe(true);
    });

    it('should verify the reservation is deleted', async () => {
        const query = `
      query Reservation($id: ID!) {
        reservation(id: $id) {
          id
        }
      }
    `;

        const variables = { id: createdReservationId };
        const data = await graphqlRequest(query, variables, token);

        // Si la réservation a été supprimée, on s'attend à ce que ce soit "null"
        expect(data.reservation).toBeNull();
    });
});
