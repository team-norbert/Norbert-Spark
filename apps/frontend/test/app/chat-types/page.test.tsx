import { redirect } from 'next/navigation.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ChatTypesPage from '@/app/chat-types/page.js'

// Mock the auth module
vi.mock('@/lib/auth/auth.js', () => ({
  hasAnyRole: vi.fn(),
}))

const { hasAnyRole } = await import('@/lib/auth/auth.js')

// Mock next/navigation - redirect needs to throw to simulate Next.js behavior
vi.mock('next/navigation.js', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`)
  }),
}))

// Mock ChatTypesPageClient component
vi.mock('@/app/chat-types/ChatTypesPageClient.js', () => ({
  ChatTypesPageClient: vi.fn(() => ({
    type: 'ChatTypesPageClient',
    props: {},
  })),
}))

describe('ChatTypesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authorization Checks', () => {
    it('should call hasAnyRole with correct roles', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await ChatTypesPage()

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
      expect(hasAnyRole).toHaveBeenCalledWith(['admin', 'ai-admin'])
    })

    it('should render ChatTypesPageClient when user has admin role', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await ChatTypesPage()

      expect(result).toBeDefined()
      expect(result.type).toBeDefined()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should render ChatTypesPageClient when user has ai-admin role', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await ChatTypesPage()

      expect(result).toBeDefined()
      expect(result.type).toBeDefined()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should redirect to signin when user is not authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ChatTypesPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledWith('/signin?callbackUrl=%2Fchat-types&error=unauthorized')
    })

    it('should not render ChatTypesPageClient when user is not authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ChatTypesPage()).rejects.toThrow('NEXT_REDIRECT')

      // The component should redirect before returning anything
      expect(redirect).toHaveBeenCalled()
    })
  })

  describe('Role-Based Access Control', () => {
    it('should check for both admin and ai-admin roles', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await ChatTypesPage()

      // Verify that hasAnyRole was called with an array containing both roles
      const calledWith = vi.mocked(hasAnyRole).mock.calls[0]?.[0]
      expect(calledWith).toEqual(['admin', 'ai-admin'])
      expect(calledWith).toHaveLength(2)
      expect(calledWith).toContain('admin')
      expect(calledWith).toContain('ai-admin')
    })

    it('should allow access when hasAnyRole returns true', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await ChatTypesPage()

      expect(result).toBeDefined()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should deny access when hasAnyRole returns false', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ChatTypesPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalled()
    })
  })

  describe('Redirect URL Construction', () => {
    it('should include correct callback URL in redirect', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ChatTypesPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('callbackUrl=%2Fchat-types'))
    })

    it('should include unauthorized error in redirect', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ChatTypesPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('error=unauthorized'))
    })

    it('should construct proper query string for redirect', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ChatTypesPage()).rejects.toThrow('NEXT_REDIRECT')

      const redirectCall = vi.mocked(redirect).mock.calls[0]?.[0]
      expect(redirectCall).toBe('/signin?callbackUrl=%2Fchat-types&error=unauthorized')
    })
  })

  describe('Integration', () => {
    it('should follow the complete authorization flow for authorized user', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await ChatTypesPage()

      // 1. hasAnyRole should be called first
      expect(hasAnyRole).toHaveBeenCalledWith(['admin', 'ai-admin'])

      // 2. redirect should NOT be called
      expect(redirect).not.toHaveBeenCalled()

      // 3. ChatTypesPageClient should be rendered
      expect(result).toBeDefined()
      expect(result.type).toBeDefined()
    })

    it('should follow the complete authorization flow for unauthorized user', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ChatTypesPage()).rejects.toThrow('NEXT_REDIRECT')

      // 1. hasAnyRole should be called first
      expect(hasAnyRole).toHaveBeenCalledWith(['admin', 'ai-admin'])

      // 2. redirect should be called with proper URL
      expect(redirect).toHaveBeenCalledWith('/signin?callbackUrl=%2Fchat-types&error=unauthorized')
    })
  })

  describe('Edge Cases', () => {
    it('should handle hasAnyRole throwing an error', async () => {
      vi.mocked(hasAnyRole).mockRejectedValueOnce(new Error('Auth service unavailable'))

      await expect(ChatTypesPage()).rejects.toThrow('Auth service unavailable')

      expect(redirect).not.toHaveBeenCalled()
    })

    it('should call hasAnyRole exactly once per render', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await ChatTypesPage()

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
    })

    it('should call redirect exactly once when unauthorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(ChatTypesPage()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledTimes(1)
    })
  })
})
