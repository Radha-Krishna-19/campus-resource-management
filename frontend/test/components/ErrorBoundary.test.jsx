import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from '../../src/components/ErrorBoundary';

const Boom = () => {
    throw new Error('kaboom');
};

describe('ErrorBoundary', () => {
    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <div>All good</div>
            </ErrorBoundary>
        );
        expect(screen.getByText('All good')).toBeInTheDocument();
    });

    it('renders a fallback screen instead of crashing when a child throws', () => {
        // Suppress the expected React error-boundary console noise for this test
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reload app/i })).toBeInTheDocument();

        spy.mockRestore();
    });
});
