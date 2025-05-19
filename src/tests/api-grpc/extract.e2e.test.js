const {getPackage, getConfig} = require("../utils/grpc.utils");
const {closePool, getPool} = require("../utils/db.utils");
const axios = require("axios")

const grpcPackage = getPackage('notification');
const { Readable } = require('stream');
const configGrpc = getConfig();
const csv = require('csv-parser');
const exportService = new grpcPackage.ExportService(configGrpc.url, configGrpc.insecure);

let roomId = '', userId = '', reservationId = '';


describe('GRPC Notification Tests', () => {
    beforeAll(async () => {
      const pool = getPool();
      //get user
      // insert room, reservation, user, notification

      const userRes = await pool.query(
        `SELECT * FROM "users"`);
      const userRows = userRes.rows;
      expect(userRows).toBeDefined()
      expect(userRows.length).toBeGreaterThanOrEqual(1);
      const user = userRows[0];
      userId = user.id;

      const roomRes = await pool.query(
        `INSERT INTO rooms (name, capacity, location, created_at)
VALUES ('Test', 10, 'Second floor', NOW())
RETURNING *`,        );
      const roomRows = roomRes.rows;
      expect(roomRows).toBeDefined()

      expect(roomRows.length).toBe(1);
      const room = roomRows[0];
      roomId = room.id;

      const reservationRes = await pool.query(
        `INSERT INTO reservations (user_id, room_id, start_time, end_time, status, created_at)
VALUES ($1, $2, NOW(), NOW(), 'pending', NOW()) RETURNING *`,
        [user.id, room.id]
      );
      const reservationRows = reservationRes.rows;
      expect(reservationRows).toBeDefined()
      expect(reservationRows.length).toBe(1);
      const reservation = reservationRows[0];
      reservationId = reservation.id;

      await closePool();
    });

    it('should extract data to csv and get back an minio presigned', async () => {
        const extractRequest = {
            userId,
        };
        await exportService.ExportReservations(extractRequest,async  (err, response) => {
            expect(response).toHaveProperty('url');
            expect(response.url).toMatch(/http/);
            expect(err).toBeNull();
            const file = await axios.get(response.url);
            expect(file.status).toBe(200);

            const fileStream = new Readable();
            fileStream.push(file.data);
            fileStream.push(null);

            const results = [];
            fileStream.pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    // Vérifiez le contenu du fichier CSV
                    expect(results.length).toBeGreaterThan(0);
                    expect(results[0]).toHaveProperty('reservationId');
                    expect(results[0]).toHaveProperty('userId');
                    expect(results[0]).toHaveProperty('roomId');
                    expect(results[0]).toHaveProperty('startTime');
                    expect(results[0]).toHaveProperty('endTime');
                    expect(results[0]).toHaveProperty('status');
                });
        });
    }) ;
});