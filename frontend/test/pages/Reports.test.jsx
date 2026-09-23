import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../src/services/api';
import Reports from '../../src/pages/Reports';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
vi.mock('../../src/services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

// Mock Header
vi.mock('../../src/components/Header', () => ({
    default: () => <div data-testid="mock-header">Header</div>
}));

// Mock Recharts to avoid SVG DOM errors in testing environment
vi.mock('recharts', async () => {
    const OriginalRechartsModule = await vi.importActual('recharts');
    return {
        ...OriginalRechartsModule,
        ResponsiveContainer: ({ children }) => <div data-testid="mock-responsive-container">{children}</div>,
        LineChart: () => <div data-testid="mock-line-chart" />,
        BarChart: () => <div data-testid="mock-bar-chart" />,
    };
});

const mockBookings = [
    { _id: '1', hall: 'Room A', eventTitle: 'Math 101', status: 'approved', startTime: '2025-01-01T10:00:00Z', endTime: '2025-01-01T11:00:00Z' },
    { _id: '2', hall: 'Room B', eventTitle: 'Physics Lab', status: 'pending', startTime: '2025-01-02T10:00:00Z', endTime: '2025-01-02T11:00:00Z' },
    { _id: '3', hall: 'Room C', eventTitle: 'Chemistry', status: 'rejected', startTime: '2025-01-03T10:00:00Z', endTime: '2025-01-03T11:00:00Z' },
    { _id: '4', hall: 'Room A', eventTitle: 'Math 102', status: 'approved', startTime: '2025-01-04T10:00:00Z', endTime: '2025-01-04T11:00:00Z' },
];

const mockForecastAndInsights = {
    forecast: [
        { day: 'Monday', expectedBookings: 10 },
        { day: 'Tuesday', expectedBookings: 15 }
    ],
    insights: {
        recommendations: 'Switch more classes to Room B.',
        monopolizationAlerts: 'Room A is being monopolized.',
        efficiencyScore: 82
    }
};

describe('Reports', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useNavigate.mockReturnValue(vi.fn());

        api.get.mockImplementation((url) => {
            if (url === '/forecasting/demand') {
                return Promise.resolve({ data: mockForecastAndInsights });
            }
            if (url === '/bookings') {
                return Promise.resolve({ data: mockBookings });
            }
            return Promise.reject(new Error('not real endpoint'));
        });
    });

    it('renders stats, AI insights, charts, and table correctly', async () => {
        render(<Reports />);

        // Check header and title
        expect(screen.getByTestId('mock-header')).toBeInTheDocument();
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();

        await waitFor(() => {
            // Stats checks (approved: 2, pending: 1, rejected: 1)
            expect(screen.getByText('2')).toBeInTheDocument();
            // Pending
            expect(screen.getAllByText('1')[0]).toBeInTheDocument();
        });

        // Check AI Insights
        expect(screen.getByText('Smart Analytics Insights')).toBeInTheDocument();
        expect(screen.getByText('Strategic Optimization')).toBeInTheDocument();
        expect(screen.getByText('Switch more classes to Room B.')).toBeInTheDocument();
        expect(screen.getByText('Fairness & Monopolization')).toBeInTheDocument();
        expect(screen.getByText('Room A is being monopolized.')).toBeInTheDocument();
        expect(screen.getByText('82/100')).toBeInTheDocument(); // efficiency score

        // Check charts mocked (Total, Dept, Status, Forecast)
        const mockContainers = screen.getAllByTestId('mock-responsive-container');
        expect(mockContainers.length).toBeGreaterThanOrEqual(4);

        // Check Table
        expect(screen.getByText('Math 101')).toBeInTheDocument();
        expect(screen.getByText('Physics Lab')).toBeInTheDocument();
    });

    it('handles empty states gracefully', async () => {
        api.get.mockImplementation((url) => {
            if (url === '/forecasting/demand') {
                return Promise.resolve({ data: { forecast: [], insights: {} } });
            }
            if (url === '/bookings') {
                return Promise.resolve({ data: [] });
            }
            return Promise.reject(new Error('not real endpoint'));
        });

        render(<Reports />);

        await waitFor(() => {
            // Stats should be 0
            expect(screen.getAllByText('0').length).toBeGreaterThan(0);
            expect(screen.getByText('No bookings found in the database.')).toBeInTheDocument();
        });
    });
});
