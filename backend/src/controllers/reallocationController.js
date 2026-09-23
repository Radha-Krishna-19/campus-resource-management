const ReallocationRequest = require("../models/ReallocationRequest");
const Booking = require("../models/booking");
const { findAlternativeHalls } = require("../services/reallocationEngine");
const { createLog } = require("./auditLogController");
const logger = require("../config/logger");

/**
 * Called internally by approveBooking when an override is approved.
 * Finds alternative halls and creates a ReallocationRequest for Person A.
 *
 * @param {Object} displacedBooking - The booking that was overridden
 * @param {Object} overridingBooking - The booking that won the override
 * @returns {Object} The created ReallocationRequest document
 */
const createReallocationRequest = async (displacedBooking, overridingBooking) => {
    try {
        // Ensure we have IDs in the right format
        const coordId = displacedBooking.coordinator._id || displacedBooking.coordinator;
        const suggestions = await findAlternativeHalls(displacedBooking, 3);

        const request = await ReallocationRequest.create({
            displacedBooking: displacedBooking._id,
            coordinator: coordId,
            overridingBooking: overridingBooking._id,
            suggestions,
            status: "pending",
            triggeredAt: new Date()
        });

        logger.info(
            { requestId: request._id, coordinator: coordId, suggestions: suggestions.length },
            `Reallocation request created for "${displacedBooking.eventTitle}"`
        );
        return request;
    } catch (error) {
        logger.error({ err: error }, "Failed to create reallocation request");
        return null; // Return null so the caller doesn't crash but knows it failed
    }
};

/**
 * GET /api/reallocation/my
 * Coordinator: get all reallocation requests addressed to them
 */
const getMyReallocationRequests = async (req, res) => {
    try {
        const requests = await ReallocationRequest.find({
            coordinator: req.session.user.userId,
            status: "pending"
        })
            .populate("displacedBooking", "eventTitle hall startTime endTime capacity")
            .populate("overridingBooking", "eventTitle facultyName")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching reallocation requests:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * GET /api/reallocation/history
 * Coordinator: get all past reallocation history (accepted/rejected/expired)
 */
const getMyReallocationHistory = async (req, res) => {
    try {
        const requests = await ReallocationRequest.find({
            coordinator: req.session.user.userId,
            status: { $in: ["accepted", "rejected", "expired"] }
        })
            .populate("displacedBooking", "eventTitle hall startTime endTime capacity")
            .populate("overridingBooking", "eventTitle facultyName")
            .sort({ updatedAt: -1 })
            .limit(20)
            .lean();

        return res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching reallocation history:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * PATCH /api/reallocation/:id/accept
 * Coordinator: accept a suggested hall for their displaced booking.
 * Body: { hallName: "A-202" }
 */
const acceptReallocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { hallName } = req.body;

        if (!hallName) {
            return res.status(400).json({ message: "hallName is required" });
        }

        const request = await ReallocationRequest.findOne({
            _id: id,
            coordinator: req.session.user.userId,
            status: "pending"
        });

        if (!request) {
            return res.status(404).json({ message: "Reallocation request not found or already resolved" });
        }

        // Verify the chosen hall is in the suggestion list
        const validSuggestion = request.suggestions.find(s => s.hallName === hallName);
        if (!validSuggestion) {
            return res.status(400).json({ message: "Chosen hall is not in the suggestion list" });
        }

        // Re-check no conflict has appeared since the suggestion was generated
        const displaced = await Booking.findById(request.displacedBooking);
        if (!displaced) {
            return res.status(404).json({ message: "Displaced booking no longer exists" });
        }

        const conflict = await Booking.exists({
            hall: hallName,
            status: { $in: ["approved", "pending"] },
            startTime: { $lt: displaced.endTime },
            endTime: { $gt: displaced.startTime },
            _id: { $ne: displaced._id }
        });

        if (conflict) {
            return res.status(409).json({
                message: `${hallName} is no longer available. Please choose another suggestion or reject and re-book.`
            });
        }

        // Update the displaced booking with the new hall, keeping it approved
        displaced.hall = hallName;
        displaced.status = "approved";
        displaced.rejectionReason = "";
        await displaced.save();

        // Mark reallocation as accepted
        request.status = "accepted";
        request.acceptedHall = hallName;
        await request.save();

        await createLog(
            req.session.user.userId,
            req.session.user.username,
            "REALLOCATION_ACCEPTED",
            "ReallocationRequest",
            request._id,
            `Coordinator accepted reallocation to ${hallName} for event: ${displaced.eventTitle}`
        );

        return res.status(200).json({
            success: true,
            message: `Your event has been moved to ${hallName} successfully.`,
            booking: displaced
        });

    } catch (error) {
        console.error("Error accepting reallocation:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * PATCH /api/reallocation/:id/reject
 * Coordinator: reject all suggestions (prefers to rebook manually)
 * Body: { note: "optional reason" }
 */
const rejectReallocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        const request = await ReallocationRequest.findOne({
            _id: id,
            coordinator: req.session.user.userId,
            status: "pending"
        });

        if (!request) {
            return res.status(404).json({ message: "Reallocation request not found or already resolved" });
        }

        request.status = "rejected";
        request.rejectionNote = note || "Coordinator chose to rebook manually";
        await request.save();

        await createLog(
            req.session.user.userId,
            req.session.user.username,
            "REALLOCATION_REJECTED",
            "ReallocationRequest",
            request._id,
            `Coordinator rejected all reallocation suggestions. Note: ${note || "None"}`
        );

        return res.status(200).json({
            success: true,
            message: "All suggestions rejected. You can make a new booking request from the booking page."
        });

    } catch (error) {
        console.error("Error rejecting reallocation:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * GET /api/reallocation/admin/all
 * Admin: see all pending reallocation requests across all coordinators
 */
const getAllPendingReallocations = async (req, res) => {
    try {
        const requests = await ReallocationRequest.find({ status: "pending" })
            .populate("displacedBooking", "eventTitle hall startTime endTime capacity")
            .populate("overridingBooking", "eventTitle facultyName")
            .populate("coordinator", "username")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching all reallocations:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createReallocationRequest,
    getMyReallocationRequests,
    getMyReallocationHistory,
    acceptReallocation,
    rejectReallocation,
    getAllPendingReallocations
};
