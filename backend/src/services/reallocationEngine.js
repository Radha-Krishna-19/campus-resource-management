const Booking = require("../models/booking");
const Room = require("../models/Room");

/**
 * findAlternativeHalls
 * 
 * Scoring Formula (improved over main branch):
 *  - Capacity Match (40%):  ratio of requiredCapacity / roomCapacity
 *    → Penalizes both over-sized and under-sized rooms.
 *    → Score is 1.0 for a perfect match, decreases as waste grows.
 * 
 *  - Floor Proximity (30%): 1 / (1 + floorDistance)
 *    → Prefers rooms on the same floor, degrades smoothly with distance.
 *    → Falls back gracefully when floor data is absent.
 * 
 *  - Utilization Fairness (30%): 1 - (bookingCountLast30Days / maxBookings)
 *    → Prefers rooms that have been used less to distribute load evenly.
 *    → Prevents a single room from absorbing all reallocations.
 * 
 * @param {Object} displacedBooking - Mongoose document of the displaced booking
 * @param {number} [topN=3] - Number of suggestions to return
 * @returns {Array} Sorted list of {hallName, hallCapacity, floor, score}
 */
async function findAlternativeHalls(displacedBooking, topN = 3) {
    const requiredCapacity = displacedBooking.capacity;
    const startTime = displacedBooking.startTime;
    const endTime = displacedBooking.endTime;
    const originalHall = displacedBooking.hall;

    // Extract floor from hall name (e.g. "A-202" → floor 2, "D-404" → floor 4)
    const extractFloor = (name) => {
        const match = name && name.match(/-(\d)/);
        return match ? parseInt(match[1]) : 0;
    };

    const originalFloor = extractFloor(originalHall);
    const originalBlock = originalHall ? originalHall.charAt(0) : null;

    // Fetch all active rooms
    const allRooms = await Room.find({ isActive: true }).lean();

    // 30-day utilization tracking
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookingCounts = await Booking.aggregate([
        {
            $match: {
                startTime: { $gte: thirtyDaysAgo },
                status: { $in: ["approved", "pending"] }
            }
        },
        { $group: { _id: "$hall", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    bookingCounts.forEach(b => { countMap[b._id] = b.count; });
    const maxBookings = Math.max(...Object.values(countMap), 1);

    const scoredRooms = [];

    for (const room of allRooms) {
        // Skip the original hall
        if (room.name === originalHall) continue;

        // Skip rooms that can't fit the attendees
        if (room.capacity < requiredCapacity) continue;

        // Check for time conflict
        const conflict = await Booking.exists({
            hall: room.name,
            status: { $in: ["approved", "pending"] },
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
        });
        if (conflict) continue;

        // --- Scoring ---
        // 1. Capacity Match: penalise over-sized rooms (waste), perfect if equal
        const capacityRatio = requiredCapacity / room.capacity; // 1.0 = perfect, <1.0 = too big
        const capacityScore = capacityRatio; // Higher = better fit

        // 2. Floor Proximity
        const roomFloor = extractFloor(room.name);
        const floorDist = Math.abs(roomFloor - originalFloor);
        const proximityScore = 1 / (1 + floorDist);

        // 3. Block Bonus (same A/B/C/D block = preferred)
        const roomBlock = room.name ? room.name.charAt(0) : null;
        const blockBonus = (roomBlock && originalBlock && roomBlock === originalBlock) ? 0.1 : 0;

        // 4. Utilization Fairness
        const usageCount = countMap[room.name] || 0;
        const utilizationScore = 1 - (usageCount / maxBookings);

        const finalScore =
            (0.40 * capacityScore) +
            (0.30 * proximityScore) +
            (0.30 * utilizationScore) +
            blockBonus;

        scoredRooms.push({
            hallName: room.name,
            hallCapacity: room.capacity,
            floor: roomFloor,
            score: parseFloat(finalScore.toFixed(4))
        });
    }

    // Sort descending by score, take top N
    scoredRooms.sort((a, b) => b.score - a.score);
    return scoredRooms.slice(0, topN);
}

module.exports = { findAlternativeHalls };
