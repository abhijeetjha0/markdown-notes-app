import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NotesDashboard from '@/components/NotesDashboard';
import { useAuth } from '@/context/AuthContext';
import * as notesActions from '@/app/actions/notesActions';
import { onSnapshot } from 'firebase/firestore';

// Mock dependencies
jest.mock('@/context/AuthContext');
jest.mock('@/app/actions/notesActions', () => ({
    createNoteAction: jest.fn(),
    updateNoteAction: jest.fn(),
    deleteNoteAction: jest.fn(),
    changeNoteStatusAction: jest.fn()
}));
jest.mock('@/firebase', () => ({
    db: {}
}));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    onSnapshot: jest.fn()
}));

// Mock child components to isolate Dashboard logic
jest.mock('@/components/Sidebar', () => {
    return ({ currentView, onViewChange, collapsed, onCloseSidebar }: any) => (
        <div data-testid="sidebar">
            <button onClick={() => onViewChange('notes')}>View Notes</button>
            <button onClick={() => onViewChange('archive')}>View Archive</button>
            <button onClick={() => onViewChange('trash')}>View Trash</button>
            <button onClick={onCloseSidebar}>Close Sidebar</button>
        </div>
    );
});

jest.mock('@/components/NoteCard', () => {
    return ({ note, onEdit, onPin, onChangeStatus, onDeleteForever }: any) => (
        <div data-testid={`note-card-${note.id}`}>
            {note.content}
            <button onClick={() => onEdit(note)}>Edit</button>
            <button onClick={() => onPin(note.id, !note.isPinned)}>Pin</button>
            <button onClick={() => onChangeStatus(note.id, 'trashed')}>Trash</button>
            <button onClick={() => onDeleteForever(note.id)}>DeleteForever</button>
        </div>
    );
});

jest.mock('@/components/EditNoteModal', () => {
    return ({ show, onHide, onSave, note }: any) => {
        if (!show) return null;
        return (
            <div data-testid="edit-modal">
                <button onClick={onHide}>Hide</button>
                <button onClick={() => onSave('New Content', note?.id)}>Save</button>
            </div>
        );
    };
});

// Mock Masonry to just render its children
jest.mock('react-masonry-css', () => {
    return ({ children }: any) => <div data-testid="masonry">{children}</div>;
});

