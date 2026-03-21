import { uuidv7 } from 'uuidv7'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginUserDto } from '../../../src/application/dtos/login-user.dto.js'
import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import type { RefreshTokenRepositoryPort } from '../../../src/application/ports/refresh-token.repository.port.js'
import type { TokenGeneratorPort } from '../../../src/application/ports/token-generator.port.js'
import type { UserRepositoryPort } from '../../../src/application/ports/user.repository.port.js'
import { LoginUserUseCase } from '../../../src/application/use-cases/login-user.use-case.js'
import { User } from '../../../src/domain/entities/user.js'
import { Email } from '../../../src/domain/value-objects/email.js'
import { Password } from '../../../src/domain/value-objects/password.js'
import { Role } from '../../../src/domain/value-objects/role.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'
import { EnvConfig } from '../../../src/infrastructure/config/env.config.js'
import { InternalErrorException } from '../../../src/shared/exceptions/internal-error.exception.js'
import { UnauthorizedException } from '../../../src/shared/exceptions/unauthorized.exception.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

// Explicit TTL used throughout this suite – keeps assertions independent of the
// REFRESH_TOKEN_EXPIRATION environment variable that may differ across environments.
const TEST_REFRESH_TOKEN_EXPIRATION_SECONDS = 604800 // 7 days

