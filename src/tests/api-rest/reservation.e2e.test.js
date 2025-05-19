const axios = require('axios');
const {getUsrToken} = require('../setup');
const {createRoom, defaultRoom} = require("../utils/room.utils");
const {getUsers} = require("../utils/user.utils");
const {getPool, closePool} = require("../utils/db.utils");
const { Readable } = require('stream');
  const csv = require('csv-parser');


const BASE_URL = process.env.API_REST_URL;

describe('Reservations E2E Tests', () => {
  let token;
  let createdRoomId;
  let userId;

  beforeAll(async () => {
    token = getUsrToken();

    const roomRes = await createRoom({
      base_url: process.env.API_REST_URL,
      room: defaultRoom,
      token
    });
    createdRoomId = roomRes.data.id;

    const usersRes = await getUsers({
      base_url: process.env.API_REST_URL,
      token
    });
    userId = usersRes.data.users[0].id;
  });

  it('should create a reservation using the created room', async () => {
    // Exemple d'utilisation
    const response = await axios.post(
      `${process.env.API_REST_URL}/api/reservations`,
      {
        user_id: userId,
        room_id: createdRoomId,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T12:00:00Z',
        status: 'pending'
      },
      {
        headers: {Authorization: `Bearer ${token}`}
      }
    );

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    createdReservationId = response.data.id;
    expect(response.data.user.id).toBe(userId);
    expect(response.data.room.id).toBe(createdRoomId);
    expect(response.data.startTime).toMatch(/2025-06-01T10:00:00.000Z/);
    expect(response.data.endTime).toMatch(/2025-06-01T12:00:00.000Z/);
    expect(response.data.status).toBe('pending');
  });

  it('should get the created reservation by ID in database', async () => {
    const pool = getPool();
    const {rows} = await pool.query(
      `SELECT *
       FROM reservations
       WHERE id = $1`,
      [createdReservationId]
    )
    expect(rows).toBeDefined()
    expect(rows.length).toBe(1);
    expect(rows[0].user_id).toBe(userId);
    expect(rows[0].room_id).toBe(createdRoomId);
    await closePool();
  });

  it('should find a notification in table notifications with this reservation id', async () => {
    const pool = getPool();
    const {rows} = await pool.query(
      `SELECT *
       FROM notifications
       WHERE "reservation_id" = $1`,
      [createdReservationId]
    );

    expect(rows.length).toBe(1);
    await closePool();
  });

  it('should get the created reservation by ID', async () => {
    const response = await axios.get(
      `${BASE_URL}/api/reservations/${createdReservationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.id).toBe(createdReservationId);
    expect(response.data.user.id).toBe(userId);
    expect(response.data.room.id).toBe(createdRoomId);
  });

  it('should update the reservation times and status', async () => {
    const response = await axios.put(
      `${BASE_URL}/api/reservations/${createdReservationId}`,
      {
        startTime: '2025-06-02T10:00:00Z',
        endTime: '2025-06-02T12:00:00Z',
        status: 'approved'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    expect(response.status).toBe(200);
    expect(response.data.id).toBe(createdReservationId);
    expect(response.data.startTime).toMatch("2025-06-02T10:00:00.000Z");
    expect(response.data.endTime).toMatch("2025-06-02T12:00:00.000Z");
    expect(response.data.status).toBe('approved');
  });


  it('should find a new notification in table notifications with this reservation id', async () => {
    const pool = getPool();
    const {rows} = await pool.query(
      `SELECT *
       FROM notifications
       WHERE "reservation_id" = $1`,
      [createdReservationId]
    );
    expect(rows).toBeDefined()
    expect(rows.length).toBe(2);
    await closePool();
  });

  it('should list reservations (with pagination)', async () => {
    // On utilise skip=0 / limit=10 à titre d’exemple
    const response = await axios.get(
      `${BASE_URL}/api/reservations?skip=0&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);

    // Optionnel : vérifier si la réservation qu’on vient de créer est dans la liste
    // par exemple en cherchant son ID
    const found = response.data.some(
      (r) => r.id === createdReservationId
    );
    expect(found).toBe(true);
  });

  it('should extract as csv and get the url of the file', async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/users/${userId}/extract`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('url');
      //download url
      const url = response.data.url;
      //get the file


      //console.log('response.data',response.data);
      //console.log('url', url);
      const file = await axios.get(url);
      //console.log(file.status);
      expect(file.status).toBe(200);

      const fileStream = new Readable();
      fileStream.push(file.data);
      fileStream.push(null);

      const results = [];
      fileStream.pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          //console.log(results);
          // Vérifiez le contenu du fichier CSV
          expect(results.length).toBeGreaterThan(0);
          expect(results[0]).toHaveProperty('reservationId');
          expect(results[0]).toHaveProperty('userId');
          expect(results[0]).toHaveProperty('roomId');
          expect(results[0]).toHaveProperty('startTime');
          expect(results[0]).toHaveProperty('endTime');
          expect(results[0]).toHaveProperty('status');
        });
    } catch (err) {
      // //console.log(err);
      throw err;
    }
  });

  it('should delete the created reservation', async () => {
    const response = await axios.delete(
      `${BASE_URL}/api/reservations/${createdReservationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    expect(response.status).toBe(204);
  });

  it('should verify the reservation is deleted', async () => {
    try {
      await axios.get(
        `${BASE_URL}/api/reservations/${createdReservationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      throw new Error('Reservation was not deleted properly');
    } catch (error) {
      // L'API devrait renvoyer une 404 si la ressource n’existe plus
      expect(error.response.status).toBe(404);
    }
  });
});