// Test setup file for Vitest
import '@testing-library/jest-dom'

import { vi } from 'vitest'

// Set timezone to UTC for consistent date formatting across CI runners
process.env.TZ = 'UTC'

// Set required environment variables for tests
process.env.GOOGLE_ID = 'test-google-id'
process.env.GOOGLE_SECRET = 'test-google-secret'
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret'

// Set required NEXT_PUBLIC client-side env vars validated by @t3-oss/env-nextjs at import time
process.env.NEXT_PUBLIC_POST_AI_CALLBACK_URL = 'http://localhost:3001/api/ai/callback'
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:3001'

// Suppress MUI Popover/Select `anchorEl` layout warning in JSDOM.
// MUI's Select uses a Popover internally and warns when its anchor element has
// no layout dimensions — which is always the case in JSDOM since it has no
// rendering engine. This is a test-environment limitation, not a real bug.
const isMuiAnchorElWarning = (args: unknown[]): boolean =>
  typeof args[0] === 'string' && args[0].includes('MUI') && args[0].includes('anchorEl')

const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  if (isMuiAnchorElWarning(args)) return
  originalConsoleError(...args)
}

const originalConsoleWarn = console.warn
console.warn = (...args: unknown[]) => {
  if (isMuiAnchorElWarning(args)) return
  originalConsoleWarn(...args)
}

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
