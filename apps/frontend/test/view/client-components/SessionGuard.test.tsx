import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionGuard } from '@/view/client-components/SessionGuard.js'

vi.mock('@/view/hooks/useSessionGuard.js', () => ({
  useSessionGuard: vi.fn(),
}))

describe('SessionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Children Rendering', () => {
    it('should render children', () => {
      render(
        <SessionGuard>
          <div data-testid="child-content">Protected Content</div>
        </SessionGuard>
      )

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <SessionGuard>
          <div data-testid="first">First</div>
          <div data-testid="second">Second</div>
        </SessionGuard>
      )

      expect(screen.getByTestId('first')).toBeInTheDocument()
      expect(screen.getByTestId('second')).toBeInTheDocument()
    })

    it('should render text content as children', () => {
      render(<SessionGuard>Plain text content</SessionGuard>)

      expect(screen.getByText('Plain text content')).toBeInTheDocument()
    })
  })

  describe('Hook Integration', () => {
    it('should call useSessionGuard on mount', async () => {
      const { useSessionGuard } = await import('@/view/hooks/useSessionGuard.js')

      render(
        <SessionGuard>
          <div>Content</div>
        </SessionGuard>
      )

      expect(useSessionGuard).toHaveBeenCalled()
    })
  })
})
