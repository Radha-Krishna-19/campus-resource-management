const express = require("express");
const { getRooms, getAllRooms, createRoom, updateRoom, deleteRoom, seedRooms } = require("../controllers/roomController");
const requireAuth = require("../middlewares/requireAuth");
const requireRole = require("../middlewares/requireRole");
const validate = require("../middlewares/validate");
const { roomSchema, roomUpdateSchema } = require("../schemas");

const router = express.Router();

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: List active rooms (used by coordinators for booking)
 *     tags: [Rooms]
 *     responses:
 *       200: { description: Array of active rooms }
 */
router.get("/", requireAuth, getRooms);

/**
 * @swagger
 * /rooms/all:
 *   get:
 *     summary: List all rooms including inactive ones (admin management)
 *     tags: [Rooms]
 *     responses:
 *       200: { description: Array of all rooms }
 */
router.get("/all", requireAuth, requireRole("admin"), getAllRooms);

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Create a room (admin only)
 *     tags: [Rooms]
 *     responses:
 *       201: { description: Room created }
 */
router.post("/", requireAuth, requireRole("admin"), validate(roomSchema), createRoom);

/**
 * @swagger
 * /rooms/{id}:
 *   patch:
 *     summary: Update a room (admin only)
 *     tags: [Rooms]
 *     responses:
 *       200: { description: Room updated }
 */
router.patch("/:id", requireAuth, requireRole("admin"), validate(roomUpdateSchema), updateRoom);

/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     summary: Permanently delete a room (admin only)
 *     tags: [Rooms]
 *     responses:
 *       200: { description: Room deleted }
 */
router.delete("/:id", requireAuth, requireRole("admin"), deleteRoom);

/**
 * @swagger
 * /rooms/seed:
 *   post:
 *     summary: Reseed the room inventory (admin only, destructive)
 *     tags: [Rooms]
 *     responses:
 *       201: { description: Rooms reseeded }
 */
router.post("/seed", requireAuth, requireRole("admin"), seedRooms);

module.exports = router;
