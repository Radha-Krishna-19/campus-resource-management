import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../src/services/api';
import NewBooking from '../../src/pages/NewBooking';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../../src/services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
    useLocation: vi.fn(() => ({ search: '' })),
}));
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

// Mock Header
vi.mock('../../src/components/Header', () => ({
    default: () => <div data-testid="mock-header">Header</div>
}));

describe('NewBooking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useNavigate.mockReturnValue(vi.fn());

        api.get.mockImplementation((url) => {
            if (url === '/rooms') {
                return Promise.resolve({ data: [{ _id: '1', name: 'Room B', capacity: 100 }] });
            }
            return Promise.reject(new Error('not real endpoint: ' + url));
        });

        api.post.mockImplementation((url) => {
            if (url === '/bookings/recommend') {
                return Promise.resolve({ data: { rooms: [{ _id: '1', name: 'Room B', capacity: 100 }], aiMessage: 'AI Suggests Room B' } });
            }
            if (url === '/bookings') {
                return Promise.resolve({ data: { message: 'Booking request submitted successfully!' } });
            }
            if (url === '/bookings/parse') {
                return Promise.resolve({
                    data: {
                        draft: { hall: 'Room B', capacity: 60, date: '2026-10-10', startTime: '14:00', endTime: '16:00', eventType: 'Academic' }
                    }
                });
            }
            return Promise.reject(new Error('not real endpoint'));
        });
    });

    it('renders form correctly', () => {
        render(<NewBooking />);
        expect(screen.getByText('New Hall Booking Request')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Dr. John Doe')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Guest Lecture on AI')).toBeInTheDocument();
    });

    it('pre-fills the form from the NLP booking assistant', async () => {
        const user = userEvent.setup();
        render(<NewBooking />);

        const nlpInput = screen.getByPlaceholderText(/Need a hall for 40 people/i);
        await user.type(nlpInput, 'Book Hall B for 60 people this Friday 2 to 4pm for a seminar');
        await user.click(screen.getByRole('button', { name: /fill form/i }));

        expect(api.post).toHaveBeenCalledWith('/bookings/parse', {
            text: 'Book Hall B for 60 people this Friday 2 to 4pm for a seminar'
        });

        await waitFor(() => {
            expect(screen.getByDisplayValue('60')).toBeInTheDocument();
        });
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Auto-filled'));
    });

    it('validates required fields on submit', async () => {
        const user = userEvent.setup();
        render(<NewBooking />);

        // Attempt submit with empty form bypassing HTML5 required attribute
        const form = document.querySelector('form');
        fireEvent.submit(form);

        expect(toast.error).toHaveBeenCalledWith('Please fix the errors in the form');
        expect(screen.getByText('Faculty name is required')).toBeInTheDocument();
        expect(screen.getByText('Event title is required')).toBeInTheDocument();
        expect(screen.getByText('Start time is required')).toBeInTheDocument();
    });

    it('submits successfully with valid data', async () => {
        const user = userEvent.setup();
        render(<NewBooking />);

        // Fill form
        await user.type(screen.getByPlaceholderText('Dr. John Doe'), 'Alice Smith');
        await user.type(screen.getByPlaceholderText('Guest Lecture on AI'), 'React Conf');

        // Type capacity to trigger recommendations
        const capacityInput = screen.getByPlaceholderText('e.g., 50');
        await user.type(capacityInput, '100');

        // Date/Time
        const dateInput = document.querySelector('input[type="date"]');
        const timeInputs = document.querySelectorAll('input[type="time"]'); // Start and End

        // We can use fireEvent to reliably set date and time inputs in jsdom
        fireEvent.change(dateInput, { target: { value: '2026-10-10' } });
        fireEvent.change(timeInputs[0], { target: { value: '10:00' } });
        fireEvent.change(timeInputs[1], { target: { value: '12:00' } });

        // Wait for AI recommendation component to appear due to capacity change
        await waitFor(() => {
            expect(screen.getByText('AI Suggests Room B')).toBeInTheDocument();
        }, { timeout: 2000 });

        // Click the suggested room card
        const roomCard = screen.getByText('Room B');
        await user.click(roomCard);

        const form = document.querySelector('form');
        fireEvent.submit(form);

        expect(api.post).toHaveBeenCalledWith('/bookings', expect.objectContaining({
            facultyName: 'Alice Smith',
            eventTitle: 'React Conf',
            capacity: 100,
            hall: 'Room B',
            startTime: '10:00',
            endTime: '12:00'
        }));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Booking request submitted successfully!');
        });
    });

    it('shows conflict modal if 409 is returned', async () => {
        api.post.mockImplementation((url) => {
            if (url.includes('/bookings/recommend')) {
                return Promise.resolve({ data: { rooms: [{ _id: '1', name: 'Room B', capacity: 100 }], aiMessage: 'AI Suggests Room B' } });
            }
            if (url.endsWith('/bookings')) {
                return Promise.reject({
                    response: { status: 409, data: { conflict: true } }
                });
            }
            return Promise.reject(new Error('not real endpoint: ' + url));
        });

        const user = userEvent.setup();
        render(<NewBooking />);

        // Fill basic required fields for validation to pass
        await user.type(screen.getByPlaceholderText('Dr. John Doe'), 'Bob');
        await user.type(screen.getByPlaceholderText('Guest Lecture on AI'), 'Vue Conf');
        await user.type(screen.getByPlaceholderText('e.g., 50'), '20');

        fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-10-10' } });
        const timeInputs = document.querySelectorAll('input[type="time"]');
        fireEvent.change(timeInputs[0], { target: { value: '10:00' } });
        fireEvent.change(timeInputs[1], { target: { value: '12:00' } });

        // We must select a room because it's required now
        await waitFor(() => {
            expect(screen.getByText('AI Suggests Room B')).toBeInTheDocument();
        }, { timeout: 2000 });
        await user.click(screen.getByText('Room B'));

        const form = document.querySelector('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByText('Hall Already Booked')).toBeInTheDocument();
        });
    });
});
