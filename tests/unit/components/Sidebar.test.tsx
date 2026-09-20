import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';

describe('Sidebar', () => {
    const mockOnViewChange = jest.fn();
    const mockOnCloseSidebar = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders correctly in expanded state', () => {
        render(
            <Sidebar
                currentView="notes"
                onViewChange={mockOnViewChange}
                collapsed={false}
                onCloseSidebar={mockOnCloseSidebar}
            />
        );

        expect(screen.getByText('Notes')).toBeInTheDocument();
        expect(screen.getByText('Archive')).toBeInTheDocument();
        expect(screen.getByText('Trash')).toBeInTheDocument();
    });

    test('renders correctly in collapsed state', () => {
        render(
            <Sidebar
                currentView="notes"
                onViewChange={mockOnViewChange}
                collapsed={true}
                onCloseSidebar={mockOnCloseSidebar}
            />
        );

        // Labels shouldn't be visible in collapsed state (rendered conditionally)
        expect(screen.queryByText('Notes')).not.toBeInTheDocument();
        
        // Icons should still be there
        expect(screen.getByText('markdown')).toBeInTheDocument();
        expect(screen.getByText('archive')).toBeInTheDocument();
        expect(screen.getByText('delete')).toBeInTheDocument();
    });

    test('calls onViewChange and onCloseSidebar when a nav item is clicked', () => {
        render(
            <Sidebar
                currentView="notes"
                onViewChange={mockOnViewChange}
                collapsed={false}
                onCloseSidebar={mockOnCloseSidebar}
            />
        );

        fireEvent.click(screen.getByText('Archive'));

        expect(mockOnViewChange).toHaveBeenCalledWith('archive');
        expect(mockOnCloseSidebar).toHaveBeenCalled();
    });

    test('highlights the current active view', () => {
        const { container } = render(
            <Sidebar
                currentView="trash"
                onViewChange={mockOnViewChange}
                collapsed={false}
                onCloseSidebar={mockOnCloseSidebar}
            />
        );

        // Find the Trash nav link and ensure it has the active classes
        const trashLink = screen.getByText('Trash').closest('a');
        expect(trashLink).toHaveClass('bg-primary');
        expect(trashLink).toHaveClass('fw-bold');

        const notesLink = screen.getByText('Notes').closest('a');
        expect(notesLink).not.toHaveClass('bg-primary');
    });

    test('calls onCloseSidebar when clicking the backdrop', () => {
        const { container } = render(
            <Sidebar
                currentView="notes"
                onViewChange={mockOnViewChange}
                collapsed={false} // expanded so backdrop has show class
                onCloseSidebar={mockOnCloseSidebar}
            />
        );

        // Backdrop is the first element
        const backdrop = container.querySelector('.sidebar-backdrop');
        expect(backdrop).toBeInTheDocument();
        
        if (backdrop) fireEvent.click(backdrop);

        expect(mockOnCloseSidebar).toHaveBeenCalled();
    });
});