describe('NotesDashboard', () => {
    const mockUser = {
        uid: 'user-1',
        getIdToken: jest.fn().mockResolvedValue('mock-token')
    };

    const mockNotesData = [
        { id: '1', data: () => ({ content: 'Active note one', status: 'active', createdAt: 1000 }) },
        { id: '2', data: () => ({ content: 'Pinned active note', status: 'active', isPinned: true, createdAt: 1001 }) },
        { id: '3', data: () => ({ content: 'Archived note', status: 'archived', createdAt: 1002 }) },
        { id: '4', data: () => ({ content: 'Trashed note', status: 'trashed', createdAt: 1003 }) },
        { 
            id: '5', 
            data: () => ({ 
                content: 'Expired trashed note', 
                status: 'trashed', 
                createdAt: 1004,
                expiresAt: { toDate: () => new Date(Date.now() - 10000) } // Expired 10s ago
            }) 
        }
    ];

    let onSnapshotCallback: Function;

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false });
        
        // Capture the onSnapshot callback so we can simulate real-time updates
        (onSnapshot as jest.Mock).mockImplementation((q, callback) => {
            onSnapshotCallback = callback;
            // Initially trigger with empty or mock data
            callback({ docs: mockNotesData });
            return jest.fn(); // unsubscribe
        });

        // Mock action successes
        jest.spyOn(notesActions, 'createNoteAction').mockResolvedValue({ success: true, id: 'new-id' });
        jest.spyOn(notesActions, 'updateNoteAction').mockResolvedValue({ success: true });
        jest.spyOn(notesActions, 'changeNoteStatusAction').mockResolvedValue({ success: true });
        jest.spyOn(notesActions, 'deleteNoteAction').mockResolvedValue({ success: true });
    });

    test('renders loading spinner initially, then notes', () => {
        // Delay callback to see loading state
        (onSnapshot as jest.Mock).mockImplementation((q, callback) => {
            setTimeout(() => callback({ docs: mockNotesData }), 50);
            return jest.fn();
        });

        const { container } = render(
            <NotesDashboard 
                searchQuery="" 
                sidebarCollapsed={false} 
                setSidebarCollapsed={jest.fn()} 
                layoutView="grid" 
            />
        );
        
        expect(container.querySelector('.spinner-border')).toBeInTheDocument(); // Spinner
    });

    test('filters notes by view (notes/archive/trash)', async () => {
        render(
            <NotesDashboard 
                searchQuery="" 
                sidebarCollapsed={false} 
                setSidebarCollapsed={jest.fn()} 
                layoutView="grid" 
            />
        );

        // Default view is 'notes'. Should show active and pinned active
        expect(screen.getByTestId('note-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('note-card-2')).toBeInTheDocument();
        expect(screen.queryByTestId('note-card-3')).not.toBeInTheDocument();
        
        // Switch to archive
        fireEvent.click(screen.getByText('View Archive'));
        expect(screen.getByTestId('note-card-3')).toBeInTheDocument();
        expect(screen.queryByTestId('note-card-1')).not.toBeInTheDocument();

        // Switch to trash
        fireEvent.click(screen.getByText('View Trash'));
        expect(screen.getByTestId('note-card-4')).toBeInTheDocument();
    });

    test('filters notes by search query', async () => {
        render(
            <NotesDashboard 
                searchQuery="one" 
                sidebarCollapsed={false} 
                setSidebarCollapsed={jest.fn()} 
                layoutView="grid" 
            />
        );

        // Should only show 'Active note one'
        expect(screen.getByTestId('note-card-1')).toBeInTheDocument();
        expect(screen.queryByTestId('note-card-2')).not.toBeInTheDocument();
    });

    test('shows empty state when no notes match', () => {
        render(
            <NotesDashboard 
                searchQuery="nonexistent" 
                sidebarCollapsed={false} 
                setSidebarCollapsed={jest.fn()} 
                layoutView="list" 
            />
        );

        expect(screen.getByText('No matching notes')).toBeInTheDocument();
    });

    test('handles list layout vs grid layout', () => {
        const { rerender } = render(
            <NotesDashboard 
                searchQuery="" 
                sidebarCollapsed={false} 
                setSidebarCollapsed={jest.fn()} 
                layoutView="grid" 
            />
        );
        
        expect(screen.getAllByTestId('masonry').length).toBeGreaterThan(0);
        
        rerender(
            <NotesDashboard 
                searchQuery="" 
                sidebarCollapsed={false} 
                setSidebarCollapsed={jest.fn()} 
                layoutView="list" 
            />
        );
        
        expect(screen.queryByTestId('masonry')).not.toBeInTheDocument();
        expect(document.querySelector('.note-list-container')).toBeInTheDocument();
    });

    test('opens EditNoteModal on Edit click and saves note', async () => {
        render(
            <NotesDashboard 
                searchQuery="" 
                sidebarCollapsed={false} 
                setSidebarCollapsed={jest.fn()} 
                layoutView="grid" 
            />
        );

        // Click Edit on note-card-1
        const editBtn = screen.getByTestId('note-card-1').querySelector('button:first-of-type')!;
        fireEvent.click(editBtn);

        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
        
        // Save note
        fireEvent.click(screen.getByText('Save'));
        
        await waitFor(() => {
            expect(notesActions.updateNoteAction).toHaveBeenCalledWith('mock-token', '1', 'New Content');
        });
    });

    test('opens EditNoteModal on FAB click and creates note', async () => {
        render(
            <NotesDashboard 
                searchQuery="" 
                sidebarCollapsed={false} 
                setSidebarCollapsed={jest.fn()} 
                layoutView="grid" 
            />
        );

        // Click FAB
        const fab = screen.getByTitle('Add Note');
        fireEvent.click(fab);

        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
        
        // Save note
        fireEvent.click(screen.getByText('Save'));
        
        await waitFor(() => {
            expect(notesActions.createNoteAction).toHaveBeenCalledWith('mock-token', 'New Content');
        });
    });

    test('handles action buttons (pin, trash, delete forever)', async () => {
        render(
            <NotesDashboard 
                searchQuery="" 
                sidebarCollapsed={false} 
                setSidebarCollapsed={jest.fn()} 
                layoutView="grid" 
            />
        );

        // Pin note-1
        fireEvent.click(screen.getByTestId('note-card-1').querySelector('button:nth-of-type(2)')!);
        await waitFor(() => expect(notesActions.changeNoteStatusAction).toHaveBeenCalledWith('mock-token', '1', { isPinned: true }));

        // Trash note-1
        fireEvent.click(screen.getByTestId('note-card-1').querySelector('button:nth-of-type(3)')!);
        await waitFor(() => expect(notesActions.changeNoteStatusAction).toHaveBeenCalledWith('mock-token', '1', expect.objectContaining({ status: 'trashed' })));

        // Switch to Trash view to see Delete Forever
        fireEvent.click(screen.getByText('View Trash'));
        fireEvent.click(screen.getByTestId('note-card-4').querySelector('button:nth-of-type(4)')!);
        await waitFor(() => expect(notesActions.deleteNoteAction).toHaveBeenCalledWith('mock-token', '4'));
    });

    test('automatically deletes expired trashed notes on mount', async () => {
        render(
            <NotesDashboard 
                searchQuery="" 
                sidebarCollapsed={false} 
                setSidebarCollapsed={jest.fn()} 
                layoutView="grid" 
            />
        );

        // note-5 is expired in mockNotesData
        await waitFor(() => {
            expect(notesActions.deleteNoteAction).toHaveBeenCalledWith('mock-token', '5');
        });
    });
});
