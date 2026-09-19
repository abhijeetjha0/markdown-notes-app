import React, { forwardRef, useImperativeHandle } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditNoteModal from '@/components/EditNoteModal';
import { NoteEditorRef } from '@/components/NoteEditor';

// Setup mock for NoteEditor so we can inspect refs and props
const mockSaveAndClose = jest.fn();

jest.mock('@/components/NoteEditor', () => {
    const React = require('react');
    return {
        __esModule: true,
        default: React.forwardRef((props: any, ref: React.Ref<NoteEditorRef>) => {
            React.useImperativeHandle(ref, () => ({
                saveAndClose: mockSaveAndClose
            }));

            return (
                <div data-testid="mock-note-editor" data-initial-note={props.initialNote?.id || 'none'}>
                    <button data-testid="editor-cancel" onClick={props.onCancel}>Cancel</button>
                    <button data-testid="editor-save" onClick={() => props.onSave('new content')}>Save</button>
                    <button data-testid="editor-delete" onClick={() => props.onDelete('123')}>Delete</button>
                </div>
            );
        })
    };
});

describe('EditNoteModal', () => {
    const mockOnHide = jest.fn();
    const mockOnSave = jest.fn();
    const mockOnDelete = jest.fn();

    const mockNote = {
        id: 'note123',
        title: 'Test Note',
        content: 'Test content',
        createdAt: 123,
        updatedAt: 123,
        userId: 'user123',
        status: 'active' as const
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset window scroll
        window.scrollY = 100;
        document.body.style.top = '';
        window.scrollTo = jest.fn();
    });

    test('renders NoteEditor when shown', () => {
        render(
            <EditNoteModal
                show={true}
                onHide={mockOnHide}
                note={null}
                onSave={mockOnSave}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByTestId('mock-note-editor')).toBeInTheDocument();
        expect(screen.getByTestId('mock-note-editor')).toHaveAttribute('data-initial-note', 'none');
    });

    test('passes existing note to NoteEditor', () => {
        render(
            <EditNoteModal
                show={true}
                onHide={mockOnHide}
                note={mockNote}
                onSave={mockOnSave}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByTestId('mock-note-editor')).toHaveAttribute('data-initial-note', 'note123');
    });

    test('does not render completely when show is false', () => {
        screen.queryByTestId('mock-note-editor'); // Depending on React Bootstrap, it may unmount
        // Instead of strict unmount check, ensure we pass correct show prop
        // We know modal is hidden if we can't find the modal-dialog or it has display:none
        const { container } = render(
            <EditNoteModal
                show={false}
                onHide={mockOnHide}
                note={null}
                onSave={mockOnSave}
                onDelete={mockOnDelete}
            />
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('manages document body scroll position on show/hide', () => {
        const { rerender } = render(
            <EditNoteModal
                show={true}
                onHide={mockOnHide}
                note={null}
                onSave={mockOnSave}
                onDelete={mockOnDelete}
            />
        );

        // When show is true, top should be -100px (mocked scrollY)
        expect(document.body.style.top).toBe('-100px');

        // Re-render with show = false
        rerender(
            <EditNoteModal
                show={false}
                onHide={mockOnHide}
                note={null}
                onSave={mockOnSave}
                onDelete={mockOnDelete}
            />
        );

        // top is cleared, window.scrollTo is called
        expect(document.body.style.top).toBe('');
        expect(window.scrollTo).toHaveBeenCalledWith(0, 100);
    });

    test('calls saveAndClose on NoteEditor when Modal tries to hide', () => {
        // Since we can't easily click the bootstrap modal backdrop in a mock,
        // we trigger the handleHide by clicking the backdrop if it's rendered,
        // or we just call the onHide directly if exposed.
        // The easiest way is to mock react-bootstrap Modal but that is complex.
        // Instead, we can simulate pressing ESC key on the modal which triggers onHide.
        render(
            <EditNoteModal
                show={true}
                onHide={mockOnHide}
                note={null}
                onSave={mockOnSave}
                onDelete={mockOnDelete}
            />
        );

        // Triggering ESC key on the dialog
        const dialog = screen.getByRole('dialog');
        fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

        expect(mockSaveAndClose).toHaveBeenCalled();
    });

    test('passes callbacks down to NoteEditor correctly', () => {
        render(
            <EditNoteModal
                show={true}
                onHide={mockOnHide}
                note={null}
                onSave={mockOnSave}
                onDelete={mockOnDelete}
            />
        );

        fireEvent.click(screen.getByTestId('editor-cancel'));
        expect(mockOnHide).toHaveBeenCalled();

        fireEvent.click(screen.getByTestId('editor-save'));
        expect(mockOnSave).toHaveBeenCalledWith('new content');

        fireEvent.click(screen.getByTestId('editor-delete'));
        expect(mockOnDelete).toHaveBeenCalledWith('123');
    });
});
