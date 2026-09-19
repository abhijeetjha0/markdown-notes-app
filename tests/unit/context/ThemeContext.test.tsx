import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';

jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn()
}));

jest.mock('@/firebase', () => ({
    db: {}
}));

const TestComponent = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <div>
            <span data-testid="theme-value">{theme}</span>
            <button data-testid="toggle-btn" onClick={toggleTheme}>Toggle</button>
        </div>
    );
};

describe('ThemeContext', () => {
    const mockUseAuth = useAuth as jest.Mock;
    const mockGetDoc = getDoc as jest.Mock;
    const mockSetDoc = setDoc as jest.Mock;
    const mockDoc = doc as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        document.documentElement.removeAttribute("data-bs-theme");
    });

    test('throws error if useTheme is used outside provider', () => {
        // Suppress console.error for expected throw
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const Comp = () => {
            useTheme();
            return null;
        };
        expect(() => render(<Comp />)).toThrow('useTheme must be used within a ThemeProvider');
        consoleSpy.mockRestore();
    });

    test('defaults to light theme when user is not logged in', () => {
        mockUseAuth.mockReturnValue({ user: null });
        
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
        expect(document.documentElement.getAttribute("data-bs-theme")).toBe('light');
    });

    test('loads preference from Firebase when user is logged in', async () => {
        mockUseAuth.mockReturnValue({ user: { uid: 'user123' } });
        mockDoc.mockReturnValue('docRef');
        mockGetDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ theme: 'dark' })
        });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
        });
        expect(document.documentElement.getAttribute("data-bs-theme")).toBe('dark');
        expect(mockGetDoc).toHaveBeenCalledWith('docRef');
    });

    test('defaults to light if Firebase doc does not exist', async () => {
        mockUseAuth.mockReturnValue({ user: { uid: 'user123' } });
        mockDoc.mockReturnValue('docRef');
        mockGetDoc.mockResolvedValue({
            exists: () => false,
            data: () => ({})
        });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(mockGetDoc).toHaveBeenCalled();
        });
        expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    });

    test('handles errors when loading preference', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockUseAuth.mockReturnValue({ user: { uid: 'user123' } });
        mockDoc.mockReturnValue('docRef');
        mockGetDoc.mockRejectedValue(new Error('Network error'));

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error loading theme preference:", expect.any(Error));
        });
        expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
        consoleSpy.mockRestore();
    });

    test('toggles theme and saves to Firebase if logged in', async () => {
        mockUseAuth.mockReturnValue({ user: { uid: 'user123' } });
        mockGetDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ theme: 'light' })
        });
        mockSetDoc.mockResolvedValue(undefined);

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        // Initial load
        await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('light'));

        // Toggle
        act(() => {
            fireEvent.click(screen.getByTestId('toggle-btn'));
        });

        expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
        expect(document.documentElement.getAttribute("data-bs-theme")).toBe('dark');
        expect(mockSetDoc).toHaveBeenCalledWith('docRef', { theme: 'dark' }, { merge: true });
    });

    test('toggles theme without saving if not logged in', async () => {
        mockUseAuth.mockReturnValue({ user: null });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

        // Toggle
        act(() => {
            fireEvent.click(screen.getByTestId('toggle-btn'));
        });

        expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
        expect(mockSetDoc).not.toHaveBeenCalled();
    });

    test('handles errors when saving preference', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockUseAuth.mockReturnValue({ user: { uid: 'user123' } });
        mockGetDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ theme: 'light' })
        });
        mockSetDoc.mockRejectedValue(new Error('Save error'));

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('light'));

        act(() => {
            fireEvent.click(screen.getByTestId('toggle-btn'));
        });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error saving theme preference:", expect.any(Error));
        });
        
        consoleSpy.mockRestore();
    });
});
