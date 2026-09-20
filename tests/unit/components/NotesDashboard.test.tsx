import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import NotesDashboard from '@/components/NotesDashboard';
import { useAuth } from '@/context/AuthContext';
import { driveStorage, syncFromDrive, subscribeToSyncStatus } from '@/lib/driveStorage';

jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn()
}));

jest.mock('@/lib/driveStorage', () => ({
    driveStorage: {
        subscribeToNotes: jest.fn(),
        saveNote: jest.fn(),
        changeNoteStatus: jest.fn(),
        deleteNote: jest.fn()
    },
    syncFromDrive: jest.fn(),
    subscribeToSyncStatus: jest.fn()
}));

jest.mock('@/components/NoteCard', () => {
    return function MockNoteCard({ note, onEdit, onPin, onChangeStatus, onDeleteForever }: any) {
        return (
            <div data-testid={`note-card-${note.id}`}>
                {note.content}
                <button data-testid={`edit-${note.id}`} onClick={() => onEdit(note)}>Edit</button>
                <button data-testid={`pin-${note.id}`} onClick={() => onPin(note.id, !note.isPinned)}>Pin</button>
                <button data-testid={`archive-${note.id}`} onClick={() => onChangeStatus(note.id, 'archived')}>Archive</button>
                <button data-testid={`trash-${note.id}`} onClick={() => onChangeStatus(note.id, 'trashed')}>Trash</button>
                <button data-testid={`delete-${note.id}`} onClick={() => onDeleteForever(note.id)}>Delete</button>
            </div>
        );
    };
});

jest.mock('@/components/EditNoteModal', () => {
    return function MockEditNoteModal({ show, onHide, note, onSave, onDelete }: any) {
        if (!show) return null;
        return (
            <div data-testid="edit-modal">
                <button data-testid="modal-close" onClick={onHide}>Close</button>
                <button data-testid="modal-save" onClick={() => onSave('New Content', note?.id)}>Save</button>
            </div>
        );
    };
});

