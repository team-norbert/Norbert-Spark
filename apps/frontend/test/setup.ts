// Test setup file for Vitest
import '@testing-library/jest-dom'

import { vi } from 'vitest'

// Set timezone to UTC for consistent date formatting across CI runners
process.env.TZ = 'UTC'

// Set required environment variables for tests
process.env.GOOGLE_ID = 'test-google-id'
process.env.GOOGLE_SECRET = 'test-google-secret'
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret'

// Mock CSS imports
vi.mock('@mui/x-data-grid/esm/index.css', () => ({}))

// Mock Next.js server APIs (headers, cookies, etc.) for server action tests
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn(),
    has: vi.fn(),
    forEach: vi.fn(),
  })),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Mock next-auth getServerSession to avoid 'headers' call issues
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(() => Promise.resolve(null)),
}))
