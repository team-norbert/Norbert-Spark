import type { Session, User as NextAuthUser } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock next-auth types
vi.mock('next-auth', () => ({
  default: vi.fn(),
}))

describe('authOptions Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // Set backend URL for tests
    process.env.BACKEND_AI_CALLBACK_URL = 'http://localhost:3000'
    // Set OAuth sync secret for tests
    process.env.OAUTH_SYNC_SECRET = 'test-secret-key'
    // Reset modules to get fresh config
    vi.resetModules()
  })

  // Import after mocks are set up
  const getAuthOptions = async () => {
    const module = await import('@/lib/auth/auth-config.js')
    return module.authOptions
  }

  describe('Configuration Structure', () => {
    it('should have correct session strategy', async () => {
      const authOptions = await getAuthOptions()
      expect(authOptions.session?.strategy).toBe('jwt')
    })

    it('should have 30-day session maxAge', async () => {
      const authOptions = await getAuthOptions()
      expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60)
    })

    it('should have 30-day jwt maxAge', async () => {
      const authOptions = await getAuthOptions()
      expect(authOptions.jwt?.maxAge).toBe(30 * 24 * 60 * 60)
    })

    it('should have custom pages configured', async () => {
      const authOptions = await getAuthOptions()
      expect(authOptions.pages?.signIn).toBe('/signin')
      expect(authOptions.pages?.error).toBe('/error')
    })

    it('should have providers configured', async () => {
      const authOptions = await getAuthOptions()
      expect(authOptions.providers).toBeDefined()
      expect(authOptions.providers).toHaveLength(2) // Google + Credentials
    })

    it('should have callbacks configured', async () => {
      const authOptions = await getAuthOptions()
      expect(authOptions.callbacks).toBeDefined()
      expect(authOptions.callbacks?.jwt).toBeDefined()
      expect(authOptions.callbacks?.session).toBeDefined()
    })
  })

  describe('CredentialsProvider authorize', () => {
    const getAuthorizeFunction = async () => {
      const authOptions = await getAuthOptions()
      // Credentials provider is now at index 1 (Google is at 0)
      const provider = authOptions.providers[1]
      // @ts-expect-error - accessing internal provider structure
      return provider.options?.authorize
    }

    it('should throw error when credentials are missing', async () => {
      const authorize = await getAuthorizeFunction()

      await expect(authorize(undefined, {})).rejects.toThrow('Missing credentials')
    })

    it('should throw error when email is missing', async () => {
      const authorize = await getAuthorizeFunction()

      await expect(
        authorize(
          {
            email: '',
            password: 'password123',
          },
          {}
        )
      ).rejects.toThrow('Missing credentials')
    })

    it('should throw error when password is missing', async () => {
      const authorize = await getAuthorizeFunction()

      await expect(
        authorize(
          {
            email: 'test@example.com',
            password: '',
          },
          {}
        )
      ).rejects.toThrow('Missing credentials')
    })

    it('should successfully authenticate with valid credentials', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          accessToken: 'mock-jwt-token',
          roles: ['user'],
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      const result = await authorize(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        {}
      )

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        accessToken: 'mock-jwt-token',
        roles: ['user'],
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!

      expect(url).toContain('/auth/login')
      expect(options.method).toBe('POST')
      expect(options.body).toBe(
        JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        })
      )
      expect(options.headers).toBeInstanceOf(Headers)
      expect(options.headers.get('Content-Type')).toBe('application/json')
    })

    // TODO: Fix test - BACKEND_AI_CALLBACK_URL is undefined or not correctly loaded in test environment
    it.todo('should use BACKEND_AI_CALLBACK_URL environment variable', async () => {
      const customBackendUrl = 'https://api.example.com'
      const originalEnv = process.env.BACKEND_AI_CALLBACK_URL
      process.env.BACKEND_AI_CALLBACK_URL = customBackendUrl

      // Re-import with new env var
      vi.resetModules()
      const { authOptions } = await import('@/lib/auth/auth-config.js')
      const provider = authOptions.providers[0]
      // @ts-expect-error - accessing internal provider structure
      const authorize = provider.options?.authorize

      const mockResponse = {
        success: true,
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          accessToken: 'token',
          roles: ['user'],
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await authorize(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        {}
      )

      expect(global.fetch).toHaveBeenCalledWith(
        `${customBackendUrl}/auth/login`,
        expect.any(Object)
      )

      process.env.BACKEND_AI_CALLBACK_URL = originalEnv
    })

    it('should throw error when backend returns error', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      await expect(
        authorize(
          {
            email: 'test@example.com',
            password: 'wrongpassword',
          },
          {}
        )
      ).rejects.toThrow('Invalid credentials')
    })

    it('should throw generic error when backend returns no error message', async () => {
      const mockResponse = {
        success: false,
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      await expect(
        authorize(
          {
            email: 'test@example.com',
            password: 'wrongpassword',
          },
          {}
        )
      ).rejects.toThrow('Authentication failed')
    })

    it('should return null when response lacks accessToken', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          roles: ['user'],
          // missing accessToken
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      const result = await authorize(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        {}
      )

      expect(result).toBeNull()
    })

    it('should return null when response data is undefined', async () => {
      const mockResponse = {
        success: true,
        // data is undefined
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      const result = await authorize(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        {}
      )

      expect(result).toBeNull()
    })

    it('should handle fetch network errors', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

      const authorize = await getAuthorizeFunction()

      await expect(
        authorize(
          {
            email: 'test@example.com',
            password: 'password123',
          },
          {}
        )
      ).rejects.toThrow('Network error')

      expect(console.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication error:',
          method: 'ERROR',
          prefix: '[[auth-config]] ',
        }),
        expect.any(Error)
      )
    })

    it('should handle multiple roles from backend', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 'user-123',
          email: 'admin@example.com',
          accessToken: 'admin-token',
          roles: ['user', 'admin', 'moderator'],
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      const result = await authorize(
        {
          email: 'admin@example.com',
          password: 'password123',
        },
        {}
      )

      expect(result).toEqual({
        id: 'user-123',
        email: 'admin@example.com',
        accessToken: 'admin-token',
        roles: ['user', 'admin', 'moderator'],
      })
    })

    it('should default to empty roles array when roles are missing', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          accessToken: 'token',
          // roles missing
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      const result = await authorize(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        {}
      )

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        accessToken: 'token',
        roles: [],
      })
    })
  })

  describe('signIn Callback', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should call OAuth sync for Google provider with correct headers and body', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        refreshToken: '',
        expiresInSeconds: 0,
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        email: 'google@example.com',
        name: 'Google User',
        sub: 'google-123',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            userId: 'user-123',
            email: 'google@example.com',
            accessToken: 'oauth-access-token',
            refreshToken: 'a'.repeat(64),
            expiresInSeconds: 3600,
            roles: ['user'],
          },
        }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/oauth-sync',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            provider: 'google',
            providerId: 'user-123',
            email: 'google@example.com',
            name: 'Google User',
            roles: 'user',
          }),
        })
      )

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
      const options = fetchCall[1]
      expect(options.headers).toBeInstanceOf(Headers)
      expect(options.headers.get('Content-Type')).toBe('application/json')
      expect(options.headers.get('X-OAuth-Sync-Secret')).toBe(process.env.OAUTH_SYNC_SECRET)
    })

    it('should not call OAuth sync for credentials provider', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: null,
        accessToken: '',
        refreshToken: '',
        expiresInSeconds: 0,
        roles: [],
      }

      const mockAccount = {
        provider: 'credentials',
        providerAccountId: 'user-123',
        type: 'credentials' as const,
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: undefined,
      })

      expect(result).toBe(true)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should not call OAuth sync when profile email is missing', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        refreshToken: '',
        expiresInSeconds: 0,
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        name: 'Google User',
        sub: 'google-123',
        // email is missing
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      expect(result).toBe(true)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should not call OAuth sync when account is missing', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        refreshToken: '',
        expiresInSeconds: 0,
        roles: [],
      }

      const mockProfile = {
        email: 'google@example.com',
        name: 'Google User',
        sub: 'google-123',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: null,
        profile: mockProfile,
      })

      expect(result).toBe(true)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should redirect to error page when OAuth sync fails', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        refreshToken: '',
        expiresInSeconds: 0,
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        email: 'google@example.com',
        name: 'Google User',
        sub: 'google-123',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: 'Internal server error' }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      expect(result).toBe('/error?code=500&message=Internal%20server%20error')
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should display backend error message for duplicate email', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'existing@example.com',
        emailVerified: null,
        accessToken: '',
        refreshToken: '',
        expiresInSeconds: 0,
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        email: 'existing@example.com',
        name: 'Existing User',
        sub: 'google-123',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ success: false, error: 'User with this email already exists' }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      expect(result).toBe('/error?code=409&message=User%20with%20this%20email%20already%20exists')
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should redirect to error page for network errors', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        refreshToken: '',
        expiresInSeconds: 0,
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        email: 'google@example.com',
        name: 'Google User',
        sub: 'google-123',
      }

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      expect(result).toBe(
        '/error?code=500&message=OAuth%20authentication%20error.%20Please%20try%20again.'
      )
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should include user name in sync request when available', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        refreshToken: '',
        expiresInSeconds: 0,
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        email: 'google@example.com',
        name: 'Test User Name',
        sub: 'google-123',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            userId: 'user-123',
            email: 'google@example.com',
            accessToken: 'oauth-access-token',
            refreshToken: 'c'.repeat(64),
            expiresInSeconds: 3600,
            roles: ['user'],
          },
        }),
      })

      await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
      const body = JSON.parse(fetchCall[1].body) as { name?: string }
      expect(body.name).toBe('Test User Name')
    })

    it('should handle OAuth sync without user name', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        refreshToken: '',
        expiresInSeconds: 0,
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        email: 'google@example.com',
        sub: 'google-123',
        // name is missing
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            userId: 'user-123',
            email: 'google@example.com',
            accessToken: 'oauth-access-token',
            refreshToken: 'b'.repeat(64),
            expiresInSeconds: 3600,
            roles: ['user'],
          },
        }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(1)

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
      const body = JSON.parse(fetchCall[1].body) as { name?: string }
      expect(body.name).toBeUndefined()
    })
  })

  describe('JWT Callback', () => {
    it('should add user data to token on initial sign in', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        accessToken: 'mock-token',
        refreshToken: 'a'.repeat(64),
        expiresInSeconds: 3600,
        roles: ['user'],
      }

      const mockToken = {
        accessToken: '',
        id: '',
        roles: [],
        refreshToken: '',
        accessTokenExp: 0,
      } as JWT

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        user: mockUser as NextAuthUser,
        trigger: 'signIn',
        session: undefined,
        account: {
          provider: 'credentials',
          type: 'credentials',
          providerAccountId: 'test-account-id',
        },
        profile: undefined,
      })

      expect(result).toEqual({
        accessToken: 'mock-token',
        id: 'user-123',
        roles: ['user'],
        refreshToken: 'a'.repeat(64),
        accessTokenExp: expect.any(Number),
      })
      expect(result.accessTokenExp).toBeGreaterThan(Date.now())
    })

    it('should return token unchanged when user is not provided', async () => {
      const authOptions = await getAuthOptions()

      const mockToken = {
        accessToken: 'existing-token',
        id: 'user-456',
        roles: ['admin'],
        refreshToken: 'b1c2d3e4f5a6b1c2d3e4f5a6b1c2d3e4f5a6b1c2d3e4f5a6b1c2d3e4f5a6b1c2',
        accessTokenExp: Date.now() + 3600 * 1000,
      }

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        // @ts-expect-error - Testing undefined user scenario in update trigger
        user: undefined,
        trigger: 'update',
        session: undefined,
      })

      expect(result).toEqual(mockToken)
    })

    it('should preserve existing token properties when user is not provided', async () => {
      const authOptions = await getAuthOptions()

      const mockToken = {
        accessToken: 'token',
        id: 'user-789',
        roles: ['user'],
        refreshToken: 'c2d3e4f5a6b1c2d3e4f5a6b1c2d3e4f5a6b1c2d3e4f5a6b1c2d3e4f5a6b1c2d3',
        accessTokenExp: Date.now() + 3600 * 1000,
        sub: 'user-789',
        iat: 1234567890,
        exp: 1234567890 + 30 * 24 * 60 * 60,
      }

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        // @ts-expect-error - Testing undefined user scenario in update trigger
        user: undefined,
        trigger: 'update',
        session: undefined,
      })

      expect(result).toEqual(mockToken)
    })

    it('should handle user with multiple roles', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        accessToken: 'admin-token',
        refreshToken: 'b'.repeat(64),
        expiresInSeconds: 3600,
        roles: ['user', 'admin', 'superuser'],
      }

      const mockToken = {
        accessToken: '',
        id: '',
        roles: [],
        refreshToken: '',
        accessTokenExp: 0,
      } as JWT

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        user: mockUser as NextAuthUser,
        trigger: 'signIn',
        session: undefined,
        account: {
          provider: 'credentials',
          type: 'credentials',
          providerAccountId: 'test-account-id',
        },
        profile: undefined,
      })

      expect(result.roles).toEqual(['user', 'admin', 'superuser'])
    })

    it('should set token.error on OAuth sync cache miss', async () => {
      vi.resetModules()
      const { authOptions } = await import('@/lib/auth/auth-config.js')

      const mockUser = {
        id: 'google-123',
        email: 'google@example.com',
        name: 'Google User',
        accessToken: '',
        roles: [],
      }

      const mockToken = {
        accessToken: '',
        id: '',
        roles: [],
        refreshToken: '',
        accessTokenExp: 0,
      } as JWT

      // No prior oauthSyncCache.set() call, so this is a cache miss
      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        user: mockUser as unknown as NextAuthUser,
        trigger: 'signIn',
        session: undefined,
        account: {
          provider: 'google',
          type: 'oauth',
          providerAccountId: 'google-123',
        },
        profile: undefined,
      })

      expect(result.error).toBe('OAuthSyncCacheMiss')
    })

    it('should read OAuth tokens from oauthSyncCache and clear the entry after consumption', async () => {
      vi.resetModules()
      const { authOptions } = await import('@/lib/auth/auth-config.js')

      const mockUser = {
        id: 'google-123',
        email: 'oauth@example.com',
        name: 'OAuth User',
        emailVerified: null,
        accessToken: '',
        refreshToken: '',
        expiresInSeconds: 0,
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        email: 'oauth@example.com',
        name: 'OAuth User',
        sub: 'google-123',
      }

      const syncData = {
        userId: 'backend-user-456',
        email: 'oauth@example.com',
        accessToken: 'backend-access-token',
        refreshToken: 'r'.repeat(64),
        expiresInSeconds: 3600,
        roles: ['user'],
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: syncData }),
      })

      // Step 1: signIn populates the oauthSyncCache
      await authOptions.callbacks!.signIn!({
        user: mockUser as unknown as NextAuthUser,
        account: mockAccount,
        profile: mockProfile,
      })

      const mockToken = {
        accessToken: '',
        id: '',
        roles: [],
        refreshToken: '',
        accessTokenExp: 0,
      } as JWT

      // Step 2: jwt reads from cache and populates the token
      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        user: mockUser as unknown as NextAuthUser,
        trigger: 'signIn',
        session: undefined,
        account: mockAccount,
        profile: undefined,
      })

      expect(result.accessToken).toBe('backend-access-token')
      expect(result.refreshToken).toBe('r'.repeat(64))
      expect(result.id).toBe('backend-user-456')
      expect(result.roles).toEqual(['user'])
      expect(result.accessTokenExp).toBeGreaterThan(Date.now())
      expect(result.error).toBeUndefined()

      // Step 3: Verify cache is cleared — a second jwt call for the same user is a cache miss
      const result2 = await authOptions.callbacks!.jwt!({
        token: { accessToken: '', id: '', roles: [], refreshToken: '', accessTokenExp: 0 } as JWT,
        user: mockUser as unknown as NextAuthUser,
        trigger: 'signIn',
        session: undefined,
        account: mockAccount,
        profile: undefined,
      })

      expect(result2.error).toBe('OAuthSyncCacheMiss')
    })

    it('should preserve existing error and skip refresh when refreshToken is empty', async () => {
      const authOptions = await getAuthOptions()

      const mockToken = {
        accessToken: '',
        id: 'google-123',
        roles: ['user'],
        refreshToken: '',
        accessTokenExp: 0,
        error: 'OAuthSyncCacheMiss',
      } as JWT

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        // @ts-expect-error - Testing undefined user scenario
        user: undefined,
        trigger: 'update',
        session: undefined,
      })

      expect(result.error).toBe('OAuthSyncCacheMiss')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should set RefreshTokenMissing error when refreshToken is empty and no existing error', async () => {
      const authOptions = await getAuthOptions()

      const mockToken = {
        accessToken: '',
        id: 'user-123',
        roles: ['user'],
        refreshToken: '',
        accessTokenExp: 0,
      } as JWT

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        // @ts-expect-error - Testing undefined user scenario
        user: undefined,
        trigger: 'update',
        session: undefined,
      })

      expect(result.error).toBe('RefreshTokenMissing')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should call POST /auth/refresh when accessToken is expired and refreshToken is present', async () => {
      const authOptions = await getAuthOptions()

      const refreshToken = 'r'.repeat(64)
      const mockToken = {
        accessToken: 'old-access-token',
        id: 'user-123',
        roles: ['user'],
        refreshToken,
        accessTokenExp: Date.now() - 1000, // already expired
      } as JWT

      const refreshResponse = {
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 's'.repeat(64),
          expiresInSeconds: 3600,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => refreshResponse,
      })

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        // @ts-expect-error - Testing undefined user scenario
        user: undefined,
        trigger: 'update',
        session: undefined,
      })

      expect(global.fetch).toHaveBeenCalledOnce()
      const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
      expect(url).toBe(`${process.env.BACKEND_AI_CALLBACK_URL}/auth/refresh`)
      expect(options.method).toBe('POST')
      expect(JSON.parse(options.body)).toEqual({ refreshToken })

      expect(result.accessToken).toBe('new-access-token')
      expect(result.refreshToken).toBe('s'.repeat(64))
      expect(result.accessTokenExp).toBeGreaterThan(Date.now())
      expect(result.error).toBeUndefined()
    })

    it('should update token fields and clear error on successful silent refresh', async () => {
      const authOptions = await getAuthOptions()

      const mockToken = {
        accessToken: 'stale-token',
        id: 'user-456',
        roles: ['admin'],
        refreshToken: 't'.repeat(64),
        accessTokenExp: Date.now() - 5000,
        error: 'SomePreviousError',
      } as JWT

      const refreshResponse = {
        success: true,
        data: {
          accessToken: 'refreshed-access-token',
          refreshToken: 'u'.repeat(64),
          expiresInSeconds: 1800,
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => refreshResponse,
      })

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        // @ts-expect-error - Testing undefined user scenario
        user: undefined,
        trigger: 'update',
        session: undefined,
      })

      expect(result.accessToken).toBe('refreshed-access-token')
      expect(result.refreshToken).toBe('u'.repeat(64))
      expect(result.accessTokenExp).toBeGreaterThan(Date.now())
      expect(result.error).toBeUndefined()
    })

    it('should set RefreshTokenExpired error when silent refresh request fails', async () => {
      const authOptions = await getAuthOptions()

      const mockToken = {
        accessToken: 'expired-token',
        id: 'user-789',
        roles: ['user'],
        refreshToken: 'v'.repeat(64),
        accessTokenExp: Date.now() - 1000,
      } as JWT

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid refresh token' }),
      })

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        // @ts-expect-error - Testing undefined user scenario
        user: undefined,
        trigger: 'update',
        session: undefined,
      })

      expect(result.error).toBe('RefreshTokenExpired')
    })

    it('should set RefreshTokenExpired error when silent refresh fetch throws', async () => {
      const authOptions = await getAuthOptions()

      const mockToken = {
        accessToken: 'expired-token',
        id: 'user-789',
        roles: ['user'],
        refreshToken: 'w'.repeat(64),
        accessTokenExp: Date.now() - 1000,
      } as JWT

      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        // @ts-expect-error - Testing undefined user scenario
        user: undefined,
        trigger: 'update',
        session: undefined,
      })

      expect(result.error).toBe('RefreshTokenExpired')
    })

    describe('Session Callback', () => {
      it('should add token data to session', async () => {
        const authOptions = await getAuthOptions()

        const mockSession = {
          user: {
            email: 'test@example.com',
          },
          expires: '2025-12-31',
        }

        const mockToken = {
          accessToken: 'mock-token',
          id: 'user-123',
          roles: ['user'],
        }

        const result = await authOptions.callbacks!.session!({
          session: mockSession as Session,
          token: mockToken as JWT,
          // @ts-expect-error - Testing with custom User type instead of AdapterUser
          user: undefined as unknown as NextAuthUser,
          trigger: 'update',
          newSession: undefined,
        })

        expect((result.user as Session['user'])?.id).toBe('user-123')
        expect((result.user as Session['user'])?.roles).toEqual(['user'])
        expect((result as Session).accessToken).toBe('mock-token')
      })

      it('should preserve existing session properties', async () => {
        const authOptions = await getAuthOptions()

        const mockSession = {
          user: {
            email: 'test@example.com',
            name: 'Test User',
            image: 'https://example.com/avatar.jpg',
          },
          expires: '2025-12-31',
        }

        const mockToken = {
          accessToken: 'token',
          id: 'user-456',
          roles: ['admin'],
        }

        const result = await authOptions.callbacks!.session!({
          session: mockSession as Session,
          token: mockToken as JWT,
          // @ts-expect-error - Testing with custom User type instead of AdapterUser
          user: undefined as unknown as NextAuthUser,
          trigger: 'update',
          newSession: undefined,
        })

        expect(result.user?.email).toBe('test@example.com')
        expect(result.user?.name).toBe('Test User')
        expect(result.user?.image).toBe('https://example.com/avatar.jpg')
        expect(result.expires).toBe('2025-12-31')
      })

      it('should handle multiple roles in token', async () => {
        const authOptions = await getAuthOptions()

        const mockSession = {
          user: {
            email: 'admin@example.com',
          },
          expires: '2025-12-31',
        }

        const mockToken = {
          accessToken: 'admin-token',
          id: 'admin-123',
          roles: ['user', 'admin', 'moderator'],
        }

        const result = await authOptions.callbacks!.session!({
          session: mockSession as Session,
          token: mockToken as JWT,
          // @ts-expect-error - Testing with custom User type instead of AdapterUser
          user: undefined as unknown as NextAuthUser,
          trigger: 'update',
          newSession: undefined,
        })

        expect((result.user as Session['user'])?.roles).toEqual(['user', 'admin', 'moderator'])
      })

      it('should handle token with no roles', async () => {
        const authOptions = await getAuthOptions()

        const mockSession = {
          user: {
            email: 'test@example.com',
          },
          expires: '2025-12-31',
        }

        const mockToken = {
          accessToken: 'token',
          id: 'user-789',
          // roles undefined
        }

        const result = await authOptions.callbacks!.session!({
          session: mockSession as Session,
          token: mockToken as JWT,
          // @ts-expect-error - Testing with custom User type instead of AdapterUser
          user: undefined as unknown as NextAuthUser,
          trigger: 'update',
          newSession: undefined,
        })

        expect((result.user as Session['user'])?.roles).toBeUndefined()
      })

      it('should handle token with no accessToken', async () => {
        const authOptions = await getAuthOptions()

        const mockSession = {
          user: {
            email: 'test@example.com',
          },
          expires: '2025-12-31',
        }

        const mockToken = {
          id: 'user-999',
          roles: ['user'],
          // accessToken undefined
        }

        const result = await authOptions.callbacks!.session!({
          session: mockSession as Session,
          token: mockToken as JWT,
          // @ts-expect-error - Testing with custom User type instead of AdapterUser
          user: undefined as unknown as NextAuthUser,
          trigger: 'update',
          newSession: undefined,
        })

        expect((result as Session).accessToken).toBeUndefined()
      })

      it('should propagate token.error to session.error', async () => {
        const authOptions = await getAuthOptions()

        const mockSession = {
          user: {
            email: 'google@example.com',
          },
          expires: '2025-12-31',
        }

        const mockToken = {
          id: 'google-123',
          roles: ['user'],
          accessToken: '',
          error: 'OAuthSyncCacheMiss',
        }

        const result = await authOptions.callbacks!.session!({
          session: mockSession as Session,
          token: mockToken as JWT,
          // @ts-expect-error - Testing with custom User type instead of AdapterUser
          user: undefined as unknown as NextAuthUser,
          trigger: 'update',
          newSession: undefined,
        })

        expect((result as Session).error).toBe('OAuthSyncCacheMiss')
      })

      it('should not set session.error when token has no error', async () => {
        const authOptions = await getAuthOptions()

        const mockSession = {
          user: {
            email: 'test@example.com',
          },
          expires: '2025-12-31',
        }

        const mockToken = {
          id: 'user-123',
          roles: ['user'],
          accessToken: 'valid-token',
        }

        const result = await authOptions.callbacks!.session!({
          session: mockSession as Session,
          token: mockToken as JWT,
          // @ts-expect-error - Testing with custom User type instead of AdapterUser
          user: undefined as unknown as NextAuthUser,
          trigger: 'update',
          newSession: undefined,
        })

        expect((result as Session).error).toBeUndefined()
      })

      describe('Integration Tests', () => {
        it('should complete full authentication flow', async () => {
          vi.resetModules()
          const { authOptions } = await import('@/lib/auth/auth-config.js')

          // Step 1: Authorize user
          const mockBackendResponse = {
            success: true,
            data: {
              userId: 'user-123',
              email: 'test@example.com',
              accessToken: 'backend-jwt-token',
              refreshToken: 'd'.repeat(64),
              expiresInSeconds: 3600,
              roles: ['user'],
            },
          }

          ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => mockBackendResponse,
          })

          // Credentials provider is now at index 1 (Google is at 0)
          const provider = authOptions.providers[1] as {
            options: {
              authorize: (
                credentials: Record<string, string>,
                req: unknown
              ) => Promise<NextAuthUser | null>
            }
          }
          const user = await provider.options.authorize(
            {
              email: 'test@example.com',
              password: 'password123',
            },
            {}
          )

          expect(user).toBeDefined()

          // Step 2: JWT callback adds user data to token
          const token = await authOptions.callbacks!.jwt!({
            token: {
              accessToken: '',
              id: '',
              roles: [],
              refreshToken: '',
              accessTokenExp: 0,
            } as JWT,
            user: user as NextAuthUser,
            trigger: 'signIn',
            session: undefined,
            account: {
              provider: 'credentials',
              type: 'credentials',
              providerAccountId: 'test-account-id',
            },
            profile: undefined,
          })

          expect(token.accessToken).toBe('backend-jwt-token')
          expect(token.id).toBe('user-123')
          expect(token.roles).toEqual(['user'])

          // Step 3: Session callback adds token data to session
          const session = await authOptions.callbacks!.session!({
            session: {
              user: { email: 'test@example.com' },
              expires: '2025-12-31',
            } as Session,
            token: token as JWT,
            // @ts-expect-error - Testing with custom User type instead of AdapterUser
            user: undefined as unknown as NextAuthUser,
            trigger: 'update',
            newSession: undefined,
          })

          expect((session.user as Session['user'])?.id).toBe('user-123')
          expect((session.user as Session['user'])?.roles).toEqual(['user'])
          expect((session as Session).accessToken).toBe('backend-jwt-token')
        })
      })
    })
  })
})
