// Tests the deterministic (chrono-node + regex) fallback path only — the
// Gemini path isn't unit-testable without live credentials, and
// parseBookingText() already falls back to this when GEMINI_API_KEY is unset.
jest.mock('../../src/models/Room', () => ({
    find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([{ name: 'Seminar Hall A' }, { name: 'A-202' }])
        })
    })
}));

const {
    ruleBasedParse,
    detectCapacity,
    detectEventType
} = require('../../src/services/nlpBookingParser');

describe('nlpBookingParser — deterministic fallback', () => {
    beforeEach(() => {
        delete process.env.GEMINI_API_KEY;
    });

    it('extracts capacity from "for N people" phrasing', () => {
        expect(detectCapacity('Book a hall for 60 people tomorrow')).toBe(60);
    });

    it('extracts capacity from "N students" phrasing', () => {
        expect(detectCapacity('Need space for 45 students')).toBe(45);
    });

    it('returns null capacity when none is mentioned', () => {
        expect(detectCapacity('Book a hall tomorrow at 2pm')).toBeNull();
    });

    it('classifies event type from keywords', () => {
        expect(detectEventType('Guest lecture for external visitors')).toBe('External');
        expect(detectEventType('Department staff meeting')).toBe('Internal');
        expect(detectEventType('A seminar on machine learning')).toBe('Academic');
    });

    it('produces a full draft with date/time/capacity for a well-formed request', async () => {
        const draft = await ruleBasedParse('Book Hall A for 60 people tomorrow 2pm to 4pm for a seminar');
        expect(draft.source).toBe('rule-based');
        expect(draft.capacity).toBe(60);
        expect(draft.date).toBeTruthy();
        expect(draft.startTime).toBe('14:00');
        expect(draft.endTime).toBe('16:00');
        expect(draft.eventType).toBe('Academic');
    });

    it('defaults to a 1-hour slot when no end time is mentioned', async () => {
        const draft = await ruleBasedParse('Book a hall for 20 people tomorrow at 9am');
        expect(draft.startTime).toBe('09:00');
        expect(draft.endTime).toBe('10:00');
    });

    it('returns low confidence when almost nothing could be extracted', async () => {
        const draft = await ruleBasedParse('need a room sometime');
        expect(draft.confidence).toBe('low');
    });
});
