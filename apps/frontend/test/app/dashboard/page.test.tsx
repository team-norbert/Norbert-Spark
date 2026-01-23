import { redirect } from 'next/navigation.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '@/app/dashboard/page.js'
import { getAuthSession, hasAnyRole } from '@/lib/auth.js'

// Mock the auth module
vi.mock('@/lib/auth.js', () => ({
  hasAnyRole: vi.fn(),
  getAuthSession: vi.fn(),
}))

// Mock next/navigation - redirect needs to throw to simulate Next.js behavior
vi.mock('next/navigation.js', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`)
  }),
}))

// Mock DashboardPageClient component
vi.mock('@/app/dashboard/DashboardPageClient.js', () => ({
  DashboardPageClient: vi.fn(() => ({
    type: 'DashboardPageClient',
    props: {},
  })),
}))

// Mock logger
vi.mock('@/infrastructure/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock for getAuthSession
    vi.mocked(getAuthSession).mockResolvedValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user'],
      },
      accessToken: 'mock-access-token',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  })

  describe('Authorization Checks', () => {
    it('should call hasAnyRole with correct roles', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await DashboardPage()

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
      expect(hasAnyRole).toHaveBeenCalledWith(['user', 'admin', 'moderator'])
    })

    it('should render DashboardPageClient when user is authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await DashboardPage()

      expect(result).toBeDefined()
      expect(result).toBeTruthy()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should redirect to signin when user is not authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(DashboardPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledWith('/signin?callbackUrl=%2Fdashboard&error=unauthorized')
    })

    it('should not render DashboardPageClient when user is not authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(DashboardPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalled()
      // Component should not be returned since redirect throws
    })
  })

  describe('Role-Based Access Control', () => {
    it('should check for user, admin, and moderator roles', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await DashboardPage()

      // Verify that hasAnyRole was called with an array containing all three roles
      const calledWith = vi.mocked(hasAnyRole).mock.calls[0]?.[0]
      expect(calledWith).toEqual(['user', 'admin', 'moderator'])
      expect(calledWith).toHaveLength(3)
      expect(calledWith).toContain('user')
      expect(calledWith).toContain('admin')
      expect(calledWith).toContain('moderator')
    })

    it('should allow access when hasAnyRole returns true', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await DashboardPage()

      expect(result).toBeDefined()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should deny access when hasAnyRole returns false', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(DashboardPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalled()
    })
  })

  describe('Redirect Behavior', () => {
    it('should redirect with URL-encoded callback URL', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(DashboardPage()).rejects.toThrow('NEXT_REDIRECT')

      const redirectUrl = vi.mocked(redirect).mock.calls[0]?.[0] as string
      expect(redirectUrl).toBe('/signin?callbackUrl=%2Fdashboard&error=unauthorized')
      expect(redirectUrl).toContain('callbackUrl=%2Fdashboard')
    })

    it('should include error parameter in redirect URL', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(DashboardPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('error=unauthorized'))
    })

    it('should redirect to signin page', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(DashboardPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/signin'))
    })
  })

  describe('Component Rendering', () => {
    it('should return DashboardPageClient component when authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await DashboardPage()

      expect(result).toBeDefined()
      expect(result).toBeTruthy()
    })

    it('should not return component when unauthorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(DashboardPage()).rejects.toThrow()
    })
  })

  describe('Session Handling', () => {
    it('should call getAuthSession', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await DashboardPage()

      expect(getAuthSession).toHaveBeenCalledTimes(1)
    })

    it('should continue even if session is null', async () => {
      vi.mocked(getAuthSession).mockResolvedValueOnce(null)
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await DashboardPage()

      expect(result).toBeDefined()
    })
  })

  describe('Integration', () => {
    it('should follow the complete authorization flow for authorized user', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await DashboardPage()

      // Step 1: Get session
      expect(getAuthSession).toHaveBeenCalled()

      // Step 2: Check authorization
      expect(hasAnyRole).toHaveBeenCalledWith(['user', 'admin', 'moderator'])

      // Step 3: No redirect occurs
      expect(redirect).not.toHaveBeenCalled()

      // Step 4: Return the component
      expect(result).toBeDefined()
      expect(result).toBeTruthy()
    })

    it('should follow the complete authorization flow for unauthorized user', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(DashboardPage()).rejects.toThrow('NEXT_REDIRECT')

      // Step 1: Get session
      expect(getAuthSession).toHaveBeenCalled()

      // Step 2: Check authorization
      expect(hasAnyRole).toHaveBeenCalledWith(['user', 'admin', 'moderator'])

      // Step 3: Redirect to signin with callback
      expect(redirect).toHaveBeenCalledWith('/signin?callbackUrl=%2Fdashboard&error=unauthorized')
    })
  })

  describe('Edge Cases', () => {
    it('should call hasAnyRole before attempting to return component', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await DashboardPage()

      expect(hasAnyRole).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should throw error with redirect URL when unauthorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(DashboardPage()).rejects.toThrow(
        'NEXT_REDIRECT: /signin?callbackUrl=%2Fdashboard&error=unauthorized'
      )
    })

    it('should include URL-encoded callbackUrl in redirect URL', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(DashboardPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('callbackUrl=%2Fdashboard'))
    })
  })

  describe('Authorization Sequence', () => {
    it('should get session before checking hasAnyRole', async () => {
      const callOrder: string[] = []

      vi.mocked(getAuthSession).mockImplementation(async () => {
        callOrder.push('getAuthSession')
        return {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            roles: ['user'],
          },
          accessToken: 'mock-access-token',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }
      })

      vi.mocked(hasAnyRole).mockImplementation(async () => {
        callOrder.push('hasAnyRole')
        return true
      })

      await DashboardPage()

      expect(callOrder).toEqual(['getAuthSession', 'hasAnyRole'])
    })

    it('should check hasAnyRole before redirect when unauthorized', async () => {
      const callOrder: string[] = []

      vi.mocked(hasAnyRole).mockImplementation(async () => {
        callOrder.push('hasAnyRole')
        return false
      })

      vi.mocked(redirect).mockImplementation((url: string) => {
        callOrder.push('redirect')
        throw new Error(`NEXT_REDIRECT: ${url}`)
      })

      await expect(DashboardPage()).rejects.toThrow()

      expect(callOrder).toContain('hasAnyRole')
      expect(callOrder).toContain('redirect')
      expect(callOrder.indexOf('hasAnyRole')).toBeLessThan(callOrder.indexOf('redirect'))
    })

    it('should check hasAnyRole only once', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await DashboardPage()

      expect(vi.mocked(hasAnyRole).mock.calls.length).toBe(1)
    })

    it('should call hasAnyRole before attempting to return component', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await DashboardPage()

      expect(hasAnyRole).toHaveBeenCalled()
      expect(vi.mocked(hasAnyRole).mock.calls.length).toBeGreaterThan(0)
    })
  })
})
