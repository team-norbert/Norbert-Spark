/**
 * Protected route patterns that require authentication
 * @constant
 */
export const PROTECTED_ROUTES = [
  '/admin',
  '/dashboard',
  '/profile',
  '/ai',
  '/ai/*',
  '/ai-admin',
  '/extract-data',
  '/company-details',
  '/company-details/update',
  '/chat-types',
]

/**
 * Authentication route patterns that redirect authenticated users
 * @constant
 */
export const AUTH_ROUTES = ['/register', '/signin']
