import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../src/services/api';
import AdminDashboard from '../../src/pages/AdminDashboard';
import { useAuth } from '../../src/context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
vi.mock('../../src/services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('../../src/context/AuthContext', () => ({
    useAuth: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));
// Mock Header as a dummy component to avoid testing its internal logic here
vi.mock('../../src/components/Header', () => ({
    default: () => <div data-testid="mock-header">Header</div>
}));

describe('AdminDashboard', () => {
    let mockNavigate;

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate = vi.fn();
        useNavigate.mockReturnValue(mockNavigate);
        useAuth.mockReturnValue({ user: { role: 'admin' } });

        // Mock API responses
        api.get.mockImplementation((url) => {
            if (url === '/auth/stats') {
                return Promise.resolve({
                    data: {
                        totalStudents: 10,
                        totalFaculty: 5,
                        totalAdmins: 2,
                        pendingAdmins: 1,
                        pendingBookings: 3,
                        totalHalls: 15,
                        departments: 4
                    }
                });
            }
            if (url === '/bookings/pending') {
                return Promise.resolve({ data: [] });
            }
            return Promise.reject(new Error('not real endpoint'));
        });
    });

    it('renders dashboard with stats correctly', async () => {
        render(<AdminDashboard />);

        // Header 
        expect(screen.getByTestId('mock-header')).toBeInTheDocument();

        // Page Title
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();

        // Stats should load from API mocked Data
        await waitFor(() => {
            // totalStudents (Coordinators)
            expect(screen.getByText('10')).toBeInTheDocument();
            // totalAdmins
            expect(screen.getByText('2')).toBeInTheDocument();
            // pendingBookings
            expect(screen.getByText('3')).toBeInTheDocument();
            // Rooms (totalHalls)
            expect(screen.getByText('15')).toBeInTheDocument();
        });
    });

    it('navigates when clicking action cards', async () => {
        const user = userEvent.setup();
        render(<AdminDashboard />);

        await waitFor(() => {
            expect(screen.getByText('15')).toBeInTheDocument();
        });

        // Click Rooms stat card
        const roomsCard = screen.getByText('15').closest('.cursor-pointer');
        if (roomsCard) {
            await user.click(roomsCard);
            expect(mockNavigate).toHaveBeenCalledWith('/admin/room-management');
        }

        // Click Quick Links
        const userManagementCard = screen.getByText('User Management');
        await user.click(userManagementCard);
        expect(mockNavigate).toHaveBeenCalledWith('/admin/user-management');

        const hallBookingCard = screen.getByText('Hall Booking Approvals');
        await user.click(hallBookingCard);
        expect(mockNavigate).toHaveBeenCalledWith('/admin/hall-booking-approvals');

        const reportsCard = screen.getByText('Reports');
        await user.click(reportsCard);
        expect(mockNavigate).toHaveBeenCalledWith('/admin/reports');

        const auditLogsCard = screen.getByText('Audit Logs');
        await user.click(auditLogsCard);
        expect(mockNavigate).toHaveBeenCalledWith('/admin/audit-logs');
    });
});
