import React, { useRef } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NoteEditor, { NoteEditorRef } from '@/components/NoteEditor';

// Mock dynamic import for SimpleMdeReact
jest.mock('next/dynamic', () => () => {
    return function MockSimpleMde({ value, onChange }: any) {
        return (
            <textarea
                data-testid="mock-mde"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    };
});

// Mock ReactMarkdown
jest.mock('react-markdown', () => {
    return function MockMarkdown({ children }: any) {
        return <div data-testid="mock-markdown">{children}</div>;
    };
});

describe('NoteEditor', () => {
    const mockOnSave = jest.fn();
    const mockOnDelete = jest.fn();
    const mockOnCancel = jest.fn();

    const defaultProps = {
        onSave: mockOnSave,
        onDelete: mockOnDelete,
        onCancel: mockOnCancel,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders default title for new note', () => {
        render(<NoteEditor {...defaultProps} />);
        const textarea = screen.getByTestId('mock-mde');
        expect(textarea).toHaveValue('# Title\n\n');
    });

    test('renders initial note content', () => {
        const note = { id: '1', content: 'Hello World', createdAt: 123 } as any;
        render(<NoteEditor {...defaultProps} initialNote={note} />);
        const textarea = screen.getByTestId('mock-mde');
        expect(textarea).toHaveValue('Hello World');
    });

    test('toggles preview mode when isModal is true', () => {
        render(<NoteEditor {...defaultProps} isModal={true} />);
        
        // Starts in edit mode by default
        expect(screen.getByTestId('mock-mde')).toBeInTheDocument();
        expect(screen.queryByTestId('mock-markdown')).not.toBeInTheDocument();

        // Click toggle preview
        const toggleBtn = screen.getByTitle('Preview');
        fireEvent.click(toggleBtn);
        
        expect(screen.queryByTestId('mock-mde')).not.toBeInTheDocument();
        expect(screen.getByTestId('mock-markdown')).toBeInTheDocument();
        
        // Click edit again
        const editBtn = screen.getByTitle('Edit');
        fireEvent.click(editBtn);
        
        expect(screen.getByTestId('mock-mde')).toBeInTheDocument();
    });

    test('calls onCancel when back is clicked with no changes', () => {
        render(<NoteEditor {...defaultProps} isModal={true} />);
        
        const backBtn = screen.getByTitle("Back (don't save)");
        fireEvent.click(backBtn);
        
        expect(mockOnCancel).toHaveBeenCalled();
    });

    test('shows discard confirmation when back is clicked with changes', () => {
        render(<NoteEditor {...defaultProps} isModal={true} />);
        
        const textarea = screen.getByTestId('mock-mde');
        fireEvent.change(textarea, { target: { value: 'New content' } });
        
        const backBtn = screen.getByTitle("Back (don't save)");
        fireEvent.click(backBtn);
        
        expect(screen.getByText('Discard changes?')).toBeInTheDocument();
        
        // Discard
        fireEvent.click(screen.getByText('Discard'));
        expect(mockOnCancel).toHaveBeenCalled();
    });

    test('saves note with changes when Save & Close is clicked', async () => {
        render(<NoteEditor {...defaultProps} isModal={true} />);
        
        const textarea = screen.getByTestId('mock-mde');
        fireEvent.change(textarea, { target: { value: 'New content' } });
        
        const saveBtn = screen.getByTitle('Save & Close');
        fireEvent.click(saveBtn);
        
        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith('New content', undefined);
        });
    });

    test('does not save empty notes on close, calls onCancel', async () => {
        render(<NoteEditor {...defaultProps} isModal={true} />);
        
        const textarea = screen.getByTestId('mock-mde');
        // Clear everything (make it empty)
        fireEvent.change(textarea, { target: { value: '' } });
        
        const saveBtn = screen.getByTitle('Save & Close');
        fireEvent.click(saveBtn);
        
        await waitFor(() => {
            expect(mockOnSave).not.toHaveBeenCalled();
            expect(mockOnCancel).toHaveBeenCalled();
        });
    });

    test('deletes existing note if emptied on save & close', async () => {
        const note = { id: '1', content: 'Hello World', createdAt: 123 } as any;
        render(<NoteEditor {...defaultProps} initialNote={note} isModal={true} />);
        
        const textarea = screen.getByTestId('mock-mde');
        fireEvent.change(textarea, { target: { value: '   ' } }); // Empty content
        
        const saveBtn = screen.getByTitle('Save & Close');
        fireEvent.click(saveBtn);
        
        await waitFor(() => {
            expect(mockOnDelete).toHaveBeenCalledWith('1');
            expect(mockOnCancel).toHaveBeenCalled();
        });
    });



    test('beforeunload listener triggers correctly', () => {
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
        
        const { unmount } = render(<NoteEditor {...defaultProps} isModal={true} />);
        
        expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        
        unmount();
        
        expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
});
