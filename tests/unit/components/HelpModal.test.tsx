import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HelpModal from '@/components/HelpModal';

// Mock the manual content
jest.mock('@/lib/manualContent.json', () => [
    {
        id: 'section1',
        title: 'Creating a Note',
        description: 'How to make a new markdown note',
        steps: ['Click the FAB button', 'Type content']
    },
    {
        id: 'section2',
        title: 'Archiving',
        description: 'Store notes away',
        steps: ['Click archive icon on card']
    }
]);

describe('HelpModal', () => {
    const mockOnHide = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders correctly when show is true', () => {
        render(<HelpModal show={true} onHide={mockOnHide} />);
        
        expect(screen.getByText('Help & Manual')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search for help topics...')).toBeInTheDocument();
        expect(screen.getByText('Creating a Note')).toBeInTheDocument();
        expect(screen.getByText('Archiving')).toBeInTheDocument();
    });

    test('does not render when show is false', () => {
        const { container } = render(<HelpModal show={false} onHide={mockOnHide} />);
        // Bootstrap modal completely removes from DOM or uses display none
        // It renders in a portal, so checking the role="dialog" is a safe bet
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('calls onHide when close button is clicked', () => {
        render(<HelpModal show={true} onHide={mockOnHide} />);
        
        fireEvent.click(screen.getByTitle('Close'));
        expect(mockOnHide).toHaveBeenCalled();
    });

    test('filters content based on title search', () => {
        render(<HelpModal show={true} onHide={mockOnHide} />);
        
        const searchInput = screen.getByPlaceholderText('Search for help topics...');
        fireEvent.change(searchInput, { target: { value: 'archiving' } });

        expect(screen.queryByText('Creating a Note')).not.toBeInTheDocument();
        expect(screen.getByText('Archiving')).toBeInTheDocument();
    });

    test('filters content based on description search', () => {
        render(<HelpModal show={true} onHide={mockOnHide} />);
        
        const searchInput = screen.getByPlaceholderText('Search for help topics...');
        fireEvent.change(searchInput, { target: { value: 'markdown note' } });

        expect(screen.getByText('Creating a Note')).toBeInTheDocument();
        expect(screen.queryByText('Archiving')).not.toBeInTheDocument();
    });

    test('filters content based on steps search', () => {
        render(<HelpModal show={true} onHide={mockOnHide} />);
        
        const searchInput = screen.getByPlaceholderText('Search for help topics...');
        fireEvent.change(searchInput, { target: { value: 'fab button' } });

        expect(screen.getByText('Creating a Note')).toBeInTheDocument();
        expect(screen.queryByText('Archiving')).not.toBeInTheDocument();
    });

    test('displays no results message when search yields nothing', () => {
        render(<HelpModal show={true} onHide={mockOnHide} />);
        
        const searchInput = screen.getByPlaceholderText('Search for help topics...');
        fireEvent.change(searchInput, { target: { value: 'xyz123' } });

        expect(screen.queryByText('Creating a Note')).not.toBeInTheDocument();
        expect(screen.queryByText('Archiving')).not.toBeInTheDocument();
        expect(screen.getByText('No help topics found for "xyz123"')).toBeInTheDocument();
    });
});
