import { vi } from 'vitest'

import type { LoggerPort } from '../../../src/application/ports/logger.port.js'

/**
 * Creates a fully typed mock LoggerPort for use in tests.
 * The child() method returns a new mock instance to avoid binding leakage between tests.
 */
export function createMockLogger(): LoggerPort {
  const mockLogger: LoggerPort = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockImplementation(() => createMockLogger()),
  }
  return mockLogger
}
