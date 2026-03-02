/**
 * Test helper for creating mock JWT tokens
 */

export interface MockTokenOptions {
  sub?: string
  name?: string
  email?: string
  iat?: number
  exp?: number
  accessToken?: string
  refreshToken?: string
  accessTokenExp?: number
  id?: string
  roles?: string[]
}

/**
 * Factory function to create a mock token object for testing
 * @param overrides Optional partial token object to override default values
 * @returns A complete mock token object
 */
export function createMockToken(overrides: MockTokenOptions = {}) {
  const now = Math.floor(Date.now() / 1000)

  return {
    sub: '123',
    name: 'Test User',
    email: 'test@example.com',
    iat: now,
    exp: now + 86400, // 24 hours from now
    accessToken: 'mock-access-token',
    refreshToken: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    accessTokenExp: (now + 3600) * 1000, // 1 hour from now in epoch ms
    id: '123',
    roles: ['user'],
    ...overrides,
  }
}