// vi.mock() is hoisted by Vitest so the mocked value is applied before any imports are executed.
vi.mock('../../../src/infrastructure/config/env.config.js', () => ({
  EnvConfig: {
    // Pin REFRESH_TOKEN_EXPIRATION to the value of TEST_REFRESH_TOKEN_EXPIRATION_SECONDS (604800)
    REFRESH_TOKEN_EXPIRATION: '604800',
  },
}))

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase
  let mockUserRepository: UserRepositoryPort
  let mockLogger: LoggerPort
  let mockTokenGenerator: TokenGeneratorPort
  let mockAuditLog: AuditLogPort
  let mockRefreshTokenRepository: RefreshTokenRepositoryPort

  // Standard audit context for tests
  const auditContext = {
    userId: null,
    ipAddress: '127.0.0.1',
    userAgent: 'test-user-agent',
  }

  // Helper function to create a mock user
  const createMockUser = async (
    email: string,
    password: string,
    role: string = 'user',
    name: string = 'Test User'
  ): Promise<User> => {
    const userId = new UserId(uuidv7()).getValue()
    return new User(
      userId,
      new Email(email).getValue(),
      name,
      new Role(role),
      await Password.create(password)
    )
  }

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
    useCase = new LoginUserUseCase(
      mockUserRepository,
      mockLogger,
      mockTokenGenerator,
      mockAuditLog,
      mockRefreshTokenRepository
    )
  })

  describe('execute()', () => {
    describe('successful login', () => {
      it('should login user successfully with valid credentials', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        expect(result).toBeDefined()
        expect(result.userId).toBe(mockUser.id)
        expect(result.email).toBe('john@example.com')
        expect(result.accessToken).toBe('mock-jwt-token')
        expect(result.roles).toEqual(['user'])
        expect(result.refreshToken).toBeDefined()
        expect(typeof result.refreshToken).toBe('string')
        expect(result.expiresInSeconds).toBe(TEST_REFRESH_TOKEN_EXPIRATION_SECONDS) // 7 days in seconds
      })

      it('should find user by email', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1)
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com')
      })

      it('should verify password correctly', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        // Spy on verifyPassword method
        const verifyPasswordSpy = vi.spyOn(mockUser, 'verifyPassword')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(verifyPasswordSpy).toHaveBeenCalledTimes(1)
        expect(verifyPasswordSpy).toHaveBeenCalledWith('SecurePass123!')
      })

      it('should generate JWT token with correct payload', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!', 'admin')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockTokenGenerator.generateToken).toHaveBeenCalledTimes(1)
        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith({
          sub: mockUser.id,
          email: 'john@example.com',
          roles: ['admin'],
        })
      })

      it('should log login attempt with email', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('User login attempt', {
          event: 'user.login.attempt',
        })
      })

      it('should log successful login with userId and email', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('User logged in successfully', {
          event: 'user.login.success',
          userId: mockUser.id,
        })
      })

      it('should handle admin role correctly', async () => {
        const dto = new LoginUserDto('admin@example.com', 'AdminPass123!')
        const mockUser = await createMockUser('admin@example.com', 'AdminPass123!', 'admin')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        expect(result.roles).toEqual(['admin'])
        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith(
          expect.objectContaining({
            roles: ['admin'],
          })
        )
      })

      it('should return access token in response', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
        vi.mocked(mockTokenGenerator.generateToken).mockReturnValue('custom-jwt-token-12345')

        const result = await useCase.execute(dto, auditContext)

        expect(result.accessToken).toBe('custom-jwt-token-12345')
      })

      it('should log audit entry for successful login', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledTimes(2)
        expect(mockAuditLog.log).toHaveBeenCalledWith({
          userId: mockUser.id,
          entityType: 'user',
          entityId: mockUser.id,
          action: 'login',
          changes: {
            email: 'john@example.com',
            success: true,
          },
          ipAddress: '127.0.0.1',
          userAgent: 'test-user-agent',
        })
        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUser.id,
            entityType: 'token',
            action: 'token_issued',
            changes: {
              reason: 'refresh_token_stored',
            },
            ipAddress: '127.0.0.1',
            userAgent: 'test-user-agent',
          })
        )
        // entityId should be the token family UUID (not the user ID)
        const tokenIssuedCall = vi
          .mocked(mockAuditLog.log)
          .mock.calls.find(
            ([entry]) =>
              entry.action === 'token_issued' && entry.changes?.reason === 'refresh_token_stored'
          )
        expect(tokenIssuedCall?.[0].entityId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
        expect(tokenIssuedCall?.[0].entityId).not.toBe(mockUser.id)
      })
    })

    describe('user not found', () => {
      it('should throw UnauthorizedException when user does not exist', async () => {
        const dto = new LoginUserDto('nonexistent@example.com', 'Password123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)
        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid email or password'
        )
      })

      it('should log warning when user is not found', async () => {
        const dto = new LoginUserDto('nonexistent@example.com', 'Password123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockLogger.warn).toHaveBeenCalledWith('Login failed: User not found', {
          event: 'user.login.failed',
          reason: 'user_not_found',
        })
      })

      it('should not call token generator when user is not found', async () => {
        const dto = new LoginUserDto('nonexistent@example.com', 'Password123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockTokenGenerator.generateToken).not.toHaveBeenCalled()
      })

      it('should not log successful login when user is not found', async () => {
        const dto = new LoginUserDto('nonexistent@example.com', 'Password123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockLogger.info).toHaveBeenCalledTimes(1) // Only login attempt
        expect(mockLogger.info).not.toHaveBeenCalledWith(
          'User logged in successfully',
          expect.any(Object)
        )
      })

      it('should use generic error message to prevent user enumeration', async () => {
        const dto = new LoginUserDto('nonexistent@example.com', 'Password123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid email or password'
        )
      })

      it('should log audit entry with reason user_not_found when user does not exist', async () => {
        const dto = new LoginUserDto('nonexistent@example.com', 'Password123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            changes: expect.objectContaining({ reason: 'user_not_found' }),
          })
        )
      })
    })

    describe('invalid password', () => {
      it('should throw UnauthorizedException when password is incorrect', async () => {
        const dto = new LoginUserDto('john@example.com', 'WrongPassword123!')
        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)
        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid email or password'
        )
      })

      it('should log warning when password is invalid', async () => {
        const dto = new LoginUserDto('john@example.com', 'WrongPassword123!')
        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockLogger.warn).toHaveBeenCalledWith('Login failed: Invalid password', {
          event: 'user.login.failed',
          reason: 'invalid_password',
          userId: mockUser.id,
        })
      })

      it('should not call token generator when password is invalid', async () => {
        const dto = new LoginUserDto('john@example.com', 'WrongPassword123!')
        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockTokenGenerator.generateToken).not.toHaveBeenCalled()
      })

      it('should not log successful login when password is invalid', async () => {
        const dto = new LoginUserDto('john@example.com', 'WrongPassword123!')
        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockLogger.info).toHaveBeenCalledTimes(1) // Only login attempt
        expect(mockLogger.info).not.toHaveBeenCalledWith(
          'User logged in successfully',
          expect.any(Object)
        )
      })

      it('should use generic error message to prevent password guessing', async () => {
        const dto = new LoginUserDto('john@example.com', 'WrongPassword123!')
        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Invalid email or password'
        )
      })

      it('should log audit entry with reason invalid_password when password is wrong', async () => {
        const dto = new LoginUserDto('john@example.com', 'WrongPassword123!')
        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            changes: expect.objectContaining({ reason: 'invalid_password' }),
          })
        )
      })
    })

    describe('edge cases', () => {
      it('should handle repository errors gracefully', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')

        const dbError = new Error('Database connection failed')
        vi.mocked(mockUserRepository.findByEmail).mockRejectedValue(dbError)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Database connection failed'
        )
      })

      it('should handle email with different casing', async () => {
        const dto = new LoginUserDto('JOHN@EXAMPLE.COM', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        expect(result).toBeDefined()
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('JOHN@EXAMPLE.COM')
      })

      it('should handle password verification failure', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'DifferentPass456!')

        // Mock verifyPassword to return false
        vi.spyOn(mockUser, 'verifyPassword').mockResolvedValue(false)

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)
      })

      it('should generate unique tokens for different users', async () => {
        const dto1 = new LoginUserDto('user1@example.com', 'Pass123!')
        const dto2 = new LoginUserDto('user2@example.com', 'Pass456!')

        const mockUser1 = await createMockUser('user1@example.com', 'Pass123!')
        const mockUser2 = await createMockUser('user2@example.com', 'Pass456!')

        vi.mocked(mockUserRepository.findByEmail)
          .mockResolvedValueOnce(mockUser1)
          .mockResolvedValueOnce(mockUser2)

        vi.mocked(mockTokenGenerator.generateToken)
          .mockReturnValueOnce('token-for-user1')
          .mockReturnValueOnce('token-for-user2')

        const result1 = await useCase.execute(dto1, auditContext)
        const result2 = await useCase.execute(dto2, auditContext)

        expect(result1.accessToken).toBe('token-for-user1')
        expect(result2.accessToken).toBe('token-for-user2')
        expect(result1.userId).not.toBe(result2.userId)
      })
    })

    describe('security considerations', () => {
      it('should not expose user existence through different error messages', async () => {
        const dtoNonExistent = new LoginUserDto('nonexistent@example.com', 'Password123!')
        const dtoWrongPassword = new LoginUserDto('john@example.com', 'WrongPassword!')

        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockUser)

        let errorMessage1: string = ''
        let errorMessage2: string = ''

        try {
          await useCase.execute(dtoNonExistent, auditContext)
        } catch (error: any) {
          errorMessage1 = error.message
        }

        try {
          await useCase.execute(dtoWrongPassword, auditContext)
        } catch (error: any) {
          errorMessage2 = error.message
        }

        // Both errors should have the same generic message
        expect(errorMessage1).toBe('Invalid email or password')
        expect(errorMessage2).toBe('Invalid email or password')
      })

      it('should not leak user information in successful login response', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        // Should not expose sensitive data like password hash
        expect(result).not.toHaveProperty('password')
        expect(result).not.toHaveProperty('passwordHash')

        // Should only expose necessary fields
        expect(Object.keys(result).sort()).toEqual([
          'accessToken',
          'email',
          'expiresInSeconds',
          'refreshToken',
          'roles',
          'userId',
        ])
      })

      it('should log sensitive operations for security audit', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        // Verify security audit logs are created
        expect(mockLogger.info).toHaveBeenCalledWith(
          'User login attempt',
          expect.objectContaining({ event: 'user.login.attempt' })
        )
        expect(mockLogger.info).toHaveBeenCalledWith(
          'User logged in successfully',
          expect.objectContaining({ userId: mockUser.id })
        )
      })

      it('should log failed login attempts for security monitoring', async () => {
        const dto = new LoginUserDto('attacker@example.com', 'GuessedPassword!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockLogger.warn).toHaveBeenCalledWith('Login failed: User not found', {
          event: 'user.login.failed',
          reason: 'user_not_found',
        })
      })
    })

    describe('token generation', () => {
      it('should include user ID in token payload', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith(
          expect.objectContaining({
            sub: mockUser.id,
          })
        )
      })

      it('should include email in token payload', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'john@example.com',
          })
        )
      })

      it('should include roles in token payload', async () => {
        const dto = new LoginUserDto('admin@example.com', 'AdminPass123!')
        const mockUser = await createMockUser('admin@example.com', 'AdminPass123!', 'admin')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith(
          expect.objectContaining({
            roles: ['admin'],
          })
        )
      })

      it('should handle token generation failure', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
        vi.mocked(mockTokenGenerator.generateToken).mockImplementation(() => {
          throw new Error('Token generation failed')
        })

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow('Token generation failed')
      })
    })

    describe('refresh token generation', () => {
      it('should generate and store refresh token on successful login', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        expect(mockRefreshTokenRepository.create).toHaveBeenCalledTimes(1)
        expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUser.id,
            tokenHash: expect.any(String),
            tokenFamily: expect.any(String),
            expiresAt: expect.any(Date),
            ipAddress: '127.0.0.1',
            userAgent: 'test-user-agent',
          })
        )
      })

      it('should return raw refresh token in response', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        expect(result.refreshToken).toBeDefined()
        expect(typeof result.refreshToken).toBe('string')
        expect(result.refreshToken.length).toBeGreaterThan(0)
        // Refresh token should be a hex string
        expect(result.refreshToken).toMatch(/^[0-9a-f]+$/)
      })

      it('should return correct expiresInSeconds value (7 days in seconds)', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        expect(result.expiresInSeconds).toBe(TEST_REFRESH_TOKEN_EXPIRATION_SECONDS) // 7 * 24 * 60 * 60 seconds
        expect(typeof result.expiresInSeconds).toBe('number')
      })

      it('should generate unique tokenFamily for each login', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        // First login
        await useCase.execute(dto, auditContext)
        const firstCall = vi.mocked(mockRefreshTokenRepository.create).mock.calls[0][0]
        const firstTokenFamily = firstCall.tokenFamily

        // Second login (same user)
        await useCase.execute(dto, auditContext)
        const secondCall = vi.mocked(mockRefreshTokenRepository.create).mock.calls[1][0]
        const secondTokenFamily = secondCall.tokenFamily

        // Token families should be different (new rotation chain)
        expect(firstTokenFamily).not.toBe(secondTokenFamily)
      })

      it('should store SHA-256 hash, not raw refresh token', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        const createCall = vi.mocked(mockRefreshTokenRepository.create).mock.calls[0][0]

        // Token hash should be hex string (SHA-256 produces 64 hex chars)
        expect(createCall.tokenHash).toMatch(/^[0-9a-f]{64}$/)
        // Raw token and hash should be different
        expect(createCall.tokenHash).not.toBe(result.refreshToken)
      })

      it('should set correct expiration date (7 days from now)', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        vi.useFakeTimers()
        try {
          const fixedNow = new Date('2024-01-01T00:00:00.000Z')
          vi.setSystemTime(fixedNow)

          await useCase.execute(dto, auditContext)

          const createCall = vi.mocked(mockRefreshTokenRepository.create).mock.calls[0][0]
          const expiresAt = createCall.expiresAt.getTime()

          const expectedExpiresAt =
            fixedNow.getTime() + TEST_REFRESH_TOKEN_EXPIRATION_SECONDS * 1000

          expect(expiresAt).toBe(expectedExpiresAt)
        } finally {
          vi.useRealTimers()
        }
      })

      it('should pass audit context to refresh token repository', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        const customAuditContext = {
          userId: null,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 Custom Browser',
        }

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, customAuditContext)

        expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 Custom Browser',
          })
        )
      })

      it('should handle undefined userAgent in audit context', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        const auditContextNoUserAgent = {
          userId: null,
          ipAddress: '127.0.0.1',
          userAgent: null,
        }

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContextNoUserAgent)

        expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userAgent: undefined,
          })
        )
      })

      it('should not create refresh token if password is incorrect', async () => {
        const dto = new LoginUserDto('john@example.com', 'WrongPassword!')
        const mockUser = await createMockUser('john@example.com', 'CorrectPassword123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockRefreshTokenRepository.create).not.toHaveBeenCalled()
      })

      it('should not create refresh token if user is not found', async () => {
        const dto = new LoginUserDto('nonexistent@example.com', 'Password123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(UnauthorizedException)

        expect(mockRefreshTokenRepository.create).not.toHaveBeenCalled()
      })

      it('should propagate error if refresh token storage fails', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
        vi.mocked(mockRefreshTokenRepository.create).mockRejectedValue(
          new Error('Database error: Unable to store refresh token')
        )

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(
          'Failed to store refresh token'
        )

        // Should log the original error
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to store refresh token',
          expect.any(Error),
          expect.objectContaining({
            event: 'token.store.failed',
            userId: mockUser.id,
          })
        )

        // Should log TOKEN_ISSUED audit for failure only (catch)
        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'token_issued',
            changes: { reason: 'refresh_token_storage_failed' },
          })
        )
        expect(mockAuditLog.log).not.toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'token_issued',
            changes: { reason: 'refresh_token_stored' },
          })
        )
      })

      it('should generate different refresh tokens for same user on different logins', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result1 = await useCase.execute(dto, auditContext)
        const result2 = await useCase.execute(dto, auditContext)

        expect(result1.refreshToken).not.toBe(result2.refreshToken)
      })

      it('should store userId from authenticated user', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        await useCase.execute(dto, auditContext)

        const createCall = vi.mocked(mockRefreshTokenRepository.create).mock.calls[0][0]
        expect(createCall.userId).toBe(mockUser.id)
      })

      it('should include ipAddress in failure audit log when refresh token storage fails', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')

        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
        vi.mocked(mockRefreshTokenRepository.create).mockRejectedValue(
          new Error('Database error: Unable to store refresh token')
        )

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow()

        // verify the catch-block audit entry carries the ipAddress (kills mutant 3922: ?? → &&)
        expect(mockAuditLog.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'token_issued',
            changes: { reason: 'refresh_token_storage_failed' },
            ipAddress: '127.0.0.1',
          })
        )
      })
    })

    describe('user found but has no ID', () => {
      let userWithNoId: User

      beforeEach(() => {
        userWithNoId = {
          id: undefined,
          verifyPassword: vi.fn(),
          getEmail: vi.fn().mockReturnValue('john@example.com'),
          getRole: vi.fn().mockReturnValue('user'),
        } as unknown as User
      })

      it('should throw InternalErrorException with message "User found but has no ID"', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(userWithNoId)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow(InternalErrorException)
        await expect(useCase.execute(dto, auditContext)).rejects.toThrow('User found but has no ID')
      })

      it('should log error with correct message and context when user has no ID', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(userWithNoId)

        await expect(useCase.execute(dto, auditContext)).rejects.toThrow()

        // kills 3862 (first arg), 3863 (second arg message), 3864/3865/3866 (third arg object)
        expect(mockLogger.error).toHaveBeenCalledWith(
          'User found but has no ID',
          expect.objectContaining({ message: 'Missing user ID' }),
          {
            event: 'user.login.failed',
            reason: 'missing_user_id',
          }
        )
      })

      it('should include email in thrown InternalErrorException details', async () => {
        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(userWithNoId)

        // kills 3867 (message string) and 3868 ({ email: dto.email } → {})
        await expect(useCase.execute(dto, auditContext)).rejects.toMatchObject({
          message: 'User found but has no ID',
          details: { email: 'john@example.com' },
        })
      })
    })

    describe('expiration boundary conditions', () => {
      afterEach(() => {
        // Restore the string mock value used by the rest of the suite

        ;(EnvConfig as any).REFRESH_TOKEN_EXPIRATION = '604800'
      })

      it('should use configured value when REFRESH_TOKEN_EXPIRATION is a positive number', async () => {
        // Setting to a numeric value != fallback (7*24*60*60=604800) lets us verify
        // configuredExpiration > 0 is evaluated (kills mutant 3888: replaces with false)

        ;(EnvConfig as any).REFRESH_TOKEN_EXPIRATION = 3600

        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')
        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        expect(result.expiresInSeconds).toBe(3600)
      })

      it('should use fallback value when REFRESH_TOKEN_EXPIRATION is 0', async () => {
        // 0 is a number but not > 0, so fallback (7*24*60*60) is used.
        // Mutants 3893 (>0 → true), 3894 (> → >=), 3895 (> → <=) would each use 0
        // instead of the fallback, causing this assertion to fail.

        ;(EnvConfig as any).REFRESH_TOKEN_EXPIRATION = 0

        const dto = new LoginUserDto('john@example.com', 'SecurePass123!')
        const mockUser = await createMockUser('john@example.com', 'SecurePass123!')
        vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

        const result = await useCase.execute(dto, auditContext)

        expect(result.expiresInSeconds).toBe(7 * 24 * 60 * 60)
      })
    })
  })
})
