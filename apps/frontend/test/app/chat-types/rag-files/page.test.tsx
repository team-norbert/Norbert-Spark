import { redirect } from 'next/navigation.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RagFilesPage from '@/app/chat-types/rag-files/[id]/page.js'

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

// Mock RagFilesPageClient component
vi.mock('@/app/chat-types/rag-files/[id]/RagFilesPageClient.js', () => ({
  RagFilesPageClient: vi.fn(() => ({
    type: 'RagFilesPageClient',
    props: {},
  })),
}))

const defaultParams = { params: { id: '019bda39-6197-7557-9071-d7ed1c719138' } }

describe('RagFilesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authorization Checks', () => {
    it('should call hasAnyRole with correct roles', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await RagFilesPage(defaultParams)

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
      expect(hasAnyRole).toHaveBeenCalledWith(['admin', 'ai-admin'])
    })

    it('should render RagFilesPageClient when user has admin role', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await RagFilesPage(defaultParams)

      expect(result).toBeDefined()
      expect(result.type).toBeDefined()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should render RagFilesPageClient when user has ai-admin role', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await RagFilesPage(defaultParams)

      expect(result).toBeDefined()
      expect(result.type).toBeDefined()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should redirect to signin when user is not authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(RagFilesPage(defaultParams)).rejects.toThrow('NEXT_REDIRECT')

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledTimes(1)
    })

    it('should not render RagFilesPageClient when user is not authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(RagFilesPage(defaultParams)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalled()
    })
  })

  describe('Role-Based Access Control', () => {
    it('should check for both admin and ai-admin roles', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await RagFilesPage(defaultParams)

      const calledWith = vi.mocked(hasAnyRole).mock.calls[0]?.[0]
      expect(calledWith).toEqual(['admin', 'ai-admin'])
      expect(calledWith).toHaveLength(2)
      expect(calledWith).toContain('admin')
      expect(calledWith).toContain('ai-admin')
    })

    it('should allow access when hasAnyRole returns true', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await RagFilesPage(defaultParams)

      expect(result).toBeDefined()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should deny access when hasAnyRole returns false', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(RagFilesPage(defaultParams)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalled()
    })
  })

  describe('Redirect URL Construction', () => {
    it('should include correct callback URL with the chat type id in redirect', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(RagFilesPage(defaultParams)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(
        expect.stringContaining(
          'callbackUrl=%2Fchat-types%2Frag-files%2F019bda39-6197-7557-9071-d7ed1c719138'
        )
      )
    })

    it('should include unauthorized error in redirect', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(RagFilesPage(defaultParams)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('error=unauthorized'))
    })

    it('should construct proper query string for redirect', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(RagFilesPage(defaultParams)).rejects.toThrow('NEXT_REDIRECT')

      const redirectCall = vi.mocked(redirect).mock.calls[0]?.[0]
      expect(redirectCall).toBe(
        '/signin?callbackUrl=%2Fchat-types%2Frag-files%2F019bda39-6197-7557-9071-d7ed1c719138&error=unauthorized'
      )
    })

    it('should encode the callback URL correctly', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(RagFilesPage(defaultParams)).rejects.toThrow('NEXT_REDIRECT')

      const redirectCall = vi.mocked(redirect).mock.calls[0]?.[0]
      expect(redirectCall).toMatch(/^\/signin\?/)
      expect(redirectCall).toMatch(/callbackUrl=/)
      expect(redirectCall).toMatch(/error=unauthorized/)
    })

    it('should include the dynamic id param in the callback URL', async () => {
      const customParams = { params: { id: 'abc-custom-id-123' } }
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(RagFilesPage(customParams)).rejects.toThrow('NEXT_REDIRECT')

      const redirectCall = vi.mocked(redirect).mock.calls[0]?.[0]
      expect(redirectCall).toContain('abc-custom-id-123')
    })

    it('should use different callback URLs for different chat type ids', async () => {
      const paramsA = { params: { id: 'id-aaa' } }
      const paramsB = { params: { id: 'id-bbb' } }

      vi.mocked(hasAnyRole).mockResolvedValue(false)

      await expect(RagFilesPage(paramsA)).rejects.toThrow('NEXT_REDIRECT')
      const firstRedirect = vi.mocked(redirect).mock.calls[0]?.[0]

      vi.clearAllMocks()
      vi.mocked(hasAnyRole).mockResolvedValue(false)

      await expect(RagFilesPage(paramsB)).rejects.toThrow('NEXT_REDIRECT')
      const secondRedirect = vi.mocked(redirect).mock.calls[0]?.[0]

      expect(firstRedirect).not.toBe(secondRedirect)
      expect(firstRedirect).toContain('id-aaa')
      expect(secondRedirect).toContain('id-bbb')
    })
  })

  describe('Component Rendering', () => {
    it('should return a React element when authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await RagFilesPage(defaultParams)

      expect(result).not.toBeNull()
      expect(result).not.toBeUndefined()
    })

    it('should render the RagFilesPageClient component when authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)
      const { RagFilesPageClient } =
        await import('@/app/chat-types/rag-files/[id]/RagFilesPageClient.js')

      const result = await RagFilesPage(defaultParams)

      // Server Components return a React element (React.createElement), not a direct function call
      expect(result.type).toBe(RagFilesPageClient)
    })

    it('should not render the RagFilesPageClient component when unauthorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)
      const { RagFilesPageClient } =
        await import('@/app/chat-types/rag-files/[id]/RagFilesPageClient.js')
      vi.mocked(RagFilesPageClient).mockClear()

      await expect(RagFilesPage(defaultParams)).rejects.toThrow('NEXT_REDIRECT')

      expect(RagFilesPageClient).not.toHaveBeenCalled()
    })
  })

  describe('Dynamic Route Parameter Handling', () => {
    it('should accept any string as the id param', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await RagFilesPage({ params: { id: 'some-arbitrary-id' } })

      expect(result).toBeDefined()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should use the id param from props when constructing the redirect URL', async () => {
      const specificId = 'my-specific-rag-chat-type'
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(RagFilesPage({ params: { id: specificId } })).rejects.toThrow('NEXT_REDIRECT')

      const redirectCall = vi.mocked(redirect).mock.calls[0]?.[0] as string
      const decoded = decodeURIComponent(redirectCall)
      expect(decoded).toContain(`/chat-types/rag-files/${specificId}`)
    })
  })

  describe('Integration', () => {
    it('should follow the complete authorization flow for authorized user', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const result = await RagFilesPage(defaultParams)

      expect(hasAnyRole).toHaveBeenCalledWith(['admin', 'ai-admin'])
      expect(redirect).not.toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(result.type).toBeDefined()
    })

    it('should follow the complete authorization flow for unauthorized user', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(RagFilesPage(defaultParams)).rejects.toThrow('NEXT_REDIRECT')

      expect(hasAnyRole).toHaveBeenCalledWith(['admin', 'ai-admin'])
      expect(redirect).toHaveBeenCalledWith(
        '/signin?callbackUrl=%2Fchat-types%2Frag-files%2F019bda39-6197-7557-9071-d7ed1c719138&error=unauthorized'
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle hasAnyRole throwing an error', async () => {
      vi.mocked(hasAnyRole).mockRejectedValueOnce(new Error('Auth service unavailable'))

      await expect(RagFilesPage(defaultParams)).rejects.toThrow('Auth service unavailable')

      expect(redirect).not.toHaveBeenCalled()
    })

    it('should call hasAnyRole exactly once per render', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      await RagFilesPage(defaultParams)

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
    })

    it('should call redirect exactly once when unauthorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(RagFilesPage(defaultParams)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledTimes(1)
    })

    it('should redirect to /signin path', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      await expect(RagFilesPage(defaultParams)).rejects.toThrow('NEXT_REDIRECT')

      const redirectCall = vi.mocked(redirect).mock.calls[0]?.[0] as string
      expect(redirectCall).toMatch(/^\/signin/)
    })
  })
})
