const mongoose = require("mongoose");

const reallocationRequestSchema = new mongoose.Schema(
    {
        // The original booking that was displaced by an override
        displacedBooking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true
        },
        // The coordinator who owned the displaced booking (Person A)
        coordinator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        // The new booking that overrode Person A (Person B's booking)
        overridingBooking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true
        },
        // Top alternative room suggestions from the engine
        suggestions: [
            {
                hallName: { type: String, required: true },
                hallCapacity: { type: Number },
                floor: { type: String },
                score: { type: Number }
            }
        ],
        // The hall that was actually chosen (after accept)
        acceptedHall: {
            type: String,
            default: null
        },
        // Overall request status
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "expired"],
            default: "pending"
        },
        // Optional: reason if coordinator rejects all suggestions
        rejectionNote: {
            type: String,
            default: ""
        },
        // When did the admin approve the override that triggered this?
        triggeredAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ReallocationRequest", reallocationRequestSchema);
