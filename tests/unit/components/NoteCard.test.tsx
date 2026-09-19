import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NoteCard, { Note } from '@/components/NoteCard';

jest.mock('@/components/Mermaid', () => {
    return ({ chart }: { chart: string }) => <div data-testid="mermaid" data-chart={chart} />;
});

// Mock react-markdown to avoid complex ESM and AST compilation issues in Jest,
// while still manually invoking the custom components to achieve full coverage.
jest.mock('react-markdown', () => {
    return ({ children, components }: any) => {
        const A = components?.a;
        const Pre = components?.pre;
        const Code = components?.code;

        return (
            <div data-testid="markdown-content">
                <span data-testid="content">{children}</span>
                {/* Manually exercise components to cover those lines */}
                {A && <A href="http://test.com" node={{}}>Link</A>}
                
                {/* Regular Code Block */}
                {Pre && Code && (
                    <Pre>
                        <Code className="language-js">console.log('test')</Code>
                    </Pre>
                )}

                {/* Mermaid Code Block */}
                {Pre && Code && (
                    <Pre>
                        <Code className="language-mermaid">graph TD\nA--&gt;B</Code>
                    </Pre>
                )}
                
                {/* Mermaid Code Block with array children */}
                {Pre && Code && (
                    <Pre>
                        <Code className="language-mermaid">{['graph TD', '\n', 'A-->B']}</Code>
                    </Pre>
                )}
            </div>
        );
    };
});

describe('NoteCard', () => {
    const mockNote: Note = {
        id: 'note-1',
        content: 'Test content',
        createdAt: 12345,
        userId: 'user-1',
        status: 'active',
        isPinned: false
    };

    const mockOnEdit = jest.fn();
    const mockOnPin = jest.fn();
    const mockOnChangeStatus = jest.fn();
    const mockOnDeleteForever = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockOnChangeStatus.mockResolvedValue(undefined);
        mockOnPin.mockResolvedValue(undefined);
        mockOnDeleteForever.mockResolvedValue(undefined);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('renders note content and custom markdown components', () => {
        render(<NoteCard note={mockNote} />);
        
        expect(screen.getByTestId('content')).toHaveTextContent('Test content');
        
        // Link component check
        const link = screen.getByText('Link');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        
        // Ensure stopPropagation is called on link click
        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'stopPropagation', { value: jest.fn() });
        fireEvent(link, clickEvent);
        expect(clickEvent.stopPropagation).toHaveBeenCalled();

        // Check mermaid rendering
        const mermaids = screen.getAllByTestId('mermaid');
        expect(mermaids.length).toBeGreaterThan(0);
    });

    test('calls onEdit when clicking the card body if not trashed', () => {
        render(<NoteCard note={mockNote} onEdit={mockOnEdit} />);
        
        const cardBody = screen.getByTestId('markdown-content').parentElement!;
        fireEvent.click(cardBody);
        
        expect(mockOnEdit).toHaveBeenCalledWith(mockNote);
    });

    test('does not call onEdit when clicking the card body if trashed', () => {
        const trashedNote = { ...mockNote, status: 'trashed' as const };
        render(<NoteCard note={trashedNote} onEdit={mockOnEdit} />);
        
        const cardBody = screen.getByTestId('markdown-content').parentElement!;
        fireEvent.click(cardBody);
        
        expect(mockOnEdit).not.toHaveBeenCalled();
    });

    test('renders pin button and calls onPin for active note', async () => {
        const { container } = render(<NoteCard note={mockNote} onPin={mockOnPin} />);
        
        const pinBtn = screen.getByLabelText('Pin');
        expect(pinBtn).toBeInTheDocument();
        
        fireEvent.click(pinBtn);
        // We use querySelector instead of role because react-bootstrap might not set role="status"
        expect(container.querySelector('.spinner-border')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(mockOnPin).toHaveBeenCalledWith('note-1', true);
            expect(container.querySelector('.spinner-border')).not.toBeInTheDocument();
        });
    });

    test('renders unpin button for pinned note', async () => {
        const pinnedNote = { ...mockNote, isPinned: true };
        render(<NoteCard note={pinnedNote} onPin={mockOnPin} />);
        
        const pinBtn = screen.getByLabelText('Unpin');
        expect(pinBtn).toBeInTheDocument();
        
        fireEvent.click(pinBtn);
        
        await waitFor(() => {
            expect(mockOnPin).toHaveBeenCalledWith('note-1', false);
        });
    });

    test('renders archive button and calls onChangeStatus for active note', async () => {
        render(<NoteCard note={mockNote} onChangeStatus={mockOnChangeStatus} />);
        
        const archiveBtn = screen.getByLabelText('Archive');
        expect(archiveBtn).toBeInTheDocument();
        
        fireEvent.click(archiveBtn);
        
        await waitFor(() => {
            expect(mockOnChangeStatus).toHaveBeenCalledWith('note-1', 'archived');
        });
    });

    test('renders trash button and calls onChangeStatus for active note', async () => {
        render(<NoteCard note={mockNote} onChangeStatus={mockOnChangeStatus} />);
        
        const trashBtn = screen.getByLabelText('Trash');
        expect(trashBtn).toBeInTheDocument();
        
        fireEvent.click(trashBtn);
        
        await waitFor(() => {
            expect(mockOnChangeStatus).toHaveBeenCalledWith('note-1', 'trashed');
        });
    });

    test('renders unarchive and trash buttons for archived note', async () => {
        const archivedNote = { ...mockNote, status: 'archived' as const };
        render(<NoteCard note={archivedNote} onChangeStatus={mockOnChangeStatus} />);
        
        const unarchiveBtn = screen.getByLabelText('Unarchive');
        expect(unarchiveBtn).toBeInTheDocument();
        
        fireEvent.click(unarchiveBtn);
        
        await waitFor(() => {
            expect(mockOnChangeStatus).toHaveBeenCalledWith('note-1', 'active');
        });
    });

    test('renders restore button and calls onChangeStatus for trashed note', async () => {
        const trashedNote = { ...mockNote, status: 'trashed' as const };
        render(<NoteCard note={trashedNote} onChangeStatus={mockOnChangeStatus} onDeleteForever={mockOnDeleteForever} />);
        
        const restoreBtn = screen.getByLabelText('Restore');
        expect(restoreBtn).toBeInTheDocument();
        
        fireEvent.click(restoreBtn);
        
        await waitFor(() => {
            expect(mockOnChangeStatus).toHaveBeenCalledWith('note-1', 'active');
        });
    });

    test('renders delete forever button and calls onDeleteForever for trashed note', async () => {
        const trashedNote = { ...mockNote, status: 'trashed' as const };
        render(<NoteCard note={trashedNote} onChangeStatus={mockOnChangeStatus} onDeleteForever={mockOnDeleteForever} />);
        
        const deleteBtn = screen.getByLabelText('Delete forever');
        expect(deleteBtn).toBeInTheDocument();
        
        fireEvent.click(deleteBtn);
        
        await waitFor(() => {
            expect(mockOnDeleteForever).toHaveBeenCalledWith('note-1');
        });
    });

    test('handles action button errors gracefully', async () => {
        const failingOnPin = jest.fn().mockRejectedValue(new Error('Test error'));
        const { container } = render(<NoteCard note={mockNote} onPin={failingOnPin} />);
        
        const pinBtn = screen.getByLabelText('Pin');
        fireEvent.click(pinBtn);
        
        expect(container.querySelector('.spinner-border')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(container.querySelector('.spinner-border')).not.toBeInTheDocument();
        });
    });
});
