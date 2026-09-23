const express = require("express");
const {
  createBooking,
  getMyBookings,
  getAvailability,
  getPendingBookings,
  getAllBookings,
  approveBooking,
  rejectBooking,
  recommendRooms,
  cancelBooking,
  parseBooking
} = require("../controllers/bookingController");
const requireAuth = require("../middlewares/requireAuth");
const requireRole = require("../middlewares/requireRole");
const validate = require("../middlewares/validate");
const { createBookingSchema, parseBookingTextSchema } = require("../schemas");

const router = express.Router();

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Coordinator creates a booking request
 *     tags: [Bookings]
 *     responses:
 *       201: { description: Booking created }
 *       409: { description: Hall already booked (conflict) }
 */
router.post("/", requireAuth, requireRole("coordinator"), validate(createBookingSchema), createBooking);

/**
 * @swagger
 * /bookings/parse:
 *   post:
 *     summary: Parse a free-text booking request (NLP) into structured draft fields
 *     tags: [Bookings]
 *     responses:
 *       200: { description: "Structured draft: hall, capacity, date, startTime, endTime, eventType" }
 */
router.post("/parse", requireAuth, requireRole("coordinator"), validate(parseBookingTextSchema), parseBooking);

router.get("/my", requireAuth, requireRole("coordinator"), getMyBookings);
router.get("/availability", requireAuth, requireRole("coordinator"), getAvailability);
router.post("/recommend", requireAuth, requireRole("coordinator"), recommendRooms);
router.patch("/:id/cancel", requireAuth, requireRole("coordinator"), cancelBooking);

// Admin views and manages bookings
router.get("/pending", requireAuth, requireRole("admin"), getPendingBookings);
router.get("/", requireAuth, requireRole("admin"), getAllBookings);
router.patch("/:id/approve", requireAuth, requireRole("admin"), approveBooking);
router.patch("/:id/reject", requireAuth, requireRole("admin"), rejectBooking);

module.exports = router;
