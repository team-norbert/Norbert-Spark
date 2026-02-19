import { render } from '@testing-library/react'
import { useRouter } from 'next/navigation.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIOptionsFormClient } from '@/app/ai-admin/[id]/AIOptionsFormClient.js'
import AIOptionsForm from '@/view/client-components/AIOptionsForm.js'

// Mock next/navigation to avoid "app router not mounted" error
vi.mock('next/navigation.js', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

// Mock the AIOptionsForm component (default export)
vi.mock('@/view/client-components/AIOptionsForm.js', () => ({
  default: vi.fn(() => <div data-testid="ai-options-form" />),
}))

describe('AIOptionsFormClient', () => {
  const mockChatTypeId = 'test-chat-type-id-123'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<
      typeof useRouter
    >)
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)
      expect(container).toBeInTheDocument()
    })

    it('should render the AIOptionsForm component', () => {
      render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)
      expect(AIOptionsForm).toHaveBeenCalledTimes(1)
    })

    it('should render the AIOptionsForm mock element', () => {
      const { getByTestId } = render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)
      expect(getByTestId('ai-options-form')).toBeInTheDocument()
    })
  })

  describe('Props Passing to AIOptionsForm', () => {
    it('should pass all expected props to AIOptionsForm', () => {
      render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)

      const props = vi.mocked(AIOptionsForm).mock.calls[0]?.[0]
      expect(props).toEqual({
        chatTypeId: mockChatTypeId,
        onNavigateHome: expect.any(Function),
        onSignOut: expect.any(Function),
      })
    })

    it('should pass chatTypeId to AIOptionsForm', () => {
      render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)

      const props = vi.mocked(AIOptionsForm).mock.calls[0]?.[0]
      expect(props?.chatTypeId).toBe(mockChatTypeId)
    })

    it('should pass onNavigateHome as a function', () => {
      render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)

      const props = vi.mocked(AIOptionsForm).mock.calls[0]?.[0]
      expect(typeof props?.onNavigateHome).toBe('function')
    })

    it('should pass onSignOut as a function', () => {
      render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)

      const props = vi.mocked(AIOptionsForm).mock.calls[0]?.[0]
      expect(typeof props?.onSignOut).toBe('function')
    })

    it('should forward different chatTypeId values correctly', () => {
      const altId = 'different-chat-type-id-456'
      render(<AIOptionsFormClient chatTypeId={altId} />)

      const props = vi.mocked(AIOptionsForm).mock.calls[0]?.[0]
      expect(props?.chatTypeId).toBe(altId)
    })
  })

  describe('Navigation Callbacks', () => {
    it('should call router.push with /dashboard when onNavigateHome is invoked', () => {
      const mockPush = vi.fn()
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<
        typeof useRouter
      >)

      render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)

      const props = vi.mocked(AIOptionsForm).mock.calls[0]?.[0]
      props?.onNavigateHome()

      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should call router.push with /api/auth/signout when onSignOut is invoked', () => {
      const mockPush = vi.fn()
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<
        typeof useRouter
      >)

      render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)

      const props = vi.mocked(AIOptionsForm).mock.calls[0]?.[0]
      props?.onSignOut()

      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/api/auth/signout')
    })

    it('should not call router.push on initial render', () => {
      const mockPush = vi.fn()
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<
        typeof useRouter
      >)

      render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should use independent push calls for home and signout navigation', () => {
      const mockPush = vi.fn()
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<
        typeof useRouter
      >)

      render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)

      const props = vi.mocked(AIOptionsForm).mock.calls[0]?.[0]
      props?.onNavigateHome()
      props?.onSignOut()

      expect(mockPush).toHaveBeenCalledTimes(2)
      expect(mockPush).toHaveBeenNthCalledWith(1, '/dashboard')
      expect(mockPush).toHaveBeenNthCalledWith(2, '/api/auth/signout')
    })
  })

  describe('Architecture Compliance', () => {
    it('should be a minimal orchestrator rendering AIOptionsForm exactly once', () => {
      render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)
      expect(AIOptionsForm).toHaveBeenCalledTimes(1)
    })

    it('should only pass the three expected props — no extra props', () => {
      render(<AIOptionsFormClient chatTypeId={mockChatTypeId} />)

      const props = vi.mocked(AIOptionsForm).mock.calls[0]?.[0]
      const propKeys = Object.keys(props ?? {})
      expect(propKeys).toHaveLength(3)
      expect(propKeys).toContain('chatTypeId')
      expect(propKeys).toContain('onNavigateHome')
      expect(propKeys).toContain('onSignOut')
    })
  })
})
