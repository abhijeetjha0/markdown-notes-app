import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';

jest.mock('@/firebase', () => ({
    auth: {},
    googleProvider: {
        setCustomParameters: jest.fn()
    }
}));

jest.mock('firebase/auth', () => ({
    onAuthStateChanged: jest.fn(),
    signInWithPopup: jest.fn(),
    signOut: jest.fn()
}));

const TestComponent = () => {
    const { user, loading, login, logout, switchAccount } = useAuth();
    if (loading) return <div data-testid="loading">Loading...</div>;
    return (
        <div>
            <span data-testid="user-value">{user ? user.uid : 'null'}</span>
            <button data-testid="login-btn" onClick={login}>Login</button>
            <button data-testid="logout-btn" onClick={logout}>Logout</button>
            <button data-testid="switch-btn" onClick={switchAccount}>Switch</button>
        </div>
    );
};

describe('AuthContext', () => {
    const mockOnAuthStateChanged = onAuthStateChanged as jest.Mock;
    const mockSignInWithPopup = signInWithPopup as jest.Mock;
    const mockSignOut = signOut as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('throws error if useAuth is used outside provider', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const Comp = () => {
            useAuth();
            return null;
        };
        expect(() => render(<Comp />)).toThrow('useAuth must be used within an AuthProvider');
        consoleSpy.mockRestore();
    });

    test('shows loading state initially and then renders children', () => {
        // Mock onAuthStateChanged to immediately call the callback
        mockOnAuthStateChanged.mockImplementation((auth, callback) => {
            callback(null);
            return jest.fn(); // unsubscribe function
        });

        render(
            <AuthProvider>
                <div data-testid="child">Child</div>
            </AuthProvider>
        );

        expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    test('sets user on auth state change', () => {
        mockOnAuthStateChanged.mockImplementation((auth, callback) => {
            callback({ uid: 'user123' });
            return jest.fn();
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId('user-value')).toHaveTextContent('user123');
    });

    test('calls signInWithPopup on login', async () => {
        mockOnAuthStateChanged.mockImplementation((auth, callback) => {
            callback(null);
            return jest.fn();
        });
        mockSignInWithPopup.mockResolvedValue({});

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        fireEvent.click(screen.getByTestId('login-btn'));
        expect(mockSignInWithPopup).toHaveBeenCalledWith(auth, googleProvider);
    });

    test('handles login error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockOnAuthStateChanged.mockImplementation((auth, callback) => {
            callback(null);
            return jest.fn();
        });
        mockSignInWithPopup.mockRejectedValue(new Error('Login failed'));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        fireEvent.click(screen.getByTestId('login-btn'));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Error signing in with Google', expect.any(Error));
        });
        consoleSpy.mockRestore();
    });

    test('calls signOut on logout', async () => {
        mockOnAuthStateChanged.mockImplementation((auth, callback) => {
            callback({ uid: 'user123' });
            return jest.fn();
        });
        mockSignOut.mockResolvedValue(undefined);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        fireEvent.click(screen.getByTestId('logout-btn'));
        expect(mockSignOut).toHaveBeenCalledWith(auth);
    });

    test('handles logout error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockOnAuthStateChanged.mockImplementation((auth, callback) => {
            callback({ uid: 'user123' });
            return jest.fn();
        });
        mockSignOut.mockRejectedValue(new Error('Logout failed'));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        fireEvent.click(screen.getByTestId('logout-btn'));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Error signing out', expect.any(Error));
        });
        consoleSpy.mockRestore();
    });

    test('calls signOut and then signInWithPopup with prompt on switchAccount', async () => {
        mockOnAuthStateChanged.mockImplementation((auth, callback) => {
            callback({ uid: 'user123' });
            return jest.fn();
        });
        mockSignOut.mockResolvedValue(undefined);
        mockSignInWithPopup.mockResolvedValue({});

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        fireEvent.click(screen.getByTestId('switch-btn'));

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalledWith(auth);
            expect(googleProvider.setCustomParameters).toHaveBeenCalledWith({ prompt: 'select_account' });
            expect(mockSignInWithPopup).toHaveBeenCalledWith(auth, googleProvider);
        });
    });

    test('handles switchAccount error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockOnAuthStateChanged.mockImplementation((auth, callback) => {
            callback({ uid: 'user123' });
            return jest.fn();
        });
        mockSignOut.mockRejectedValue(new Error('Switch failed'));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        fireEvent.click(screen.getByTestId('switch-btn'));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Error switching account', expect.any(Error));
        });
        consoleSpy.mockRestore();
    });
});
