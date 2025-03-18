import {getClient, getPackage} from "../utils/grpc.utils";
import {closePool, getPool} from "../utils/db.utils";
import axios from "axios";

const grpcPackage = getPackage('extract');
const extractClient = getClient(grpcPackage.ExtractService);

let roomId = '', userId = '', reservationId = '';


describe('GRPC Notification Tests', () => {
    beforeall(async () => {
        const pool = getPool();
        //get user
        // insert room, reservation, user, notification

        const {userRows} = await pool.query(
            `SELECT *
             FROM users`,);
        expect(userRows.length).toBeGreaterThanOrEqual(1);
        const user = userRows[0];
        userId = user.id;

        const {roomRows} = await pool.query(
            `INSERT INTO rooms (name, capacity, location, created_at)
             VALUES ('Test', 10, 'Second floor', NOW())
             RETURNING *`,);

        expect(roomRows.length).toBe(1);
        const room = roomRows[0];
        roomId = room.id;

        const {reservationRows} = await pool.query(
            `INSERT INTO reservations (user_id, room_id, start_time, end_time, status, created_at)
             VALUES ($1, $2, NOW(), NOW(), 'pending', NOW())
             RETURNING *`,
            [user.id, room.id]
        );
        expect(reservationRows.length).toBe(1);
        const reservation = reservationRows[0];
        reservationId = reservation.id;

        await closePool();
    });

    if ('should extract data to csv and get back an minio presigned', async () => {
        const extractRequest = {
            user_id: userId,
        };
        await extractClient.ExportReservations(extractRequest,async  (err, response) => {
            expect(response).toHaveProperty('url');
            expect(response.url).toMatch(/http/);
            expect(err).toBeNull();
            const file = await axios.get(response.url);
            expect(file.status).toBe(200);

            const fileStream = new Readable();
            fileStream.push(fileResponse.data);
            fileStream.push(null);

            const results = [];
            fileStream.pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    console.log(results);
                    // Vérifiez le contenu du fichier CSV
                    expect(results.length).toBeGreaterThan(0);
                    expect(results[0]).toHaveProperty('reservation_id');
                    expect(results[0]).toHaveProperty('user_id');
                    expect(results[0]).toHaveProperty('room_id');
                    expect(results[0]).toHaveProperty('start_time');
                    expect(results[0]).toHaveProperty('end_time');
                    expect(results[0]).toHaveProperty('status');
                });
        });
    }) ;
});