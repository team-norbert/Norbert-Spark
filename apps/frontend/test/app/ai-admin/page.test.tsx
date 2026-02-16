import { redirect } from 'next/navigation.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AIAdminPage from '@/app/ai-admin/page.js'
import { hasAnyRole } from '@/lib/auth/auth.js'

// Mock the auth module
vi.mock('@/lib/auth.js', () => ({
  hasAnyRole: vi.fn(),
}))

// Mock next/navigation - redirect needs to throw to simulate Next.js behavior
vi.mock('next/navigation.js', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`)
  }),
}))

// Mock AIAdminPageClient component
vi.mock('@/app/ai-admin/AIAdminPageClient.js', () => ({
  AIAdminPageClient: vi.fn(() => ({
    type: 'AIAdminPageClient',
    props: {},
  })),
}))

describe('AIAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authorization Checks', () => {
    it('should call hasAnyRole with correct roles', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await AIAdminPage()

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
      expect(hasAnyRole).toHaveBeenCalledWith(['admin', 'ai-admin'])
    })

    it('should render AIAdminPageClient when user has admin role', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await AIAdminPage()

      expect(result).toBeDefined()
      // The result is a JSX element (React element)
      expect(result).toBeTruthy()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should render AIAdminPageClient when user has ai-admin role', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await AIAdminPage()

      expect(result).toBeDefined()
      // The result is a JSX element (React element)
      expect(result).toBeTruthy()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should redirect to signin when user is not authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(AIAdminPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledWith('/signin?callbackUrl=%2Fai-admin&error=unauthorized')
    })

    it('should not render AIAdminPageClient when user is not authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(AIAdminPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalled()
      // Component should not be returned since redirect throws
    })
  })

  describe('Role-Based Access Control', () => {
    it('should check for both admin and ai-admin roles', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await AIAdminPage()

      // Verify that hasAnyRole was called with an array containing both roles
      const calledWith = vi.mocked(hasAnyRole).mock.calls[0]?.[0]
      expect(calledWith).toEqual(['admin', 'ai-admin'])
      expect(calledWith).toHaveLength(2)
      expect(calledWith).toContain('admin')
      expect(calledWith).toContain('ai-admin')
    })

    it('should allow access when hasAnyRole returns true', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await AIAdminPage()

      expect(result).toBeDefined()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should deny access when hasAnyRole returns false', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(AIAdminPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalled()
    })

    it('should redirect with correct callback URL for unauthorized users', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(AIAdminPage()).rejects.toThrow('NEXT_REDIRECT')

      const redirectUrl = vi.mocked(redirect).mock.calls[0]?.[0]
      expect(redirectUrl).toBe('/signin?callbackUrl=%2Fai-admin&error=unauthorized')
      expect(redirectUrl).toContain('callbackUrl=%2Fai-admin')
      expect(redirectUrl).toContain('error=unauthorized')
    })
  })

  describe('Integration', () => {
    it('should follow the complete authorization flow for authorized user', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await AIAdminPage()

      // Step 1: Check authorization
      expect(hasAnyRole).toHaveBeenCalledWith(['admin', 'ai-admin'])

      // Step 2: No redirect occurs
      expect(redirect).not.toHaveBeenCalled()

      // Step 3: Return the client component (JSX element)
      expect(result).toBeDefined()
      expect(result).toBeTruthy()

      // Step 4: Return value is defined
      expect(result).toBeDefined()
    })

    it('should follow the complete authorization flow for unauthorized user', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(AIAdminPage()).rejects.toThrow('NEXT_REDIRECT')

      // Step 1: Check authorization
      expect(hasAnyRole).toHaveBeenCalledWith(['admin', 'ai-admin'])

      // Step 2: Redirect to signin with callback
      expect(redirect).toHaveBeenCalledWith('/signin?callbackUrl=%2Fai-admin&error=unauthorized')
    })
  })

  describe('Redirect Behavior', () => {
    it('should include error=unauthorized parameter in redirect URL', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(AIAdminPage()).rejects.toThrow(
        'NEXT_REDIRECT: /signin?callbackUrl=%2Fai-admin&error=unauthorized'
      )

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('error=unauthorized'))
    })

    it('should include URL-encoded callbackUrl in redirect URL', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(AIAdminPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('callbackUrl=%2Fai-admin'))
    })

    it('should redirect to /signin path', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(AIAdminPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringMatching(/^\/signin\?/))
    })
  })

  describe('Component Rendering', () => {
    it('should return AIAdminPageClient component when authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await AIAdminPage()

      expect(result).toBeDefined()
      expect(result).toBeTruthy()
    })

    it('should not return any component when unauthorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      // The function should throw before returning anything
      await expect(AIAdminPage()).rejects.toThrow()

      // Verify redirect was called (which throws)
      expect(redirect).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle hasAnyRole promise resolution', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await AIAdminPage()

      expect(result).toBeDefined()
      expect(hasAnyRole).toHaveBeenCalled()
    })

    it('should call hasAnyRole before attempting to return component', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await AIAdminPage()

      expect(hasAnyRole).toHaveBeenCalled()
      // hasAnyRole should be called before any component rendering
      expect(vi.mocked(hasAnyRole).mock.calls.length).toBeGreaterThan(0)
    })

    it('should throw error immediately when unauthorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      const promise = AIAdminPage()

      await expect(promise).rejects.toThrow('NEXT_REDIRECT')
    })

    it('should not call redirect when authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await AIAdminPage()

      expect(redirect).not.toHaveBeenCalled()
    })
  })

  describe('Authorization Sequence', () => {
    it('should check authorization before rendering', async () => {
      const callOrder: string[] = []

      vi.mocked(hasAnyRole).mockImplementation(async () => {
        callOrder.push('hasAnyRole')
        return true
      })

      await AIAdminPage()

      expect(callOrder[0]).toBe('hasAnyRole')
      expect(hasAnyRole).toHaveBeenCalled()
    })

    it('should only call hasAnyRole once per render', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await AIAdminPage()

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
    })

    it('should check roles before any redirect attempt', async () => {
      const callOrder: string[] = []

      vi.mocked(hasAnyRole).mockImplementationOnce(async () => {
        callOrder.push('hasAnyRole')
        return false
      })

      vi.mocked(redirect).mockImplementationOnce((url: string) => {
        callOrder.push('redirect')
        throw new Error(`NEXT_REDIRECT: ${url}`)
      })

      await expect(AIAdminPage()).rejects.toThrow()

      // hasAnyRole should be called before redirect
      expect(callOrder).toEqual(['hasAnyRole', 'redirect'])
      expect(hasAnyRole).toHaveBeenCalled()
      expect(redirect).toHaveBeenCalled()
    })
  })
})
