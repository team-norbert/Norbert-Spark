import { vi } from 'vitest'

import type { LoggerPort } from '../../../src/application/ports/logger.port.js'

/**
 * Creates a fully typed mock LoggerPort for use in tests.
 * The child() method returns the same mock instance.
 */
export function createMockLogger(): LoggerPort {
  const mockLogger: LoggerPort = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  }
  return mockLogger
}
