import { redirect } from 'next/navigation.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AIAdminDetailPage from '@/app/ai-admin/[id]/page.js'
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

// Mock AIOptionsForm component
vi.mock('@/view/client-components/AIOptionsForm.js', () => ({
  default: vi.fn((props: { chatTypeId: string }) => ({
    type: 'AIOptionsForm',
    props,
  })),
}))

describe('AIAdminDetailPage', () => {
  const mockId = '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authorization Checks', () => {
    it('should call hasAnyRole with correct roles', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const params = Promise.resolve({ id: mockId })
      await AIAdminDetailPage({ params })

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
      expect(hasAnyRole).toHaveBeenCalledWith(['admin', 'ai-admin'])
    })

    it('should render AIOptionsForm when user has admin role', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const params = Promise.resolve({ id: mockId })
      const result = await AIAdminDetailPage({ params })

      expect(result).toBeDefined()
      // The result should be a JSX element with the AIOptionsForm as its type
      expect(result).toHaveProperty('props')
      expect(result.props).toHaveProperty('chatTypeId', mockId)
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should render AIOptionsForm when user has ai-admin role', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const params = Promise.resolve({ id: mockId })
      const result = await AIAdminDetailPage({ params })

      // The result should be a JSX element with props
      expect(result).toHaveProperty('props')
      expect(result.props).toHaveProperty('chatTypeId', mockId)
    })

    it('should redirect to signin when user is not authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      const params = Promise.resolve({ id: mockId })

      await expect(AIAdminDetailPage({ params })).rejects.toThrow('NEXT_REDIRECT')

      expect(hasAnyRole).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledWith(
        `/signin?callbackUrl=%2Fai-admin%2F${mockId}&error=unauthorized`
      )
    })

    it('should not render AIOptionsForm when user is not authorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      const params = Promise.resolve({ id: mockId })

      await expect(AIAdminDetailPage({ params })).rejects.toThrow('NEXT_REDIRECT')

      // The component should redirect before returning anything
      expect(redirect).toHaveBeenCalled()
    })
  })

  describe('Params Handling', () => {
    it('should await params promise and extract id correctly', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const mockParams = Promise.resolve({ id: mockId })
      const result = await AIAdminDetailPage({ params: mockParams })

      expect(result).toHaveProperty('props.chatTypeId', mockId)
    })

    it('should handle different chat type IDs', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const differentId = '01942f8e-67a4-7c3d-8e5f-6a7b8c9d0e1f'
      const params = Promise.resolve({ id: differentId })
      const result = await AIAdminDetailPage({ params })

      expect(result).toHaveProperty('props.chatTypeId', differentId)
    })

    it('should include id in callback URL when redirecting', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      const specificId = '01942f8e-67a5-7d4e-9f6a-7b8c9d0e1f2a'
      const params = Promise.resolve({ id: specificId })

      await expect(AIAdminDetailPage({ params })).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(
        `/signin?callbackUrl=%2Fai-admin%2F${specificId}&error=unauthorized`
      )
    })
  })

  describe('Role-Based Access Control', () => {
    it('should check for both admin and ai-admin roles', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const params = Promise.resolve({ id: mockId })
      await AIAdminDetailPage({ params })

      // Verify that hasAnyRole was called with an array containing both roles
      const calledWith = vi.mocked(hasAnyRole).mock.calls[0]?.[0]
      expect(calledWith).toEqual(['admin', 'ai-admin'])
      expect(calledWith).toHaveLength(2)
      expect(calledWith).toContain('admin')
      expect(calledWith).toContain('ai-admin')
    })

    it('should allow access when hasAnyRole returns true', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const params = Promise.resolve({ id: mockId })
      const result = await AIAdminDetailPage({ params })

      expect(result).toBeDefined()
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should deny access when hasAnyRole returns false', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      const params = Promise.resolve({ id: mockId })

      await expect(AIAdminDetailPage({ params })).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalled()
    })
  })

  describe('Integration', () => {
    it('should follow the complete authorization flow for authorized user', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const params = Promise.resolve({ id: mockId })
      const result = await AIAdminDetailPage({ params })

      // Step 1: Check authorization
      expect(hasAnyRole).toHaveBeenCalledWith(['admin', 'ai-admin'])

      // Step 2: No redirect occurs
      expect(redirect).not.toHaveBeenCalled()

      // Step 3: Return the form component with correct props
      expect(result).toHaveProperty('props')
      expect(result.props).toHaveProperty('chatTypeId', mockId)

      // Step 4: Return value is defined
      expect(result).toBeDefined()
    })

    it('should follow the complete authorization flow for unauthorized user', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      const params = Promise.resolve({ id: mockId })

      await expect(AIAdminDetailPage({ params })).rejects.toThrow('NEXT_REDIRECT')

      // Step 1: Check authorization
      expect(hasAnyRole).toHaveBeenCalledWith(['admin', 'ai-admin'])

      // Step 2: Redirect to signin with callback
      expect(redirect).toHaveBeenCalledWith(
        `/signin?callbackUrl=%2Fai-admin%2F${mockId}&error=unauthorized`
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle params resolution correctly', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      // Test with async params
      const asyncParams = new Promise<{ id: string }>((resolve) => {
        setTimeout(() => resolve({ id: mockId }), 0)
      })

      const result = await AIAdminDetailPage({ params: asyncParams })

      expect(result.props).toHaveProperty('chatTypeId', mockId)
    })

    it('should call hasAnyRole before attempting to return component', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(true)

      const params = Promise.resolve({ id: mockId })
      const result = await AIAdminDetailPage({ params })

      expect(hasAnyRole).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should throw error with redirect URL when unauthorized', async () => {
      vi.mocked(hasAnyRole).mockResolvedValueOnce(false)

      const params = Promise.resolve({ id: mockId })

      await expect(AIAdminDetailPage({ params })).rejects.toThrow(
        `NEXT_REDIRECT: /signin?callbackUrl=%2Fai-admin%2F${mockId}&error=unauthorized`
      )
    })
  })
})
