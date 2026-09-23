const { findAlternativeHalls } = require('../../src/services/reallocationEngine');
const Booking = require('../../src/models/booking');
const Room = require('../../src/models/Room');

jest.mock('../../src/models/booking');
jest.mock('../../src/models/Room');

describe('Reallocation Engine Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Ensure methods are mocked as functions
        Room.find = jest.fn();
        Booking.exists = jest.fn();
        Booking.aggregate = jest.fn();
    });

    it('should correctly score rooms based on capacity, floor, and block', async () => {
        // Mock displaced booking: 45 attendees, at A-201 (Floor 2, Block A)
        const mockDisplaced = {
            capacity: 45,
            startTime: new Date('2026-03-10T10:00:00Z'),
            endTime: new Date('2026-03-10T12:00:00Z'),
            hall: 'A-201'
        };

        // Mock rooms
        Room.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { name: 'A-202', capacity: 50, isActive: true },  // Close floor, good capacity match, same block
                { name: 'A-404', capacity: 50, isActive: true },  // High floor, same block
                { name: 'D-202', capacity: 200, isActive: true }  // Same floor, poor capacity match, different block
            ])
        });

        // Mock no conflicts
        Booking.exists.mockResolvedValue(false);

        // Mock utilization (aggregate) - let's say all have 0 bookings
        Booking.aggregate.mockResolvedValue([]);

        const suggestions = await findAlternativeHalls(mockDisplaced, 3);

        expect(suggestions.length).toBe(3);

        // A-202 should be first because it's same floor and better capacity match than others
        expect(suggestions[0].hallName).toBe('A-202');
        expect(suggestions[0].score).toBeGreaterThan(suggestions[1].score);

        // A-202 and A-404 should have block bonus, D-202 should not
        const a202 = suggestions.find(s => s.hallName === 'A-202');
        const d202 = suggestions.find(s => s.hallName === 'D-202');

        // Scoring: 0.4 capacity + 0.3 proximity + 0.3 utilization + 0.1 block bonus
        // A-202: cap=45/50=0.9, prox=1/(1+0)=1.0, util=1.0, block=0.1 -> 0.4*0.9 + 0.3*1.0 + 0.3*1.0 + 0.1 = 1.06
        expect(a202.score).toBeCloseTo(1.06, 2);
    });

    it('should skip rooms with insufficient capacity or conflicts', async () => {
        const mockDisplaced = { capacity: 100, startTime: new Date(), endTime: new Date(), hall: 'B-101' };

        Room.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { name: 'B-102', capacity: 50, isActive: true },  // Too small
                { name: 'B-103', capacity: 150, isActive: true }  // Sufficient
            ])
        });

        Booking.exists.mockResolvedValue(false);
        Booking.aggregate.mockResolvedValue([]);

        const suggestions = await findAlternativeHalls(mockDisplaced, 3);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0].hallName).toBe('B-103');
    });
});
