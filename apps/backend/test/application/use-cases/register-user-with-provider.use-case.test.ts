import { uuidv7 } from 'uuidv7'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RegisterUserDto } from '../../../src/application/dtos/register-user.dto.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { EmailServicePort } from '../../../src/application/ports/email.service.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import type { RefreshTokenRepositoryPort } from '../../../src/application/ports/refresh-token.repository.port.js'
import type { TokenGeneratorPort } from '../../../src/application/ports/token-generator.port.js'
import type { UserRepositoryPort } from '../../../src/application/ports/user.repository.port.js'
import { RegisterUserWithProviderUseCase } from '../../../src/application/use-cases/register-user-with-provider.use-case.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { User } from '../../../src/domain/entities/user.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { EnvConfig } from '../../../src/infrastructure/config/env.config.js'
import { ConflictException } from '../../../src/shared/exceptions/conflict.exception.js'
import { InternalErrorException } from '../../../src/shared/exceptions/internal-error.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

// Helper function to create mock UserIdType from UUID string
function createMockUserId(uuid?: string): UserIdType {
  return new UserId(uuid || uuidv7()).getValue()
}

describe('RegisterUserWithProviderUseCase', () => {
  let useCase: RegisterUserWithProviderUseCase
  let mockUserRepository: UserRepositoryPort
  let mockEmailService: EmailServicePort
  let mockLogger: LoggerPort
  let mockTokenGenerator: TokenGeneratorPort
  let mockAuditLog: AuditLogPort
  let mockRefreshTokenRepository: RefreshTokenRepositoryPort
  const auditContext = { userId: null, ipAddress: '127.0.0.1', userAgent: 'test-agent' }

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Create mock implementations
    mockUserRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteUsers: vi.fn(),
      existsByEmail: vi.fn(),
      saveProvider: vi.fn(),
    }

    mockEmailService = {
      sendWelcomeEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
    }

    mockLogger = createMockLogger()

    mockTokenGenerator = {
      generateToken: vi.fn().mockReturnValue('mock-jwt-token'),
    }

    mockAuditLog = {
      log: vi.fn().mockResolvedValue(undefined),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    mockRefreshTokenRepository = {
      create: vi.fn().mockResolvedValue(undefined),
      findByHash: vi.fn(),
      revokeByHash: vi.fn(),
      revokeFamily: vi.fn(),
      revokeAllForUser: vi.fn(),
      deleteExpiredBefore: vi.fn(),
    }

    // Create use case instance with mocks
    useCase = new RegisterUserWithProviderUseCase(
      mockUserRepository,
      mockEmailService,
      mockLogger,
      mockTokenGenerator,
      mockAuditLog,
      mockRefreshTokenRepository
    )
  })

  describe('execute()', () => {
    describe('successful registration with OAuth provider', () => {
      it('should register a new user with provider successfully', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: createMockUserId(),
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto, auditContext)

        // Should return a user ID
        expect(result).toBeDefined()
        expect(result.userId).toBeDefined()
        expect(typeof result.userId).toBe('string')
        expect(result.userId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        )
      })

      it('should log successful registration to audit log', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')
        const mockUserId = createMockUserId()

        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: mockUserId,
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledTimes(2)
        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: mockUserId,
          entityType: EntityType.USER,
          entityId: mockUserId,
          action: AuditAction.CREATE,
          changes: { reason: 'new_user' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUserId,
            entityType: EntityType.TOKEN,
            action: AuditAction.TOKEN_ISSUED,
            changes: { reason: 'refresh_token_stored' },
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          })
        )
        // entityId should be the token family UUID (not the user ID)
        const tokenIssuedCall = vi
          .mocked(mockAuditLog.log)
          .mock.calls.find(
            ([entry]) =>
              entry.action === AuditAction.TOKEN_ISSUED &&
              entry.changes?.reason === 'refresh_token_stored'
          )
        expect(tokenIssuedCall?.[0].entityId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
        expect(tokenIssuedCall?.[0].entityId).not.toBe(mockUserId)
      })

      it('should return an access token', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: createMockUserId(),
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto, auditContext)

        expect(result.accessToken).toBe('mock-jwt-token')
        expect(result.refreshToken).toBeDefined()
        expect(typeof result.refreshToken).toBe('string')
        expect(typeof result.expiresInSeconds).toBe('number')
        expect(result.expiresInSeconds).toBeGreaterThan(0)
        expect(result.email).toBe('john@example.com')
        expect(result.roles).toEqual(['user'])
        expect(mockRefreshTokenRepository.create).toHaveBeenCalledTimes(1)
      })

      it('should save the user to the repository without password', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: createMockUserId(),
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        expect(mockUserRepository.saveProvider).toHaveBeenCalledTimes(1)

        const savedUser = vi.mocked(mockUserRepository.saveProvider).mock.calls?.[0]?.[0]
        expect(savedUser).toBeInstanceOf(User)
        expect(savedUser?.getEmail()).toBe('john@example.com')
        expect(savedUser?.getName()).toBe('John Doe')
        expect(savedUser?.getRole()).toBe('user')
        expect(savedUser?.getProvider()).toBe('google')
        expect(savedUser?.getPassword()).toBeUndefined()
      })

      it('should send a welcome email to the user', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: createMockUserId(),
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledTimes(1)
        expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
          'john@example.com',
          'John Doe'
        )
      })

      it('should log registration start with email', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: createMockUserId(),
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('Starting user registration', {
          event: 'user.oauth_registration.attempt',
        })
      })

      it('should log successful registration with userId', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: createMockUserId(),
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result = await useCase.execute(dto, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('User registered successfully', {
          event: 'user.registered',
          userId: result.userId,
        })
      })

      it('should generate JWT token with correct payload', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        const mockUserId = createMockUserId()
        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: mockUserId,
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        expect(mockTokenGenerator.generateToken).toHaveBeenCalledTimes(1)
        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith({
          sub: mockUserId,
          email: 'john@example.com',
          roles: ['user'],
        })
      })

      it('should create unique user IDs for different registrations', async () => {
        const dto1 = new RegisterUserDto(
          'john@example.com',
          'John Doe',
          'user',
          undefined,
          'google'
        )
        const dto2 = new RegisterUserDto(
          'jane@example.com',
          'Jane Smith',
          'user',
          undefined,
          'github'
        )

        vi.mocked(mockUserRepository.saveProvider).mockImplementation(() =>
          Promise.resolve({ userId: createMockUserId(), isNewUser: true })
        )
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        const result1 = await useCase.execute(dto1, auditContext)
        const result2 = await useCase.execute(dto2, auditContext)

        expect(result1.userId).not.toBe(result2.userId)
      })

      it('should handle different OAuth providers', async () => {
        const providers = ['google', 'github', 'facebook']

        for (const provider of providers) {
          const dto = new RegisterUserDto(
            'user@example.com',
            'User Name',
            'user',
            undefined,
            provider
          )

          vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
            userId: createMockUserId(),
            isNewUser: true,
          })
          vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

          await useCase.execute(dto, auditContext)

          const savedUser = vi.mocked(mockUserRepository.saveProvider).mock.calls?.[
            vi.mocked(mockUserRepository.saveProvider).mock.calls.length - 1
          ]?.[0]
          expect(savedUser?.getProvider()).toBe(provider)
        }
      })
    })

    describe('duplicate email handling', () => {
      it('should throw ConflictException when database rejects duplicate email', async () => {
        const dto = new RegisterUserDto(
          'existing@example.com',
          'John Doe',
          'user',
          undefined,
          'google'
        )

        // Simulate PostgreSQL unique constraint violation error (code 23505)
        const duplicateKeyError = Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          }
        )
        vi.mocked(mockUserRepository.saveProvider).mockRejectedValue(duplicateKeyError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(ConflictException)
        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'User with this email already exists'
        )
      })

      it('should not send welcome email when duplicate email is detected', async () => {
        const dto = new RegisterUserDto(
          'existing@example.com',
          'John Doe',
          'user',
          undefined,
          'google'
        )

        const duplicateKeyError = Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          }
        )
        vi.mocked(mockUserRepository.saveProvider).mockRejectedValue(duplicateKeyError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(ConflictException)

        expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled()
      })

      it('should log duplicate email failure to audit log', async () => {
        const dto = new RegisterUserDto(
          'duplicate@example.com',
          'Test User',
          'user',
          undefined,
          'google'
        )

        const duplicateKeyError = Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          }
        )
        vi.mocked(mockUserRepository.saveProvider).mockRejectedValue(duplicateKeyError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(ConflictException)

        expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: null,
          entityType: EntityType.USER,
          entityId: expect.any(String),
          action: AuditAction.REGISTRATION_FAILED,
          changes: { reason: 'duplicate_email' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        })
      })

      it('should log error when duplicate email is detected', async () => {
        const dto = new RegisterUserDto(
          'existing@example.com',
          'John Doe',
          'user',
          undefined,
          'google'
        )

        const duplicateKeyError = Object.assign(
          new Error('duplicate key value violates unique constraint'),
          {
            code: '23505',
          }
        )
        vi.mocked(mockUserRepository.saveProvider).mockRejectedValue(duplicateKeyError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(ConflictException)

        expect(mockLogger.error).toHaveBeenCalledWith('Failed to save user', duplicateKeyError, {
          event: 'user.oauth_registration.failed',
          reason: 'save_failed',
        })
      })
    })

    describe('email service failure handling', () => {
      it('should complete registration even if welcome email fails', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: createMockUserId(),
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockRejectedValue(new Error('SMTP error'))

        const result = await useCase.execute(dto, auditContext)

        expect(result).toBeDefined()
        expect(result.userId).toBeDefined()
        expect(result.accessToken).toBe('mock-jwt-token')
      })

      it('should log error when email fails but not throw', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        const mockUserId = createMockUserId()
        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: mockUserId,
          isNewUser: true,
        })

        const emailError = new Error('SMTP connection failed')
        vi.mocked(mockEmailService.sendWelcomeEmail).mockRejectedValue(emailError)

        await useCase.execute(dto, auditContext)

        expect(mockLogger.error).toHaveBeenCalledWith('Failed to send welcome email', emailError, {
          event: 'user.welcome_email.failed',
          userId: mockUserId,
        })
      })
    })

    describe('database error handling', () => {
      it('should throw original error when save fails with non-duplicate error', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        const dbError = new Error('Connection timeout')
        vi.mocked(mockUserRepository.saveProvider).mockRejectedValue(dbError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow('Connection timeout')
        expect(mockLogger.error).toHaveBeenCalledWith('Failed to save user', dbError, {
          event: 'user.oauth_registration.failed',
          reason: 'save_failed',
        })
      })

      it('should not send email when repository save fails', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.saveProvider).mockRejectedValue(new Error('Database error'))

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow()
        expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled()
      })

      it('should not log to audit log when repository save fails with non-duplicate error', async () => {
        const dto = new RegisterUserDto(
          'test@example.com',
          'Test User',
          'user',
          undefined,
          'google'
        )

        vi.mocked(mockUserRepository.saveProvider).mockRejectedValue(
          new Error('Database connection failed')
        )

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow()

        // Audit log should not be called for general database errors
        expect(mockAuditLog.log).not.toHaveBeenCalled()
      })
    })

    describe('role handling', () => {
      it('should register user with default user role', async () => {
        const dto = new RegisterUserDto('john@example.com', 'John Doe', 'user', undefined, 'google')

        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: createMockUserId(),
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        const savedUser = vi.mocked(mockUserRepository.saveProvider).mock.calls?.[0]?.[0]
        expect(savedUser?.getRole()).toBe('user')
      })

      it('should register user with admin role', async () => {
        const dto = new RegisterUserDto(
          'admin@example.com',
          'Admin User',
          'admin',
          undefined,
          'google'
        )

        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: createMockUserId(),
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        await useCase.execute(dto, auditContext)

        const savedUser = vi.mocked(mockUserRepository.saveProvider).mock.calls?.[0]?.[0]
        expect(savedUser?.getRole()).toBe('admin')
      })
    })

    describe('email validation', () => {
      it('should throw ValidationException for invalid email format', async () => {
        const dto = new RegisterUserDto('invalid-email', 'John Doe', 'user', undefined, 'google')

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(ValidationException)
      })

      it('should accept valid email formats', async () => {
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
          'user_name@subdomain.example.com',
        ]

        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: createMockUserId(),
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        for (const email of validEmails) {
          const dto = new RegisterUserDto(email, 'Test User', 'user', undefined, 'google')
          await expect(useCase.execute(dto, auditContext)).resolves.toBeDefined()
        }
      })
    })

    describe('provider validation', () => {
      it('should require provider when no password is provided', () => {
        expect(() => {
          RegisterUserDto.validate({
            email: 'john@example.com',
            name: 'John Doe',
            role: 'user',
          } as any)
        }).toThrow(ValidationException)
      })

      it('should accept various provider names', async () => {
        const providers = ['google', 'github', 'facebook', 'microsoft', 'apple']

        vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
          userId: createMockUserId(),
          isNewUser: true,
        })
        vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

        for (const provider of providers) {
          const dto = new RegisterUserDto('user@example.com', 'User', 'user', undefined, provider)
          await expect(useCase.execute(dto, auditContext)).resolves.toBeDefined()
        }
      })
    })
  })

  describe('duplicate email - ConflictException details', () => {
    it('should include dto.email in ConflictException details when duplicate email is rejected', async () => {
      const dto = new RegisterUserDto(
        'duplicate@example.com',
        'John Doe',
        'user',
        undefined,
        'google'
      )
      const duplicateKeyError = Object.assign(
        new Error('duplicate key value violates unique constraint'),
        { code: '23505' }
      )
      vi.mocked(mockUserRepository.saveProvider).mockRejectedValue(duplicateKeyError)

      await expect(useCase.execute(dto, auditContext)).rejects.toMatchObject({
        details: { email: 'duplicate@example.com' },
      })
    })
  })

  describe('returning user (isNewUser = false)', () => {
    it('should not write user CREATE audit entry for a returning user', async () => {
      const dto = new RegisterUserDto(
        'returning@example.com',
        'Returning User',
        'user',
        undefined,
        'google'
      )
      const mockUserId = createMockUserId()

      vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
        userId: mockUserId,
        isNewUser: false,
      })

      await useCase.execute(dto, auditContext)

      // Only the token audit should be called, not the user CREATE audit
      expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
      const auditCall = vi.mocked(mockAuditLog.log).mock.calls[0][0]
      expect(auditCall.action).toBe(AuditAction.TOKEN_ISSUED)
      expect(auditCall.action).not.toBe(AuditAction.CREATE)
    })

    it('should not send welcome email for a returning user', async () => {
      const dto = new RegisterUserDto(
        'returning@example.com',
        'Returning User',
        'user',
        undefined,
        'google'
      )
      const mockUserId = createMockUserId()

      vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
        userId: mockUserId,
        isNewUser: false,
      })

      await useCase.execute(dto, auditContext)

      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled()
    })

    it('should log "Returning user signed in" with event "user.oauth_login.success"', async () => {
      const dto = new RegisterUserDto(
        'returning@example.com',
        'Returning User',
        'user',
        undefined,
        'google'
      )
      const mockUserId = createMockUserId()

      vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
        userId: mockUserId,
        isNewUser: false,
      })

      await useCase.execute(dto, auditContext)

      expect(mockLogger.info).toHaveBeenCalledWith('Returning user signed in', {
        event: 'user.oauth_login.success',
        userId: mockUserId,
      })
    })

    it('should still return access token and refresh token for returning user', async () => {
      const dto = new RegisterUserDto(
        'returning@example.com',
        'Returning User',
        'user',
        undefined,
        'google'
      )
      const mockUserId = createMockUserId()

      vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
        userId: mockUserId,
        isNewUser: false,
      })

      const result = await useCase.execute(dto, auditContext)

      expect(result.accessToken).toBe('mock-jwt-token')
      expect(result.refreshToken).toBeDefined()
      expect(result.expiresInSeconds).toBeGreaterThan(0)
    })
  })

  describe('expiration boundary conditions', () => {
    let originalExpiration: unknown

    beforeEach(() => {
      originalExpiration = EnvConfig.REFRESH_TOKEN_EXPIRATION
    })

    afterEach(() => {
      ;(EnvConfig as any).REFRESH_TOKEN_EXPIRATION = originalExpiration
    })

    it('should use configured expiration when REFRESH_TOKEN_EXPIRATION is a positive number', async () => {
      ;(EnvConfig as any).REFRESH_TOKEN_EXPIRATION = 3600
      const dto = new RegisterUserDto('john@example.com', 'John', 'user', undefined, 'google')

      vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
        userId: createMockUserId(),
        isNewUser: true,
      })
      vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

      const result = await useCase.execute(dto, auditContext)

      expect(result.expiresInSeconds).toBe(3600)
    })

    it('should use fallback value 604800 when REFRESH_TOKEN_EXPIRATION is 0', async () => {
      ;(EnvConfig as any).REFRESH_TOKEN_EXPIRATION = 0
      const dto = new RegisterUserDto('john@example.com', 'John', 'user', undefined, 'google')

      vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
        userId: createMockUserId(),
        isNewUser: true,
      })
      vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

      const result = await useCase.execute(dto, auditContext)

      expect(result.expiresInSeconds).toBe(604800)
    })

    it('should use fallback value 604800 when REFRESH_TOKEN_EXPIRATION is not a finite number', async () => {
      ;(EnvConfig as any).REFRESH_TOKEN_EXPIRATION = 'not-a-number'
      const dto = new RegisterUserDto('john@example.com', 'John', 'user', undefined, 'google')

      vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
        userId: createMockUserId(),
        isNewUser: true,
      })
      vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

      const result = await useCase.execute(dto, auditContext)

      expect(result.expiresInSeconds).toBe(604800)
    })

    it('should set expiresAt to a future date approximately expiresInSeconds seconds from now', async () => {
      ;(EnvConfig as any).REFRESH_TOKEN_EXPIRATION = 3600
      const dto = new RegisterUserDto('john@example.com', 'John', 'user', undefined, 'google')

      vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
        userId: createMockUserId(),
        isNewUser: true,
      })
      vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

      const beforeExecute = Date.now()
      await useCase.execute(dto, auditContext)
      const afterExecute = Date.now()

      const createCall = vi.mocked(mockRefreshTokenRepository.create).mock.calls[0][0]
      const expiresAtMs = createCall.expiresAt.getTime()
      expect(expiresAtMs).toBeGreaterThanOrEqual(beforeExecute + 3600 * 1000)
      expect(expiresAtMs).toBeLessThanOrEqual(afterExecute + 3600 * 1000 + 1000)
    })
  })

  describe('refresh token storage failure', () => {
    it('should log error with correct message and context when create throws', async () => {
      const dto = new RegisterUserDto('john@example.com', 'John', 'user', undefined, 'google')
      const mockUserId = createMockUserId()
      const storageError = new Error('DB write failed')

      vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
        userId: mockUserId,
        isNewUser: true,
      })
      vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)
      vi.mocked(mockRefreshTokenRepository.create).mockRejectedValue(storageError)

      await expect(useCase.execute(dto, auditContext)).rejects.toThrow()

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to store refresh token', storageError, {
        event: 'token.store.failed',
        userId: mockUserId,
      })
    })

    it('should log audit entry with reason refresh_token_storage_failed when create throws', async () => {
      const dto = new RegisterUserDto('john@example.com', 'John', 'user', undefined, 'google')
      const storageError = new Error('DB write failed')

      vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
        userId: createMockUserId(),
        isNewUser: true,
      })
      vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)
      vi.mocked(mockRefreshTokenRepository.create).mockRejectedValue(storageError)

      await expect(useCase.execute(dto, auditContext)).rejects.toThrow()

      // The last audit log call should be the failure entry
      const allCalls = vi.mocked(mockAuditLog.log).mock.calls
      const failureAuditCall = allCalls[allCalls.length - 1][0]
      expect(failureAuditCall.changes).toEqual({ reason: 'refresh_token_storage_failed' })
      expect(failureAuditCall.action).toBe(AuditAction.TOKEN_ISSUED)
    })

    it('should include ipAddress in failure audit entry when create throws', async () => {
      const dto = new RegisterUserDto('john@example.com', 'John', 'user', undefined, 'google')
      const storageError = new Error('DB write failed')
      const contextWithIp = { userId: null, ipAddress: '10.20.30.40', userAgent: 'agent' }

      vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
        userId: createMockUserId(),
        isNewUser: true,
      })
      vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)
      vi.mocked(mockRefreshTokenRepository.create).mockRejectedValue(storageError)

      await expect(useCase.execute(dto, contextWithIp)).rejects.toThrow()

      const allCalls = vi.mocked(mockAuditLog.log).mock.calls
      const failureAuditCall = allCalls[allCalls.length - 1][0]
      expect(failureAuditCall.ipAddress).toBe('10.20.30.40')
    })

    it('should throw InternalErrorException with "Failed to store refresh token" when create throws', async () => {
      const dto = new RegisterUserDto('john@example.com', 'John', 'user', undefined, 'google')
      const storageError = new Error('DB write failed')

      vi.mocked(mockUserRepository.saveProvider).mockResolvedValue({
        userId: createMockUserId(),
        isNewUser: true,
      })
      vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)
      vi.mocked(mockRefreshTokenRepository.create).mockRejectedValue(storageError)

      let thrownError: unknown
      try {
        await useCase.execute(dto, auditContext)
        throw new Error('Expected useCase.execute to throw')
      } catch (error) {
        thrownError = error
      }

      expect(thrownError).toBeInstanceOf(InternalErrorException)
      expect((thrownError as Error).message).toBe('Failed to store refresh token')
    })
  })
})
