
import { render, screen, waitFor, act } from '@testing-library/react'
import Mermaid from '@/components/Mermaid'

const mockRender = jest.fn().mockResolvedValue({ svg: '<svg data-testid="mock-mermaid"></svg>' })

jest.mock('mermaid', () => {
  return {
    __esModule: true,
    default: {
      initialize: jest.fn(),
      render: mockRender,
    },
  }
})

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}))

describe('Mermaid Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRender.mockResolvedValue({ svg: '<svg data-testid="mock-mermaid"></svg>' })
  })

  it('renders nothing when chart is empty', async () => {
    let container: any;
    await act(async () => {
      const res = render(<Mermaid chart="" />)
      container = res.container
    })
    expect(container.firstChild).toBeNull()
  })

  it('renders loading state initially for valid chart', async () => {
    let getByText: any;
    // We intentionally don't await the full render yet to catch the loading state
    render(<Mermaid chart="graph TD; A-->B;" />)
    expect(screen.getByText('Rendering diagram...')).toBeInTheDocument()
    
    // Clean up pending promises
    await waitFor(() => {
      expect(screen.queryByText('Rendering diagram...')).not.toBeInTheDocument()
    })
  })

  it('renders SVG successfully', async () => {
    await act(async () => {
      render(<Mermaid chart="graph TD; A-->B;" />)
    })
    
    const container = document.querySelector('.mermaid-container')
    expect(container).toBeInTheDocument()
    expect(container?.innerHTML).toContain('<svg data-testid="mock-mermaid"></svg>')
  })
  
  it('renders error message when mermaid fails', async () => {
    mockRender.mockRejectedValueOnce(new Error('Syntax Error in graph'))
    
    // Mock getElementById to test stray element cleanup
    const mockRemove = jest.fn()
    jest.spyOn(document, 'getElementById').mockReturnValue({ remove: mockRemove } as any)
    
    await act(async () => {
      render(<Mermaid chart="graph TD; Error!" />)
    })
    
    expect(screen.getByText('Mermaid syntax error')).toBeInTheDocument()
    expect(screen.getByText('graph TD; Error!')).toBeInTheDocument()
    
    // Check error catch cleanup
    expect(mockRemove).toHaveBeenCalled()
  })

  it('cleans up on unmount', async () => {
    const mockRemove = jest.fn()
    jest.spyOn(document, 'getElementById').mockReturnValue({ remove: mockRemove } as any)
    
    let unmountFunc: any
    await act(async () => {
      const { unmount } = render(<Mermaid chart="graph TD; A-->B;" />)
      unmountFunc = unmount
    })
    
    unmountFunc()
    expect(mockRemove).toHaveBeenCalled()
  })
})
