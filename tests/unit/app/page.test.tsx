import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '@/app/page';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getDoc, setDoc, doc } from 'firebase/firestore';

jest.mock('@/context/AuthContext');
jest.mock('@/context/ThemeContext');
jest.mock('@/firebase', () => ({
    db: {}
}));
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn()
}));

jest.mock('@/components/NotesDashboard', () => {
    return ({ searchQuery, sidebarCollapsed, layoutView, setSidebarCollapsed }: any) => (
        <div data-testid="notes-dashboard">
            <span data-testid="search-query">{searchQuery}</span>
            <span data-testid="sidebar-collapsed">{sidebarCollapsed ? 'true' : 'false'}</span>
            <span data-testid="layout-view">{layoutView}</span>
            <button onClick={() => setSidebarCollapsed(true)}>Collapse Sidebar</button>
        </div>
    );
});

jest.mock('@/components/UserMenu', () => {
    return () => <div data-testid="user-menu">UserMenu</div>;
});

jest.mock('@/components/HelpModal', () => {
    return ({ show, onHide }: any) => (
        <div data-testid={`help-modal-${show}`}>
            <button onClick={onHide}>Hide Help</button>
        </div>
    );
});

describe('Home Page', () => {
    const mockLogin = jest.fn();
    const mockToggleTheme = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (useAuth as jest.Mock).mockReturnValue({
            user: { uid: 'user-1' },
            loading: false,
            login: mockLogin
        });

        (useTheme as jest.Mock).mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme
        });

        (doc as jest.Mock).mockReturnValue('mock-doc-ref');
        
        (getDoc as jest.Mock).mockResolvedValue({
            exists: () => true,
            data: () => ({ layoutView: 'grid' })
        });

        (setDoc as jest.Mock).mockResolvedValue(undefined);

        // Mock window innerWidth and dispatch resize events
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024
        });
    });

    test('shows loading spinner when auth is loading', () => {
        (useAuth as jest.Mock).mockReturnValue({ user: null, loading: true });
        const { container } = render(<Home />);
        expect(container.querySelector('.spinner-border')).toBeInTheDocument();
    });

    test('shows sign in page when user is null', () => {
        (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false, login: mockLogin });
        render(<Home />);
        
        expect(screen.getByText('Markdown Notes')).toBeInTheDocument();
        expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Sign in with Google'));
        expect(mockLogin).toHaveBeenCalled();

        // Help modal can be opened from login screen
        expect(screen.getByTestId('help-modal-false')).toBeInTheDocument();
        fireEvent.click(screen.getByTitle('Help'));
        expect(screen.getByTestId('help-modal-true')).toBeInTheDocument();
    });

    test('loads user preference on mount', async () => {
        await act(async () => {
            render(<Home />);
        });
        
        await waitFor(() => {
            expect(getDoc).toHaveBeenCalledWith('mock-doc-ref');
            expect(screen.getByTestId('layout-view')).toHaveTextContent('grid');
        });
    });

    test('handles layout toggle and saves preference', async () => {
        (getDoc as jest.Mock).mockResolvedValue({ exists: () => false }); // Default to 'list'
        await act(async () => {
            render(<Home />);
        });
        
        await waitFor(() => {
            expect(screen.getByTestId('layout-view')).toHaveTextContent('list');
        });

        const toggleBtn = screen.getByTitle('Switch to grid view');
        fireEvent.click(toggleBtn);
        
        await waitFor(() => {
            expect(screen.getByTestId('layout-view')).toHaveTextContent('grid');
            expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', { layoutView: 'grid' }, { merge: true });
        });
    });

    test('toggles theme', async () => {
        await act(async () => {
            render(<Home />);
        });
        const themeBtn = screen.getByTitle('Switch to dark mode');
        fireEvent.click(themeBtn);
        expect(mockToggleTheme).toHaveBeenCalled();
    });

    test('toggles sidebar', async () => {
        await act(async () => {
            render(<Home />);
        });
        
        const sidebarToggle = screen.getByLabelText('Toggle sidebar');
        expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('false');
        
        fireEvent.click(sidebarToggle);
        expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('true');
    });

    test('handles desktop search input and clear', async () => {
        await act(async () => {
            render(<Home />);
        });
        
        // Use generic placeholder to find the desktop search input
        const searchInput = screen.getByPlaceholderText('Search notes...');
        fireEvent.change(searchInput, { target: { value: 'query' } });
        
        expect(screen.getByTestId('search-query')).toHaveTextContent('query');
        
        const clearBtn = screen.getByTitle('Clear search');
        fireEvent.click(clearBtn);
        
        expect(screen.getByTestId('search-query')).toHaveTextContent('');
    });

    test('handles mobile search expanded view', async () => {
        // Set window to mobile size
        window.innerWidth = 500;
        
        await act(async () => {
            render(<Home />);
        });
        
        const expandBtn = screen.getByTitle('Search notes');
        fireEvent.click(expandBtn);
        
        // Now there should be two inputs in the DOM (one hidden by CSS, one in overlay)
        // We interact with the one in the overlay by finding the back button
        const closeSearchBtn = screen.getByTitle('Close search');
        expect(closeSearchBtn).toBeInTheDocument();
        
        // Find the visible inputs. The mobile one has focus via ref, but let's just get all by placeholder
        const inputs = screen.getAllByPlaceholderText('Search notes...');
        const mobileInput = inputs[inputs.length - 1]; // overlay is last
        
        fireEvent.change(mobileInput, { target: { value: 'mobile test' } });
        expect(screen.getByTestId('search-query')).toHaveTextContent('mobile test');
        
        // Test clear via Esc key
        fireEvent.keyDown(mobileInput, { key: 'Escape' });
        expect(screen.getByTestId('search-query')).toHaveTextContent('');
        expect(screen.queryByTitle('Close search')).not.toBeInTheDocument(); // Overlay closed
    });

    test('handles resize events', async () => {
        await act(async () => {
            render(<Home />);
        });
        
        expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('false');
        
        // Trigger resize to mobile
        window.innerWidth = 500;
        await act(async () => {
            fireEvent(window, new Event('resize'));
        });
        
        expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('true');
    });

    test('handles help modal in authenticated view', async () => {
        await act(async () => {
            render(<Home />);
        });
        
        const helpBtn = screen.getByRole('button', { name: 'Help' });
        fireEvent.click(helpBtn);
        
        expect(screen.getByTestId('help-modal-true')).toBeInTheDocument();
        
        // Hide help modal
        fireEvent.click(screen.getByText('Hide Help'));
        expect(screen.getByTestId('help-modal-false')).toBeInTheDocument();
    });
});
