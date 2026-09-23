import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../src/services/api';
import HallBookingApprovals from '../../src/pages/HallBookingApprovals';
import { useAuth } from '../../src/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../../src/services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('../../src/context/AuthContext', () => ({
    useAuth: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));
vi.mock('../../src/components/Header', () => ({
    default: () => <div data-testid="mock-header">Header</div>
}));

const mockBookings = [
    {
        _id: 'b1',
        eventTitle: 'AI Seminar',
        hall: 'Main Auditorium',
        startTime: '2026-10-10T10:00:00.000Z',
        endTime: '2026-10-10T12:00:00.000Z',
        capacity: 100,
        facultyName: 'Dr. Turing',
        coordinator: { username: 'Alice' },
        isConflict: false
    },
    {
        _id: 'b2',
        eventTitle: 'React Workshop',
        hall: 'Lab 1',
        startTime: '2026-10-11T14:00:00.000Z',
        endTime: '2026-10-11T16:00:00.000Z',
        capacity: 50,
        facultyName: 'Dr. Hook',
        coordinator: { username: 'Bob' },
        isConflict: true,
        conflictReason: 'Double booking'
    }
];

describe('HallBookingApprovals', () => {
    let mockNavigate;

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate = vi.fn();
        useNavigate.mockReturnValue(mockNavigate);
        useAuth.mockReturnValue({ user: { role: 'admin' } });

        api.get.mockImplementation((url) => {
            if (url === '/bookings/pending') {
                return Promise.resolve({ data: mockBookings });
            }
            return Promise.reject(new Error('not real endpoint'));
        });

        api.patch.mockResolvedValue({ data: { message: 'Success' } });
    });

    it('renders loading state initially then shows bookings', async () => {
        // Delay the mock to test loading state
        let resolveApi;
        const promise = new Promise((resolve) => { resolveApi = resolve; });
        api.get.mockReturnValueOnce(promise);

        render(<HallBookingApprovals />);

        expect(screen.getByText('Loading booking requests...')).toBeInTheDocument();

        // Resolve the API call
        resolveApi({ data: mockBookings });

        await waitFor(() => {
            expect(screen.queryByText('Loading booking requests...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('AI Seminar')).toBeInTheDocument();
        expect(screen.getByText('React Workshop')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // 2 pending requests
        expect(screen.getByText('Conflicting Request')).toBeInTheDocument();
    });

    it('handles empty bookings list', async () => {
        api.get.mockResolvedValueOnce({ data: [] });
        render(<HallBookingApprovals />);

        await waitFor(() => {
            expect(screen.getByText('No Pending Booking Requests')).toBeInTheDocument();
        });
    });

    it('approves a booking successfully', async () => {
        const user = userEvent.setup();
        render(<HallBookingApprovals />);

        await waitFor(() => {
            expect(screen.getByText('AI Seminar')).toBeInTheDocument();
        });

        // Find all Approve buttons and click the first one (for AI Seminar)
        const approveButtons = screen.getAllByRole('button', { name: 'Approve' });
        await user.click(approveButtons[0]);

        expect(api.patch).toHaveBeenCalledWith('/bookings/b1/approve');

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Success');
            // It fetches bookings again
            expect(api.get).toHaveBeenCalledTimes(2);
        });
    });

    it('rejects a booking successfully using the modal', async () => {
        const user = userEvent.setup();
        render(<HallBookingApprovals />);

        await waitFor(() => {
            expect(screen.getByText('AI Seminar')).toBeInTheDocument();
        });

        // Find all Reject buttons and click the first one
        const rejectButtons = screen.getAllByRole('button', { name: 'Reject' });
        await user.click(rejectButtons[0]);

        // Modal appears
        expect(screen.getByText('Reject Booking Request')).toBeInTheDocument();

        // Type reason
        const reasonInput = screen.getByPlaceholderText(/e.g., Hall already booked/i);
        await user.type(reasonInput, 'Maintenance scheduled');

        // Confirm reduction
        const confirmButton = screen.getByRole('button', { name: 'Confirm Reject' });
        await user.click(confirmButton);

        expect(api.patch).toHaveBeenCalledWith('/bookings/b1/reject', { reason: 'Maintenance scheduled' });

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Success');
            expect(screen.queryByText('Reject Booking Request')).not.toBeInTheDocument();
        });
    });
});
