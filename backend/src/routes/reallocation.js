const express = require("express");
const router = express.Router();
const {
    getMyReallocationRequests,
    getMyReallocationHistory,
    acceptReallocation,
    rejectReallocation,
    getAllPendingReallocations
} = require("../controllers/reallocationController");
const requireAuth = require("../middlewares/requireAuth");
const requireRole = require("../middlewares/requireRole");

// Coordinator: view pending reallocation suggestions for their events
router.get("/my", requireAuth, requireRole("coordinator"), getMyReallocationRequests);
router.get("/history", requireAuth, requireRole("coordinator"), getMyReallocationHistory);

// Coordinator: respond to a reallocation suggestion
router.patch("/:id/accept", requireAuth, requireRole("coordinator"), acceptReallocation);
router.patch("/:id/reject", requireAuth, requireRole("coordinator"), rejectReallocation);

// Admin: see all outstanding reallocation requests
router.get("/admin/all", requireAuth, requireRole("admin"), getAllPendingReallocations);

module.exports = router;
