const {getPackage, getConfig} = require("../utils/grpc.utils");
const {closePool, getPool} = require("../utils/db.utils");

const grpcPackage = getPackage('notification');
const configGrpc = getConfig();
const notificationClient = new grpcPackage.NotificationService(configGrpc.url, configGrpc.insecure);

let roomId = '', userId = '', reservationId = '', notificationId = '';


describe('GRPC Notification Tests', () => {
  beforeAll(async () => {
    const pool = getPool();
    //get user
    // insert room, reservation, user, notification

    const userRes = await pool.query(
      `SELECT *
       FROM "users"`);
    const userRows = userRes.rows;
    expect(userRows).toBeDefined()
    expect(userRows.length).toBeGreaterThanOrEqual(1);
    const user = userRows[0];
    userId = user.id;

    const roomRes = await pool.query(
      `INSERT INTO rooms (name, capacity, location, created_at)
       VALUES ('Test', 10, 'Second floor', NOW())
       RETURNING *`,);
    const roomRows = roomRes.rows;
    expect(roomRows).toBeDefined()

    expect(roomRows.length).toBe(1);
    const room = roomRows[0];
    roomId = room.id;

    const reservationRes = await pool.query(
      `INSERT INTO reservations ("user_id", "room_id", "start_time", "end_time", status, created_at)
       VALUES ($1, $2, NOW(), NOW(), 'pending', NOW())
       RETURNING *`,
      [user.id, room.id]
    );
    const reservationRows = reservationRes.rows;
    expect(reservationRows).toBeDefined()
    expect(reservationRows.length).toBe(1);
    const reservation = reservationRows[0];
    reservationId = reservation.id;


    await closePool();
  });

  it('should create a notification', async () => {
    const notification = {
      "reservationId": reservationId,
      "message": 'Hello World',
      "notificationDate": new Date().toISOString(),
    };
    const createNotification = (notification) => {
      return new Promise((resolve, reject) => {
        notificationClient.CreateNotification(notification, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
    };

// Usage
    const response = await createNotification(notification);
    expect(response).toHaveProperty('id');
    expect(response.reservationId).toBe(reservationId);
    expect(response.message).toBe('Hello World');
    notificationId = response.id;
  });

  it('should update a notification', async () => {
    const notification = {
      "id": notificationId,
      "message": 'World Hello',
      "notificationDate": new Date().toISOString(),
    };

    const updateNotification = (notification) => {
      return new Promise((resolve, reject) => {
        notificationClient.UpdateNotification(notification, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
    };

    // Usage
    const response = await updateNotification(notification);
    expect(response).toHaveProperty('id');
    expect(response.message).toBe('World Hello');
  });

  it('should get a notification by ID', async () => {
    const notification = {
      "id": notificationId
    };

    const getNotification = (notification) => {
      return new Promise((resolve, reject) => {
        notificationClient.GetNotification(notification, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
    };

// Usage
    const response = await getNotification(notification);
    expect(response).toHaveProperty('id');
    expect(response.id).toBe(notificationId);
  });
});