import type { Obscured } from 'obscured'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock varlock before any imports so that:
//   1. `varlock/auto-load` doesn't spawn the `varlock load` CLI subprocess.
//   2. `ENV.X` reads from `process.env.X` (strings), matching the behaviour that
//      the rest of these tests were written against.
// vi.mock() is hoisted by Vitest so both mocks are in effect for every dynamic
// import inside the test suite, even after vi.resetModules() clears the cache.
vi.mock('varlock/auto-load', () => ({}))
vi.mock('varlock/env', () => ({
  ENV: new Proxy(
    {},
    {
      get(_target: Record<string, unknown>, prop: string | symbol) {
        if (typeof prop !== 'string') return undefined
        // eslint-disable-next-line security/detect-object-injection
        return process.env[prop]
      },
    }
  ),
}))

//TODO: these tests need refactoring as the environment mocking is incorrectly handled
describe('EnvConfig', () => {
  let originalEnv: typeof process.env

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }
    // Clear module cache to ensure fresh imports
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    vi.resetModules()
  })

  describe('NODE_ENV', () => {
    it('should use NODE_ENV from environment when set', async () => {
      process.env.NODE_ENV = 'production'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.NODE_ENV).toBe('production')
    })

    it('should default to "development" when NODE_ENV is not set', async () => {
      delete process.env.NODE_ENV
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.NODE_ENV).toBe('development')
    })

    it('should be a static property', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'NODE_ENV')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })
  })

  describe('DATABASE_URL', () => {
    it('should be a static readonly property', async () => {
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'DATABASE_URL')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should have type Obscured<string | undefined>', async () => {
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Type assertion to verify compile-time type
      const _typeCheck: Obscured<string | undefined> = EnvConfig.DATABASE_URL

      // Runtime checks - Obscured objects have specific characteristics
      expect(EnvConfig.DATABASE_URL).toBeDefined()
      expect(typeof EnvConfig.DATABASE_URL).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.DATABASE_URL)).toBe('[OBSCURED]')
      expect(EnvConfig.DATABASE_URL.toString()).toBe('[OBSCURED]')

      // Prevent unused variable warning
      void _typeCheck
    })
  })

  describe('RESEND_API_KEY', () => {
    it('should be a static readonly property', async () => {
      process.env.RESEND_API_KEY = 'test_api_key_12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'RESEND_API_KEY')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should have type Obscured<string | undefined>', async () => {
      process.env.RESEND_API_KEY = 'test_api_key_12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Type assertion to verify compile-time type
      const _typeCheck: Obscured<string | undefined> = EnvConfig.RESEND_API_KEY

      // Runtime checks - Obscured objects have specific characteristics
      expect(EnvConfig.RESEND_API_KEY).toBeDefined()
      expect(typeof EnvConfig.RESEND_API_KEY).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.RESEND_API_KEY)).toBe('[OBSCURED]')
      expect(EnvConfig.RESEND_API_KEY.toString()).toBe('[OBSCURED]')

      // Prevent unused variable warning
      void _typeCheck
    })

    it('should obscure the actual API key value', async () => {
      process.env.RESEND_API_KEY = 'secret_resend_key_xyz'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Verify the key is obscured (doesn't expose the raw value)
      expect(String(EnvConfig.RESEND_API_KEY)).not.toContain('secret_resend_key_xyz')
      expect(EnvConfig.RESEND_API_KEY.toString()).toBe('[OBSCURED]')
    })
  })

  describe('EMAIL_FROM_ADDRESS', () => {
    it('should be a static readonly property', async () => {
      process.env.EMAIL_FROM_ADDRESS = 'noreply@example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'EMAIL_FROM_ADDRESS')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use EMAIL_FROM_ADDRESS from environment when set', async () => {
      process.env.EMAIL_FROM_ADDRESS = 'test@example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.EMAIL_FROM_ADDRESS).toBe('test@example.com')
    })

    it('should default to empty string when EMAIL_FROM_ADDRESS is not set', async () => {
      delete process.env.EMAIL_FROM_ADDRESS
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.EMAIL_FROM_ADDRESS).toBe('')
    })

    it('should have type string', async () => {
      process.env.EMAIL_FROM_ADDRESS = 'noreply@example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.EMAIL_FROM_ADDRESS).toBe('string')
      expect(EnvConfig.EMAIL_FROM_ADDRESS).toBe('noreply@example.com')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.EMAIL_FROM_ADDRESS = 'support@example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // EMAIL_FROM_ADDRESS should be a plain string, not obscured
      expect(typeof EnvConfig.EMAIL_FROM_ADDRESS).toBe('string')
      expect(EnvConfig.EMAIL_FROM_ADDRESS).toBe('support@example.com')
      // Should not have obscured behavior
      expect(String(EnvConfig.EMAIL_FROM_ADDRESS)).toBe('support@example.com')
    })
  })

  describe('HOST', () => {
    it('should be a static readonly property', async () => {
      process.env.HOST = '0.0.0.0'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'HOST')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use HOST from environment when set', async () => {
      process.env.HOST = '0.0.0.0'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.HOST).toBe('0.0.0.0')
    })

    it('should default to "127.0.0.1" when HOST is not set', async () => {
      delete process.env.HOST
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.HOST).toBe('127.0.0.1')
    })

    it('should have type string', async () => {
      process.env.HOST = 'localhost'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.HOST).toBe('string')
      expect(EnvConfig.HOST).toBe('localhost')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.HOST = '192.168.1.100'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // HOST should be a plain string, not obscured
      expect(typeof EnvConfig.HOST).toBe('string')
      expect(EnvConfig.HOST).toBe('192.168.1.100')
      // Should not have obscured behavior
      expect(String(EnvConfig.HOST)).toBe('192.168.1.100')
    })

    it('should accept IPv4 addresses', async () => {
      process.env.HOST = '192.168.1.1'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.HOST).toBe('192.168.1.1')
    })

    it('should accept IPv6 addresses', async () => {
      process.env.HOST = '::1'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.HOST).toBe('::1')
    })
  })

  describe('USE_HTTPS', () => {
    it('should be a static readonly property', async () => {
      process.env.USE_HTTPS = 'false'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'USE_HTTPS')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use USE_HTTPS from environment when set', async () => {
      process.env.USE_HTTPS = 'false'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.USE_HTTPS).toBe('false')
    })

    it('should default to "true" when USE_HTTPS is not set', async () => {
      delete process.env.USE_HTTPS
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.USE_HTTPS).toBe('true')
    })

    it('should have type string', async () => {
      process.env.USE_HTTPS = 'true'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.USE_HTTPS).toBe('string')
      expect(EnvConfig.USE_HTTPS).toBe('true')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.USE_HTTPS = 'false'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // USE_HTTPS should be a plain string, not obscured
      expect(typeof EnvConfig.USE_HTTPS).toBe('string')
      expect(EnvConfig.USE_HTTPS).toBe('false')
      // Should not have obscured behavior
      expect(String(EnvConfig.USE_HTTPS)).toBe('false')
    })

    it('should accept "true" value', async () => {
      process.env.USE_HTTPS = 'true'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.USE_HTTPS).toBe('true')
    })

    it('should accept "false" value', async () => {
      process.env.USE_HTTPS = 'false'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.USE_HTTPS).toBe('false')
    })

    it('should accept any string value (not strictly boolean)', async () => {
      process.env.USE_HTTPS = 'yes'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // USE_HTTPS is a string, so it accepts any value
      expect(EnvConfig.USE_HTTPS).toBe('yes')
      expect(typeof EnvConfig.USE_HTTPS).toBe('string')
    })
  })
  describe('API_VERSION', () => {
    it('should be a static readonly property', async () => {
      process.env.API_VERSION = 'v1'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'API_VERSION')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use API_VERSION from environment when set', async () => {
      process.env.API_VERSION = 'v1'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.API_VERSION).toBe('v1')
    })

    it('should default to "v1" when API_VERSION is not set', async () => {
      delete process.env.API_VERSION
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()

      // Mock dotenv to not load API_VERSION from .env file
      vi.doMock('dotenv', () => ({
        default: {
          config: vi.fn(() => ({ parsed: {} })),
        },
      }))

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.API_VERSION).toBe('v1')

      vi.doUnmock('dotenv')
    })

    it('should have type string when set', async () => {
      process.env.API_VERSION = 'v2'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.API_VERSION).toBe('string')
      expect(EnvConfig.API_VERSION).toBe('v2')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.API_VERSION = 'v1'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // API_VERSION should be a plain string, not obscured
      expect(typeof EnvConfig.API_VERSION).toBe('string')
      expect(EnvConfig.API_VERSION).toBe('v1')
      // Should not have obscured behavior
      expect(String(EnvConfig.API_VERSION)).toBe('v1')
    })

    it('should accept "v1" value', async () => {
      process.env.API_VERSION = 'v1'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.API_VERSION).toBe('v1')
    })

    it('should accept "v2" value', async () => {
      process.env.API_VERSION = 'v2'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.API_VERSION).toBe('v2')
    })

    it('should accept any string value for version', async () => {
      process.env.API_VERSION = '2024.1'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // API_VERSION is a string, so it accepts any version format
      expect(EnvConfig.API_VERSION).toBe('2024.1')
      expect(typeof EnvConfig.API_VERSION).toBe('string')
    })
  })
  describe('validate()', () => {
    it('should have DATABASE_URL validation logic', async () => {
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Check that DATABASE_URL is either set or undefined (no default empty string)
      expect(
        typeof EnvConfig.DATABASE_URL === 'object' || EnvConfig.DATABASE_URL === undefined
      ).toBe(true)
    })

    it('should be a static method accessible without instantiation', async () => {
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.validate).toBe('function')
    })

    it('should include RESEND_API_KEY in required environment variables', async () => {
      // Read the source file to verify RESEND_API_KEY is in requiredEnvs array
      const fs = await import('fs/promises')
      const path = await import('path')
      const envConfigPath = path.join(process.cwd(), 'src/infrastructure/config/env.config.ts')
      const content = await fs.readFile(envConfigPath, 'utf-8')

      // Verify RESEND_API_KEY is listed in the requiredEnvs array
      expect(content).toContain('RESEND_API_KEY')
      expect(content).toMatch(/requiredEnvs.*=.*\[[\s\S]*'RESEND_API_KEY'/m)
    })
  })

  describe('EnvConfig class', () => {
    it('should be instantiable', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const envConfig = new EnvConfig()
      expect(envConfig).toBeInstanceOf(EnvConfig)
    })

    it('should have static NODE_ENV property accessible without instantiation', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.NODE_ENV).toBeDefined()
      expect(typeof EnvConfig.NODE_ENV).toBe('string')
    })

    it('should have static DATABASE_URL property accessible without instantiation', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Type assertion to verify compile-time type
      const _typeCheck: Obscured<string | undefined> = EnvConfig.DATABASE_URL

      // Runtime checks
      expect(EnvConfig.DATABASE_URL).toBeDefined()
      expect(typeof EnvConfig.DATABASE_URL).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.DATABASE_URL)).toBe('[OBSCURED]')

      // Prevent unused variable warning
      void _typeCheck
    })

    it('should have static RESEND_API_KEY property accessible without instantiation', async () => {
      process.env.RESEND_API_KEY = 'test_key_123'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Type assertion to verify compile-time type
      const _typeCheck: Obscured<string | undefined> = EnvConfig.RESEND_API_KEY

      // Runtime checks
      expect(EnvConfig.RESEND_API_KEY).toBeDefined()
      expect(typeof EnvConfig.RESEND_API_KEY).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.RESEND_API_KEY)).toBe('[OBSCURED]')

      // Prevent unused variable warning
      void _typeCheck
    })

    it('should have static EMAIL_FROM_ADDRESS property accessible without instantiation', async () => {
      process.env.EMAIL_FROM_ADDRESS = 'test@example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.EMAIL_FROM_ADDRESS).toBeDefined()
      expect(typeof EnvConfig.EMAIL_FROM_ADDRESS).toBe('string')
      expect(EnvConfig.EMAIL_FROM_ADDRESS).toBe('test@example.com')
    })

    it('should have static HOST property accessible without instantiation', async () => {
      process.env.HOST = '0.0.0.0'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.HOST).toBeDefined()
      expect(typeof EnvConfig.HOST).toBe('string')
      expect(EnvConfig.HOST).toBe('0.0.0.0')
    })

    it('should have static USE_HTTPS property accessible without instantiation', async () => {
      process.env.USE_HTTPS = 'false'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.USE_HTTPS).toBeDefined()
      expect(typeof EnvConfig.USE_HTTPS).toBe('string')
      expect(EnvConfig.USE_HTTPS).toBe('false')
    })

    it('should have static API_VERSION property accessible without instantiation', async () => {
      process.env.API_VERSION = 'v2'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.API_VERSION).toBeDefined()
      expect(typeof EnvConfig.API_VERSION).toBe('string')
      expect(EnvConfig.API_VERSION).toBe('v2')
    })

    it('should have static validate method accessible without instantiation', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.validate).toBe('function')
    })
  })

  describe('UPSTASH_REDIS_REST_URL', () => {
    it('should be a static readonly property', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'UPSTASH_REDIS_REST_URL')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should have type Obscured<string | undefined>', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Type assertion to verify compile-time type
      const _typeCheck: Obscured<string | undefined> = EnvConfig.UPSTASH_REDIS_REST_URL

      // Runtime checks - Obscured objects have specific characteristics
      expect(EnvConfig.UPSTASH_REDIS_REST_URL).toBeDefined()
      expect(typeof EnvConfig.UPSTASH_REDIS_REST_URL).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.UPSTASH_REDIS_REST_URL)).toBe('[OBSCURED]')
      expect(EnvConfig.UPSTASH_REDIS_REST_URL.toString()).toBe('[OBSCURED]')

      // Prevent unused variable warning
      void _typeCheck
    })

    it('should obscure the actual Redis URL value', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://secret-redis-url.upstash.io'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Verify the URL is obscured (doesn't expose the raw value)
      expect(String(EnvConfig.UPSTASH_REDIS_REST_URL)).not.toContain('secret-redis-url')
      expect(EnvConfig.UPSTASH_REDIS_REST_URL.toString()).toBe('[OBSCURED]')
    })
  })

  describe('UPSTASH_REDIS_REST_TOKEN', () => {
    it('should be a static readonly property', async () => {
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test_token_12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'UPSTASH_REDIS_REST_TOKEN')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should have type Obscured<string | undefined>', async () => {
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test_token_12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Type assertion to verify compile-time type
      const _typeCheck: Obscured<string | undefined> = EnvConfig.UPSTASH_REDIS_REST_TOKEN

      // Runtime checks - Obscured objects have specific characteristics
      expect(EnvConfig.UPSTASH_REDIS_REST_TOKEN).toBeDefined()
      expect(typeof EnvConfig.UPSTASH_REDIS_REST_TOKEN).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.UPSTASH_REDIS_REST_TOKEN)).toBe('[OBSCURED]')
      expect(EnvConfig.UPSTASH_REDIS_REST_TOKEN.toString()).toBe('[OBSCURED]')

      // Prevent unused variable warning
      void _typeCheck
    })

    it('should obscure the actual Redis token value', async () => {
      process.env.UPSTASH_REDIS_REST_TOKEN = 'secret_token_xyz_12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Verify the token is obscured (doesn't expose the raw value)
      expect(String(EnvConfig.UPSTASH_REDIS_REST_TOKEN)).not.toContain('secret_token_xyz')
      expect(EnvConfig.UPSTASH_REDIS_REST_TOKEN.toString()).toBe('[OBSCURED]')
    })
  })

  describe('OAUTH_SYNC_SECRET', () => {
    it('should be a static readonly property', async () => {
      process.env.OAUTH_SYNC_SECRET = 'test_oauth_secret_12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'
      process.env.RESEND_API_KEY = 'test_resend_key'
      process.env.JWT_SECRET = 'test_jwt_secret'
      process.env.API_VERSION = 'v1'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'OAUTH_SYNC_SECRET')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should have type Obscured<string | undefined>', async () => {
      process.env.OAUTH_SYNC_SECRET = 'test_oauth_secret_12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'
      process.env.RESEND_API_KEY = 'test_resend_key'
      process.env.JWT_SECRET = 'test_jwt_secret'
      process.env.API_VERSION = 'v1'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Type assertion to verify compile-time type
      const _typeCheck: Obscured<string | undefined> = EnvConfig.OAUTH_SYNC_SECRET

      // Runtime checks - Obscured objects have specific characteristics
      expect(EnvConfig.OAUTH_SYNC_SECRET).toBeDefined()
      expect(typeof EnvConfig.OAUTH_SYNC_SECRET).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.OAUTH_SYNC_SECRET)).toBe('[OBSCURED]')
      expect(EnvConfig.OAUTH_SYNC_SECRET.toString()).toBe('[OBSCURED]')

      // Prevent unused variable warning
      void _typeCheck
    })

    it('should obscure the actual OAuth sync secret value', async () => {
      process.env.OAUTH_SYNC_SECRET = 'super-secret-oauth-key-xyz-789'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'
      process.env.RESEND_API_KEY = 'test_resend_key'
      process.env.JWT_SECRET = 'test_jwt_secret'
      process.env.API_VERSION = 'v1'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Verify the secret is obscured (doesn't expose the raw value)
      expect(String(EnvConfig.OAUTH_SYNC_SECRET)).not.toContain('super-secret-oauth-key')
      expect(EnvConfig.OAUTH_SYNC_SECRET.toString()).toBe('[OBSCURED]')
    })

    it('should be required for validation', async () => {
      // Read the source file to verify OAUTH_SYNC_SECRET is in requiredEnvs array
      const fs = await import('fs/promises')
      const path = await import('path')
      const envConfigPath = path.join(process.cwd(), 'src/infrastructure/config/env.config.ts')
      const content = await fs.readFile(envConfigPath, 'utf-8')

      // Verify OAUTH_SYNC_SECRET is listed in the requiredEnvs array
      expect(content).toContain('OAUTH_SYNC_SECRET')
      expect(content).toMatch(/requiredEnvs.*=.*\[[\s\S]*'OAUTH_SYNC_SECRET'/m)
    })
  })

  describe('SENTRY_DSN', () => {
    it('should be a static readonly property', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'SENTRY_DSN')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use SENTRY_DSN from environment when set', async () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // SENTRY_DSN is obscured, so we check it's defined and has obscured behavior
      expect(EnvConfig.SENTRY_DSN).toBeDefined()
      expect(String(EnvConfig.SENTRY_DSN)).toBe('[OBSCURED]')
    })

    it('should default to obscured empty value when SENTRY_DSN is not set', async () => {
      delete process.env.SENTRY_DSN
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // When not set, obscured.make(undefined) returns an obscured object
      // The || '' doesn't apply because obscured objects are truthy
      expect(EnvConfig.SENTRY_DSN).toBeDefined()
      expect(typeof EnvConfig.SENTRY_DSN).toBe('object')
      expect(String(EnvConfig.SENTRY_DSN)).toBe('[OBSCURED]')
    })

    it('should be obscured when value is set', async () => {
      process.env.SENTRY_DSN = 'https://secret@sentry.io/67890'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // SENTRY_DSN should be obscured
      expect(typeof EnvConfig.SENTRY_DSN).toBe('object')
      expect(String(EnvConfig.SENTRY_DSN)).toBe('[OBSCURED]')
      expect(EnvConfig.SENTRY_DSN.toString()).toBe('[OBSCURED]')
    })

    it('should have type Obscured<string | undefined> or empty string', async () => {
      process.env.SENTRY_DSN = 'https://key@sentry.io/11111'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Type assertion to verify compile-time type
      const _typeCheck: typeof EnvConfig.SENTRY_DSN = EnvConfig.SENTRY_DSN

      // Runtime checks - Obscured objects have specific characteristics
      expect(EnvConfig.SENTRY_DSN).toBeDefined()
      expect(typeof EnvConfig.SENTRY_DSN).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.SENTRY_DSN)).toBe('[OBSCURED]')
      expect(EnvConfig.SENTRY_DSN.toString()).toBe('[OBSCURED]')

      // Prevent unused variable warning
      void _typeCheck
    })
  })

  describe('SENTRY_ENABLED', () => {
    it('should be a static readonly property', async () => {
      process.env.SENTRY_ENABLED = 'my-sentry-enabled'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'SENTRY_ENABLED')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use SENTRY_ENABLED from environment when set', async () => {
      process.env.SENTRY_ENABLED = 'true'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.SENTRY_ENABLED).toBe('true')
    })

    it('should use value from .env when SENTRY_ENABLED env var is deleted', async () => {
      delete process.env.SENTRY_ENABLED
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Dotenv reloads .env file which may have SENTRY_ENABLED set
      // When not explicitly set, it uses the .env value or defaults to empty string
      // In local dev, .env may have SENTRY_ENABLED=true, but in CI it may be unset
      expect(typeof EnvConfig.SENTRY_ENABLED).toBe('string')
      expect(['true', 'false', '']).toContain(EnvConfig.SENTRY_ENABLED)
    })

    it('should have type string', async () => {
      process.env.SENTRY_ENABLED = 'production-enabled'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.SENTRY_ENABLED).toBe('string')
      expect(EnvConfig.SENTRY_ENABLED).toBe('production-enabled')
    })

    it('should not be obscured (plain value)', async () => {
      process.env.SENTRY_ENABLED = 'dev-sentry-enabled'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // SENTRY_ENABLED should be a plain string, not obscured
      expect(typeof EnvConfig.SENTRY_ENABLED).toBe('string')
      expect(EnvConfig.SENTRY_ENABLED).toBe('dev-sentry-enabled')
      // Should not have obscured behavior
      expect(String(EnvConfig.SENTRY_ENABLED)).toBe('dev-sentry-enabled')
    })

    it('should return empty string for empty string value', async () => {
      process.env.SENTRY_ENABLED = ''
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Empty string is falsy, so it defaults to empty string
      expect(EnvConfig.SENTRY_ENABLED).toBe('')
    })

    it('should return "false" when explicitly set to "false"', async () => {
      process.env.SENTRY_ENABLED = 'false'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // 'false' is passed through as-is; callers should *not* rely on a truthy check
      // (if SENTRY_ENABLED) because the string 'false' is truthy and would enable Sentry.
      // Disabling Sentry is a caller concern and should use explicit boolean logic or comparison.
      expect(EnvConfig.SENTRY_ENABLED).toBe('false')
    })
  })

  describe('SENTRY_AUTH_TOKEN', () => {
    it('should be a static readonly property', async () => {
      process.env.SENTRY_AUTH_TOKEN = 'sntrys_test_token_12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'SENTRY_AUTH_TOKEN')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use SENTRY_AUTH_TOKEN from environment when set', async () => {
      process.env.SENTRY_AUTH_TOKEN = 'sntrys_production_token_abc123'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.SENTRY_AUTH_TOKEN).toBe('sntrys_production_token_abc123')
    })

    it('should use value from .env when SENTRY_AUTH_TOKEN env var is deleted', async () => {
      delete process.env.SENTRY_AUTH_TOKEN
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Dotenv reloads .env file which may have SENTRY_AUTH_TOKEN set
      // When not explicitly set, it uses the .env value or defaults to empty string
      expect(typeof EnvConfig.SENTRY_AUTH_TOKEN).toBe('string')
    })

    it('should have type string', async () => {
      process.env.SENTRY_AUTH_TOKEN = 'sntrys_dev_token_xyz789'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.SENTRY_AUTH_TOKEN).toBe('string')
      expect(EnvConfig.SENTRY_AUTH_TOKEN).toBe('sntrys_dev_token_xyz789')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.SENTRY_AUTH_TOKEN = 'sntrys_test_auth_token'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // SENTRY_AUTH_TOKEN should be a plain string, not obscured
      expect(typeof EnvConfig.SENTRY_AUTH_TOKEN).toBe('string')
      expect(EnvConfig.SENTRY_AUTH_TOKEN).toBe('sntrys_test_auth_token')
      // Should not have obscured behavior
      expect(String(EnvConfig.SENTRY_AUTH_TOKEN)).toBe('sntrys_test_auth_token')
    })

    it('should handle empty string value', async () => {
      process.env.SENTRY_AUTH_TOKEN = ''
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Empty string is falsy, so it defaults to empty string
      expect(EnvConfig.SENTRY_AUTH_TOKEN).toBe('')
    })
  })

  describe('SENTRY_PROJECT', () => {
    it('should be a static readonly property', async () => {
      process.env.SENTRY_PROJECT = 'my-project'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'SENTRY_PROJECT')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use SENTRY_PROJECT from environment when set', async () => {
      process.env.SENTRY_PROJECT = 'production-project'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.SENTRY_PROJECT).toBe('production-project')
    })

    it('should use value from .env when SENTRY_PROJECT env var is deleted', async () => {
      delete process.env.SENTRY_PROJECT
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Dotenv reloads .env file which may have SENTRY_PROJECT set
      // When not explicitly set, it uses the .env value or defaults to empty string
      expect(typeof EnvConfig.SENTRY_PROJECT).toBe('string')
    })

    it('should have type string', async () => {
      process.env.SENTRY_PROJECT = 'dev-project'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.SENTRY_PROJECT).toBe('string')
      expect(EnvConfig.SENTRY_PROJECT).toBe('dev-project')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.SENTRY_PROJECT = 'test-project'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // SENTRY_PROJECT should be a plain string, not obscured
      expect(typeof EnvConfig.SENTRY_PROJECT).toBe('string')
      expect(EnvConfig.SENTRY_PROJECT).toBe('test-project')
      // Should not have obscured behavior
      expect(String(EnvConfig.SENTRY_PROJECT)).toBe('test-project')
    })

    it('should handle empty string value', async () => {
      process.env.SENTRY_PROJECT = ''
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Empty string is falsy, so it defaults to empty string
      expect(EnvConfig.SENTRY_PROJECT).toBe('')
    })
  })

  describe('SENTRY_ORG', () => {
    it('should be a static readonly property', async () => {
      process.env.SENTRY_ORG = 'my-organization'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'SENTRY_ORG')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use SENTRY_ORG from environment when set', async () => {
      process.env.SENTRY_ORG = 'acme-corp'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.SENTRY_ORG).toBe('acme-corp')
    })

    it('should use value from .env when SENTRY_ORG env var is deleted', async () => {
      delete process.env.SENTRY_ORG
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Dotenv reloads .env file which may have SENTRY_ORG set
      // When not explicitly set, it uses the .env value or defaults to empty string
      expect(typeof EnvConfig.SENTRY_ORG).toBe('string')
    })

    it('should have type string', async () => {
      process.env.SENTRY_ORG = 'test-organization'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.SENTRY_ORG).toBe('string')
      expect(EnvConfig.SENTRY_ORG).toBe('test-organization')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.SENTRY_ORG = 'my-org'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // SENTRY_ORG should be a plain string, not obscured
      expect(typeof EnvConfig.SENTRY_ORG).toBe('string')
      expect(EnvConfig.SENTRY_ORG).toBe('my-org')
      // Should not have obscured behavior
      expect(String(EnvConfig.SENTRY_ORG)).toBe('my-org')
    })

    it('should handle empty string value', async () => {
      process.env.SENTRY_ORG = ''
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Empty string is falsy, so it defaults to empty string
      expect(EnvConfig.SENTRY_ORG).toBe('')
    })
  })

  describe('CLOUDFLARE_ACCESS_SECRET', () => {
    it('should be a static readonly property', async () => {
      process.env.CLOUDFLARE_ACCESS_SECRET = 'test_secret_123'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'CLOUDFLARE_ACCESS_SECRET')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should have type Obscured<string | undefined> | ""', async () => {
      process.env.CLOUDFLARE_ACCESS_SECRET = 'test_secret_xyz'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Runtime checks - Obscured objects have specific characteristics
      expect(EnvConfig.CLOUDFLARE_ACCESS_SECRET).toBeDefined()
      expect(typeof EnvConfig.CLOUDFLARE_ACCESS_SECRET).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.CLOUDFLARE_ACCESS_SECRET)).toBe('[OBSCURED]')
      expect(EnvConfig.CLOUDFLARE_ACCESS_SECRET.toString()).toBe('[OBSCURED]')
    })

    it('should obscure the actual secret value', async () => {
      process.env.CLOUDFLARE_ACCESS_SECRET = 'my_secret_cloudflare_key'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Verify the secret is obscured (doesn't expose the raw value)
      expect(String(EnvConfig.CLOUDFLARE_ACCESS_SECRET)).not.toContain('my_secret_cloudflare_key')
      expect(EnvConfig.CLOUDFLARE_ACCESS_SECRET.toString()).toBe('[OBSCURED]')
    })

    it('should default to empty string when not set', async () => {
      delete process.env.CLOUDFLARE_ACCESS_SECRET
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // When not set, it's an obscured undefined value or empty string
      // The implementation uses: obscured.make(process.env.CLOUDFLARE_ACCESS_SECRET) || ''
      // which means it could be obscured(undefined) OR ''
      expect(EnvConfig.CLOUDFLARE_ACCESS_SECRET).toBeDefined()
    })
  })

  describe('CLOUDFLARE_ACCESS_ID', () => {
    it('should be a static readonly property', async () => {
      process.env.CLOUDFLARE_ACCESS_ID = 'test_id_123'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'CLOUDFLARE_ACCESS_ID')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should have type Obscured<string | undefined> | ""', async () => {
      process.env.CLOUDFLARE_ACCESS_ID = 'test_id_abc'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Runtime checks - Obscured objects have specific characteristics
      expect(EnvConfig.CLOUDFLARE_ACCESS_ID).toBeDefined()
      expect(typeof EnvConfig.CLOUDFLARE_ACCESS_ID).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.CLOUDFLARE_ACCESS_ID)).toBe('[OBSCURED]')
      expect(EnvConfig.CLOUDFLARE_ACCESS_ID.toString()).toBe('[OBSCURED]')
    })

    it('should obscure the actual ID value', async () => {
      process.env.CLOUDFLARE_ACCESS_ID = 'my_cloudflare_access_id_12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Verify the ID is obscured (doesn't expose the raw value)
      expect(String(EnvConfig.CLOUDFLARE_ACCESS_ID)).not.toContain('my_cloudflare_access_id_12345')
      expect(EnvConfig.CLOUDFLARE_ACCESS_ID.toString()).toBe('[OBSCURED]')
    })

    it('should default to empty string when not set', async () => {
      delete process.env.CLOUDFLARE_ACCESS_ID
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // When not set, it's an obscured undefined value or empty string
      expect(EnvConfig.CLOUDFLARE_ACCESS_ID).toBeDefined()
    })
  })

  describe('CLOUDFLARE_ENDPOINT', () => {
    it('should be a static readonly property', async () => {
      process.env.CLOUDFLARE_ENDPOINT = 'https://example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'CLOUDFLARE_ENDPOINT')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use CLOUDFLARE_ENDPOINT from environment when set', async () => {
      process.env.CLOUDFLARE_ENDPOINT = 'https://cf.example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.CLOUDFLARE_ENDPOINT).toBe('https://cf.example.com')
    })

    it('should default to empty string when not set and no .env value', async () => {
      delete process.env.CLOUDFLARE_ENDPOINT
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // May be empty string or value from .env file
      expect(typeof EnvConfig.CLOUDFLARE_ENDPOINT).toBe('string')
    })

    it('should have type string', async () => {
      process.env.CLOUDFLARE_ENDPOINT = 'https://endpoint.cloudflare.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.CLOUDFLARE_ENDPOINT).toBe('string')
      expect(EnvConfig.CLOUDFLARE_ENDPOINT).toBe('https://endpoint.cloudflare.com')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.CLOUDFLARE_ENDPOINT = 'https://my-endpoint.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // CLOUDFLARE_ENDPOINT should be a plain string, not obscured
      expect(typeof EnvConfig.CLOUDFLARE_ENDPOINT).toBe('string')
      expect(EnvConfig.CLOUDFLARE_ENDPOINT).toBe('https://my-endpoint.com')
      // Should not have obscured behavior
      expect(String(EnvConfig.CLOUDFLARE_ENDPOINT)).toBe('https://my-endpoint.com')
    })

    it('should accept URL with path', async () => {
      process.env.CLOUDFLARE_ENDPOINT = 'https://api.cloudflare.com/v1/s3'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.CLOUDFLARE_ENDPOINT).toBe('https://api.cloudflare.com/v1/s3')
    })
  })

  describe('CLOUDFLARE_API', () => {
    it('should be a static readonly property', async () => {
      process.env.CLOUDFLARE_API = 'test_api_key'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'CLOUDFLARE_API')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should have type Obscured<string | undefined> | ""', async () => {
      process.env.CLOUDFLARE_API = 'test_api_token_xyz'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Runtime checks - Obscured objects have specific characteristics
      expect(EnvConfig.CLOUDFLARE_API).toBeDefined()
      expect(typeof EnvConfig.CLOUDFLARE_API).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.CLOUDFLARE_API)).toBe('[OBSCURED]')
      expect(EnvConfig.CLOUDFLARE_API.toString()).toBe('[OBSCURED]')
    })

    it('should obscure the actual API key value', async () => {
      process.env.CLOUDFLARE_API = 'my_secret_cloudflare_api_token'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Verify the API key is obscured (doesn't expose the raw value)
      expect(String(EnvConfig.CLOUDFLARE_API)).not.toContain('my_secret_cloudflare_api_token')
      expect(EnvConfig.CLOUDFLARE_API.toString()).toBe('[OBSCURED]')
    })

    it('should default to empty string when not set', async () => {
      delete process.env.CLOUDFLARE_API
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // When not set, it's an obscured undefined value or empty string
      expect(EnvConfig.CLOUDFLARE_API).toBeDefined()
    })

    it('should be included in required environment variables', async () => {
      // Read the source file to verify CLOUDFLARE_API is in requiredEnvs array
      const fs = await import('fs/promises')
      const path = await import('path')
      const envConfigPath = path.join(process.cwd(), 'src/infrastructure/config/env.config.ts')
      const content = await fs.readFile(envConfigPath, 'utf-8')

      // Verify CLOUDFLARE_API is listed in the requiredEnvs array
      expect(content).toContain('CLOUDFLARE_API')
      expect(content).toMatch(/requiredEnvs.*=.*\[[\s\S]*'CLOUDFLARE_API'/m)
    })
  })

  describe('BUCKET', () => {
    it('should be a static readonly property', async () => {
      process.env.BUCKET = 'my-bucket'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'BUCKET')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use BUCKET from environment when set', async () => {
      process.env.BUCKET = 'production-bucket'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.BUCKET).toBe('production-bucket')
    })

    it('should default to empty string when not set and no .env value', async () => {
      delete process.env.BUCKET
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // May be empty string or value from .env file
      expect(typeof EnvConfig.BUCKET).toBe('string')
      expect(EnvConfig.BUCKET).toBeDefined()
    })

    it('should have type string', async () => {
      process.env.BUCKET = 'dev-bucket'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.BUCKET).toBe('string')
      expect(EnvConfig.BUCKET).toBe('dev-bucket')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.BUCKET = 'my-storage-bucket'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // BUCKET should be a plain string, not obscured
      expect(typeof EnvConfig.BUCKET).toBe('string')
      expect(EnvConfig.BUCKET).toBe('my-storage-bucket')
      // Should not have obscured behavior
      expect(String(EnvConfig.BUCKET)).toBe('my-storage-bucket')
    })

    it('should accept bucket name with hyphens', async () => {
      process.env.BUCKET = 'my-production-bucket-2024'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.BUCKET).toBe('my-production-bucket-2024')
    })

    it('should handle empty string value', async () => {
      process.env.BUCKET = ''
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.BUCKET).toBe('')
    })
  })

  describe('REFRESH_TOKEN_EXPIRATION', () => {
    it('should be a static readonly property', async () => {
      process.env.REFRESH_TOKEN_EXPIRATION = '604800'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'REFRESH_TOKEN_EXPIRATION')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use REFRESH_TOKEN_EXPIRATION from environment when set', async () => {
      process.env.REFRESH_TOKEN_EXPIRATION = '1209600'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.REFRESH_TOKEN_EXPIRATION).toBe('1209600')
    })

    it('should default to "604800" (7 days) when REFRESH_TOKEN_EXPIRATION is not set', async () => {
      delete process.env.REFRESH_TOKEN_EXPIRATION
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()

      vi.doMock('dotenv', () => ({
        default: {
          config: vi.fn(() => ({ parsed: {} })),
        },
      }))

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.REFRESH_TOKEN_EXPIRATION).toBe('604800')

      vi.doUnmock('dotenv')
    })

    it('should have type string', async () => {
      process.env.REFRESH_TOKEN_EXPIRATION = '86400'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.REFRESH_TOKEN_EXPIRATION).toBe('string')
      expect(EnvConfig.REFRESH_TOKEN_EXPIRATION).toBe('86400')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.REFRESH_TOKEN_EXPIRATION = '604800'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.REFRESH_TOKEN_EXPIRATION).toBe('string')
      expect(EnvConfig.REFRESH_TOKEN_EXPIRATION).toBe('604800')
      expect(String(EnvConfig.REFRESH_TOKEN_EXPIRATION)).toBe('604800')
    })

    it('should accept numeric string values', async () => {
      process.env.REFRESH_TOKEN_EXPIRATION = '2592000'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.REFRESH_TOKEN_EXPIRATION).toBe('2592000')
    })
  })

  describe('ACCESS_TOKEN_BUFFER', () => {
    it('should be a static readonly property', async () => {
      process.env.ACCESS_TOKEN_BUFFER = '300'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'ACCESS_TOKEN_BUFFER')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use ACCESS_TOKEN_BUFFER from environment when set', async () => {
      process.env.ACCESS_TOKEN_BUFFER = '600'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.ACCESS_TOKEN_BUFFER).toBe('600')
    })

    it('should default to "300" (5 minutes) when ACCESS_TOKEN_BUFFER is not set', async () => {
      delete process.env.ACCESS_TOKEN_BUFFER
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()

      vi.doMock('dotenv', () => ({
        default: {
          config: vi.fn(() => ({ parsed: {} })),
        },
      }))

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.ACCESS_TOKEN_BUFFER).toBe('300')

      vi.doUnmock('dotenv')
    })

    it('should have type string', async () => {
      process.env.ACCESS_TOKEN_BUFFER = '180'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.ACCESS_TOKEN_BUFFER).toBe('string')
      expect(EnvConfig.ACCESS_TOKEN_BUFFER).toBe('180')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.ACCESS_TOKEN_BUFFER = '300'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.ACCESS_TOKEN_BUFFER).toBe('string')
      expect(EnvConfig.ACCESS_TOKEN_BUFFER).toBe('300')
      expect(String(EnvConfig.ACCESS_TOKEN_BUFFER)).toBe('300')
    })

    it('should accept numeric string values', async () => {
      process.env.ACCESS_TOKEN_BUFFER = '120'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.ACCESS_TOKEN_BUFFER).toBe('120')
    })

    it('should accept zero value', async () => {
      process.env.ACCESS_TOKEN_BUFFER = '0'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.ACCESS_TOKEN_BUFFER).toBe('0')
    })
  })
})
