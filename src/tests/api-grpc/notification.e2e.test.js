import {getClient, getPackage} from "../utils/grpc.utils";
import {closePool, getPool} from "../utils/db.utils";

const grpcPackage = getPackage('notification');
const notificationClient = getClient(grpcPackage.NotificationService);

let roomId = '', userId = '', reservationId = '', notificationId = '';



describe('GRPC Notification Tests', () => {
    beforeall(async () => {
        const pool = getPool();
        //get user
        // insert room, reservation, user, notification

        const {userRows} = await pool.query(
            `SELECT * FROM users`,        );
        expect(userRows.length).toBeGreaterThanOrEqual(1);
        const user = userRows[0];
        userId = user.id;

        const {roomRows} = await pool.query(
            `INSERT INTO rooms (name, capacity, location, created_at)
VALUES ('Test', 10, 'Second floor', NOW())
RETURNING *`,        );

        expect(roomRows.length).toBe(1);
        const room = roomRows[0];
        roomId = room.id;

        const {reservationRows} = await pool.query(
            `INSERT INTO reservations (user_id, room_id, start_time, end_time, status, created_at)
VALUES ($1, $2, NOW(), NOW(), 'pending', NOW()) RETURNING *`,
            [user.id, room.id]
        );
        expect(reservationRows.length).toBe(1);
        const reservation = reservationRows[0];
        reservationId = reservation.id;

        await closePool();
    });

    it('should create a notification', async () => {
        const notification = {
            "reservation_id": reservationId,
            "message": 'Hello World',
            "notification_date": new Date().toISOString(),
        };

        notificationClient.CreateNotification(notification, (err, response) => {
            expect(err).toBeNull();
            expect(response).toHaveProperty('id');
            expect(response.reservation_id).toBe(reservationId);
            expect(response.message).toBe('Hello World');
            notificationId = response.id;
        });
    });

    it('should update a notification', async () => {
        const notification = {
            "id": notificationId,
            "message": 'World Hello',
            "notification_date": new Date().toISOString(),
        };

        notificationClient.UpdateNotification(notification, (err, response) => {
            expect(err).toBeNull();
            expect(response).toHaveProperty('id');
            expect(response.message).toBe('Word Hello');
        });
    });

    it('should get a notification by ID', async () => {
        const notification = {
            "id": notificationId
        };

        notificationClient.GetNotification(notification, (err, response) => {
            expect(err).toBeNull();
            expect(response).toHaveProperty('id');
            expect(response.id).toBe(notificationId);
        });
    });
});