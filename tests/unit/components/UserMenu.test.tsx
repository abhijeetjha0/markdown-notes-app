
import { render, screen, fireEvent } from '@testing-library/react'
import UserMenu from '@/components/UserMenu'
import { useAuth } from '@/context/AuthContext'

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

describe('UserMenu Component', () => {
  const mockLogout = jest.fn()
  const mockSwitchAccount = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when user is not logged in', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
    const { container } = render(<UserMenu />)
    expect(container.firstChild).toBeNull()
  })

  it('renders user button when user is logged in (no photo)', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com', displayName: 'Test User' },
      logout: mockLogout,
      switchAccount: mockSwitchAccount,
    })
    
    render(<UserMenu />)
    expect(screen.getByRole('button', { name: 'User menu' })).toBeInTheDocument()
    // By default, no photoURL renders the icon
    expect(screen.getByText('account_circle')).toBeInTheDocument()
  })

  it('renders user photo when photoURL is provided', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'photo@example.com', displayName: 'Photo User', photoURL: 'https://example.com/photo.jpg' },
    })
    
    render(<UserMenu />)
    const button = screen.getByRole('button', { name: 'User menu' })
    expect(button).toBeInTheDocument()
    
    const img = screen.getByAltText('Photo User')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')

    // Open dropdown to test photoURL inside dropdown
    fireEvent.click(button)
    const dropdownImg = screen.getAllByAltText('Photo User')[1] // one in button, one in dropdown
    expect(dropdownImg).toBeInTheDocument()
    expect(dropdownImg).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('closes dropdown when clicking outside', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com', displayName: 'Test User' },
    })
    
    render(<UserMenu />)
    const button = screen.getByRole('button', { name: 'User menu' })
    fireEvent.click(button)
    
    expect(screen.getByText('Sign Out')).toBeInTheDocument()

    // Click outside
    fireEvent.mouseDown(document.body)
    
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
  })

  it('renders fallback when user has no displayName or photoURL', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'anon@example.com', displayName: null, photoURL: null },
    })
    
    render(<UserMenu />)
    const button = screen.getByRole('button', { name: 'User menu' })
    fireEvent.click(button)
    
    expect(screen.getByText('anon@example.com')).toBeInTheDocument()
    expect(screen.getAllByText('User').length).toBeGreaterThan(0) // Should have "User" text
    expect(screen.getAllByText('account_circle').length).toBe(2) // 1 in button, 1 in dropdown
  })

  it('opens dropdown menu when button is clicked', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com', displayName: 'Test User' },
    })
    
    render(<UserMenu />)
    const button = screen.getByRole('button', { name: 'User menu' })
    fireEvent.click(button)
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
    expect(screen.getByText('Switch Account')).toBeInTheDocument()
  })

  it('calls logout when sign out button is clicked', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com', displayName: 'Test User' },
      logout: mockLogout,
    })
    
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'User menu' }))
    fireEvent.click(screen.getByText('Sign Out'))
    
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('calls switchAccount when switch account button is clicked', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com', displayName: 'Test User' },
      switchAccount: mockSwitchAccount,
    })
    
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'User menu' }))
    fireEvent.click(screen.getByText('Switch Account'))
    
    expect(mockSwitchAccount).toHaveBeenCalledTimes(1)
  })
})
