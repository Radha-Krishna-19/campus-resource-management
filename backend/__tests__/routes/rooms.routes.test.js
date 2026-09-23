const request = require('supertest');
const express = require('express');

// Route-level authorization test: verifies POST/PATCH/DELETE /rooms and
// POST /rooms/seed are actually locked to admins, closing the gap where a
// coordinator (or, for /seed, anyone unauthenticated) could previously
// create/edit/delete/wipe the room inventory.
jest.mock('../../src/controllers/roomController', () => ({
    getRooms: (req, res) => res.status(200).json([]),
    getAllRooms: (req, res) => res.status(200).json([]),
    createRoom: (req, res) => res.status(201).json({ ok: true }),
    updateRoom: (req, res) => res.status(200).json({ ok: true }),
    deleteRoom: (req, res) => res.status(200).json({ ok: true }),
    seedRooms: (req, res) => res.status(201).json({ ok: true })
}));

const roomsRouter = require('../../src/routes/rooms');

function buildApp(sessionUser) {
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        req.session = sessionUser ? { user: sessionUser } : {};
        next();
    });
    app.use('/rooms', roomsRouter);
    return app;
}

const coordinator = { userId: '1', role: 'coordinator', username: 'coord' };
const admin = { userId: '2', role: 'admin', username: 'admin' };

describe('Rooms routes — authorization', () => {
    it('rejects unauthenticated POST /rooms/seed', async () => {
        const app = buildApp(null);
        const res = await request(app).post('/rooms/seed');
        expect(res.status).toBe(401);
    });

    it('rejects a coordinator creating a room', async () => {
        const app = buildApp(coordinator);
        const res = await request(app).post('/rooms').send({ name: 'X-101', capacity: 50 });
        expect(res.status).toBe(403);
    });

    it('rejects a coordinator updating a room', async () => {
        const app = buildApp(coordinator);
        const res = await request(app).patch('/rooms/123').send({ capacity: 60 });
        expect(res.status).toBe(403);
    });

    it('rejects a coordinator deleting a room', async () => {
        const app = buildApp(coordinator);
        const res = await request(app).delete('/rooms/123');
        expect(res.status).toBe(403);
    });

    it('allows an admin to create a room', async () => {
        const app = buildApp(admin);
        const res = await request(app).post('/rooms').send({ name: 'X-101', capacity: 50 });
        expect(res.status).toBe(201);
    });

    it('allows an admin to reseed rooms', async () => {
        const app = buildApp(admin);
        const res = await request(app).post('/rooms/seed');
        expect(res.status).toBe(201);
    });
});
