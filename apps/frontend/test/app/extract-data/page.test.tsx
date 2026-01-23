import { redirect } from 'next/navigation.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ExtractDataPage from '@/app/extract-data/page.js'
import { hasAnyRole } from '@/lib/auth.js'

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

// Mock ExtractDataPageClient component
vi.mock('@/app/extract-data/ExtractDataPageClient.js', () => ({
  ExtractDataPageClient: vi.fn(() => ({
    type: 'ExtractDataPageClient',
    props: {},
  })),
}))

describe('ExtractDataPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authorization Checks', () => {
    it('should call hasAnyRole with correct roles', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await ExtractDataPage()

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
      expect(hasAnyRole).toHaveBeenCalledWith(['user', 'admin', 'moderator'])
    })

    it.each(['user', 'admin', 'moderator'])(
      'should render ExtractDataPageClient when user has %s role',
      async () => {
        vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

        const result = await ExtractDataPage()

        expect(result).toBeDefined()
        expect(result).toBeTruthy()
        expect(redirect).not.toHaveBeenCalled()
      }
    )
    it('should redirect to signin when user is not authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ExtractDataPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledWith(
        '/signin?callbackUrl=%2Fextract-data&error=unauthorized'
      )
    })

    it('should not render ExtractDataPageClient when user is not authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ExtractDataPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalled()
      // Component should not be returned since redirect throws
    })
  })

  describe('Role-Based Access Control', () => {
    it('should check for user, admin, and moderator roles', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await ExtractDataPage()

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

      const result = await ExtractDataPage()

      expect(result).toBeDefined()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should deny access when hasAnyRole returns false', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ExtractDataPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalled()
    })
  })

  describe('Redirect Behavior', () => {
    it('should redirect with URL-encoded callback URL', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ExtractDataPage()).rejects.toThrow('NEXT_REDIRECT')

      const redirectUrl = vi.mocked(redirect).mock.calls[0]?.[0] as string
      expect(redirectUrl).toBe('/signin?callbackUrl=%2Fextract-data&error=unauthorized')
      expect(redirectUrl).toContain('callbackUrl=%2Fextract-data')
    })

    it('should include error parameter in redirect URL', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ExtractDataPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('error=unauthorized'))
    })

    it('should redirect to signin page', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ExtractDataPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/signin'))
    })
  })

  describe('Component Rendering', () => {
    it('should return ExtractDataPageClient component when authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await ExtractDataPage()

      expect(result).toBeDefined()
      expect(result).toBeTruthy()
    })

    it('should not return component when unauthorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ExtractDataPage()).rejects.toThrow()
    })
  })

  describe('Integration', () => {
    it('should follow the complete authorization flow for authorized user', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await ExtractDataPage()

      // Step 1: Check authorization
      expect(hasAnyRole).toHaveBeenCalledWith(['user', 'admin', 'moderator'])

      // Step 2: No redirect occurs
      expect(redirect).not.toHaveBeenCalled()

      // Step 3: Return the component
      expect(result).toBeDefined()
      expect(result).toBeTruthy()
    })

    it('should follow the complete authorization flow for unauthorized user', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ExtractDataPage()).rejects.toThrow('NEXT_REDIRECT')

      // Step 1: Check authorization
      expect(hasAnyRole).toHaveBeenCalledWith(['user', 'admin', 'moderator'])

      // Step 2: Redirect to signin with callback
      expect(redirect).toHaveBeenCalledWith(
        '/signin?callbackUrl=%2Fextract-data&error=unauthorized'
      )
    })
  })

  describe('Edge Cases', () => {
    it('should call hasAnyRole before attempting to return component', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await ExtractDataPage()

      expect(hasAnyRole).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should throw error with redirect URL when unauthorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ExtractDataPage()).rejects.toThrow(
        'NEXT_REDIRECT: /signin?callbackUrl=%2Fextract-data&error=unauthorized'
      )
    })

    it('should include URL-encoded callbackUrl in redirect URL', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ExtractDataPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('callbackUrl=%2Fextract-data'))
    })
  })

  describe('Authorization Sequence', () => {
    it('should check hasAnyRole before redirect', async () => {
      const callOrder: string[] = []

      vi.mocked(hasAnyRole).mockImplementation(async () => {
        callOrder.push('hasAnyRole')
        return false
      })

      vi.mocked(redirect).mockImplementation((url: string) => {
        callOrder.push('redirect')
        throw new Error(`NEXT_REDIRECT: ${url}`)
      })

      await expect(ExtractDataPage()).rejects.toThrow()

      expect(callOrder).toEqual(['hasAnyRole', 'redirect'])
    })

    it('should check hasAnyRole only once', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await ExtractDataPage()

      expect(vi.mocked(hasAnyRole).mock.calls.length).toBe(1)
    })

    it('should call hasAnyRole before attempting to return component', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await ExtractDataPage()

      expect(hasAnyRole).toHaveBeenCalled()
      expect(vi.mocked(hasAnyRole).mock.calls.length).toBeGreaterThan(0)
    })
  })
})