describe('NotesDashboard', () => {
    const mockUseAuth = useAuth as jest.Mock;
    let mockSubscribe: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSubscribe = jest.fn().mockImplementation((uid, onNotesUpdate) => {
            onNotesUpdate([
                { id: '1', content: 'Active Note', status: 'active', isPinned: false },
                { id: '2', content: 'Pinned Note', status: 'active', isPinned: true },
                { id: '3', content: 'Archived Note', status: 'archived', isPinned: false },
                { id: '4', content: 'Trashed Note', status: 'trashed', isPinned: false }
            ]);
            return jest.fn(); // unsubscribe
        });

        (driveStorage.subscribeToNotes as jest.Mock) = mockSubscribe;
        (driveStorage.saveNote as jest.Mock).mockResolvedValue({ success: true, id: 'new-id' });
        (driveStorage.changeNoteStatus as jest.Mock).mockResolvedValue({ success: true });
        (driveStorage.deleteNote as jest.Mock).mockResolvedValue({ success: true });
        (subscribeToSyncStatus as jest.Mock).mockImplementation((cb) => {
            cb(false);
            return jest.fn();
        });

        mockUseAuth.mockReturnValue({
            user: { uid: 'user1' },
            driveToken: 'mock-token',
            getFreshDriveToken: jest.fn().mockResolvedValue('mock-token')
        });
    });

    const defaultProps = {
        searchQuery: '',
        sidebarCollapsed: false,
        setSidebarCollapsed: jest.fn(),
        layoutView: 'grid' as const
    };

    it('shows loading state initially if no notes fetched', () => {
        // Delay callback
        mockSubscribe.mockImplementation(() => jest.fn());
        
        const { container } = render(<NotesDashboard {...defaultProps} />);
        expect(container.querySelector('.spinner-border')).toBeInTheDocument();
    });

    it('shows disconnected state if no driveToken', () => {
        mockUseAuth.mockReturnValue({
            user: { uid: 'user1' },
            driveToken: null,
            getFreshDriveToken: jest.fn().mockResolvedValue('mock-token')
        });

        render(<NotesDashboard {...defaultProps} />);
        
        expect(screen.getByText('Google Drive Disconnected')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Reconnect Google Drive'));
        expect(mockUseAuth().getFreshDriveToken).toHaveBeenCalled();
    });

    it('renders active notes and pinned notes by default', () => {
        render(<NotesDashboard {...defaultProps} />);
        
        expect(screen.getByTestId('note-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('note-card-2')).toBeInTheDocument();
        expect(screen.queryByTestId('note-card-3')).not.toBeInTheDocument(); // Archived
        expect(screen.queryByTestId('note-card-4')).not.toBeInTheDocument(); // Trashed
        expect(screen.getByText('PINNED')).toBeInTheDocument();
        expect(screen.getByText('OTHERS')).toBeInTheDocument();
    });

    it('filters notes by search query', () => {
        render(<NotesDashboard {...defaultProps} searchQuery="Pinned" />);
        
        expect(screen.queryByTestId('note-card-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('note-card-2')).toBeInTheDocument();
    });

    it('switches views via sidebar', () => {
        render(<NotesDashboard {...defaultProps} />);
        
        // Click Archive in Sidebar (we didn't mock Sidebar, so we have to find the real one)
        // Wait, Sidebar uses standard React components.
        fireEvent.click(screen.getAllByText('Archive')[0]);
        
        expect(screen.getByTestId('note-card-3')).toBeInTheDocument();
        expect(screen.queryByTestId('note-card-1')).not.toBeInTheDocument();
    });

    it('handles note pinning', async () => {
        render(<NotesDashboard {...defaultProps} />);
        
        fireEvent.click(screen.getByTestId('pin-1'));
        
        await waitFor(() => {
            expect(driveStorage.changeNoteStatus).toHaveBeenCalledWith('mock-token', '1', { isPinned: true });
        });
    });

    it('handles note archiving', async () => {
        render(<NotesDashboard {...defaultProps} />);
        
        fireEvent.click(screen.getByTestId('archive-1'));
        
        await waitFor(() => {
            expect(driveStorage.changeNoteStatus).toHaveBeenCalledWith('mock-token', '1', expect.objectContaining({ status: 'archived' }));
        });
    });

    it('handles note trashing', async () => {
        render(<NotesDashboard {...defaultProps} />);
        
        fireEvent.click(screen.getByTestId('trash-1'));
        
        await waitFor(() => {
            expect(driveStorage.changeNoteStatus).toHaveBeenCalledWith('mock-token', '1', expect.objectContaining({ status: 'trashed', isPinned: false }));
        });
    });

    it('handles permanent deletion', async () => {
        render(<NotesDashboard {...defaultProps} />);
        
        fireEvent.click(screen.getByTestId('delete-1'));
        
        await waitFor(() => {
            expect(driveStorage.deleteNote).toHaveBeenCalledWith('mock-token', '1');
        });
    });

    it('opens EditNoteModal for creating new note and saves', async () => {
        render(<NotesDashboard {...defaultProps} />);
        
        fireEvent.click(screen.getByTitle('Add Note'));
        
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
        
        fireEvent.click(screen.getByTestId('modal-save'));
        
        await waitFor(() => {
            expect(driveStorage.saveNote).toHaveBeenCalledWith('mock-token', 'New Content', undefined);
        });
    });

    it('opens EditNoteModal for editing existing note', async () => {
        render(<NotesDashboard {...defaultProps} />);
        
        fireEvent.click(screen.getByTestId('edit-1'));
        
        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
        
        fireEvent.click(screen.getByTestId('modal-save'));
        
        await waitFor(() => {
            expect(driveStorage.saveNote).toHaveBeenCalledWith('mock-token', 'New Content', '1');
        });
    });

    it('handles sync failures gracefully on subscribe', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        mockSubscribe.mockImplementation((uid, onNotesUpdate, onError) => {
            onError(new Error('Sync failed'));
            return jest.fn();
        });
        
        render(<NotesDashboard {...defaultProps} />);
        expect(consoleSpy).toHaveBeenCalledWith("Error fetching notes:", expect.any(Error));
        consoleSpy.mockRestore();
    });
});
