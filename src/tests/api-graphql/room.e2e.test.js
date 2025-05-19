require('dotenv').config();
const axios = require('axios');
const {getUsrToken} = require('../setup');
const {graphqlRequest} = require("../utils/graphql.utils");

describe('Rooms E2E Tests', () => {
  let token;
  let createdRoomId;

  beforeAll(() => {
    // Récupère le token Keycloak initialisé par setupKeycloak.js
    token = getUsrToken();
  });

  it('should create a new room', async () => {
    const mutation = `
      mutation CreateRoom($name: String!, $capacity: Int!, $location: String!) {
        createRoom(name: $name, capacity: $capacity, location: $location) {
        id
          name
          capacity
          location
        }
      }
    `;

    const variables = {
      name: 'Salle Test',
      capacity: 15,
      location: 'Bâtiment A',
    };

    const data = await graphqlRequest(mutation, variables, token);

    // Vérifie la réponse
    expect(data.createRoom).toBeDefined();
    expect(data.createRoom.id).toBeDefined();
    expect(data.createRoom.name).toBe(variables.name);
    expect(data.createRoom.capacity).toBe(variables.capacity);
    expect(data.createRoom.location).toBe(variables.location);

    // On stocke l'ID pour la suite des tests
    createdRoomId = data.createRoom.id;
  });

  it('should get the created room by ID', async () => {
    const query = `
      query Room($id: ID!) {
        room(id: $id) {
          id
          name
          capacity
          location
        }
      }
    `;

    const variables = {id: createdRoomId};

    const data = await graphqlRequest(query, variables, token);

    expect(data.room).toBeDefined();
    expect(data.room.id).toBe(createdRoomId);
    expect(data.room.name).toBe('Salle Test');
    expect(data.room.capacity).toBe(15);
    expect(data.room.location).toBe('Bâtiment A');
  });

  it('should update the room', async () => {
    const mutation = `
      mutation UpdateRoom($id: ID!, $name: String, $capacity: Int, $location: String) {
        updateRoom(id: $id, name: $name, capacity: $capacity, location: $location) {
          id
          name
          capacity
          location
        }
      }
    `;

    const variables = {
      id: createdRoomId,
      name: 'Nouvelle Salle Test',
      capacity: 20,
      location: 'Bâtiment B',
    };

    const data = await graphqlRequest(mutation, variables, token);

    expect(data.updateRoom).toBeDefined();
    expect(data.updateRoom.id).toBe(createdRoomId);
    expect(data.updateRoom.name).toBe(variables.name);
    expect(data.updateRoom.capacity).toBe(variables.capacity);
    expect(data.updateRoom.location).toBe(variables.location);
  });

  it('should list rooms (with pagination)', async () => {
    const query = `
      query ListRooms($skip: Int, $limit: Int) {
        listRooms(skip: $skip, limit: $limit) {
          id
          name
          capacity
          location
        }
      }
    `;

    // On veut récupérer 10 salles au plus, en partant de l'offset 0
    const variables = {
      skip: 0,
      limit: 10,
    };

    const data = await graphqlRequest(query, variables, token);

    expect(Array.isArray(data.listRooms)).toBe(true);
    expect(data.listRooms.length).toBeGreaterThan(0);

    // On s’attend à trouver la salle récemment créée/déjà mise à jour
    const found = data.listRooms.find((r) => r.id === createdRoomId);
    expect(found).toBeDefined();
    expect(found.name).toBe('Nouvelle Salle Test');
    expect(found.capacity).toBe(20);
    expect(found.location).toBe('Bâtiment B');
  });

  it('should delete the created room', async () => {
    const mutation = `
      mutation DeleteRoom($id: ID!) {
        deleteRoom(id: $id)
      }
    `;
    const variables = {id: createdRoomId};

    const data = await graphqlRequest(mutation, variables, token);

    expect(data.deleteRoom).toBe(true);
  });

  it('should verify the room is deleted', async () => {
    // should throw a 404
    try {
      const query = `
      query Room($id: ID!) {
        room(id: $id) {
          id
          name
        }
      }
    `;

      const variables = {id: createdRoomId};
      const data = await graphqlRequest(query, variables, token);

    } catch (err) {
      expect(err).toBeDefined();
      // expect array
      expect(Array.isArray(err)).toBe(true);
      expect(err.length).toBe(1);
    }
  });
});
