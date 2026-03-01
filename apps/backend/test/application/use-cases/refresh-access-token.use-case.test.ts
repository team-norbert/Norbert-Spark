import { uuidv7 } from 'uuidv7'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import type { RefreshTokenRepositoryPort } from '../../../src/application/ports/refresh-token.repository.port.js'
import type { TokenGeneratorPort } from '../../../src/application/ports/token-generator.port.js'
import type { UserRepositoryPort } from '../../../src/application/ports/user.repository.port.js'
import { RefreshAccessTokenUseCase } from '../../../src/application/use-cases/refresh-access-token.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { RefreshTokenRecord } from '../../../src/domain/entities/refresh-token-record.js'
import { User } from '../../../src/domain/entities/user.js'
import { Email } from '../../../src/domain/value-objects/email.js'
import { Password } from '../../../src/domain/value-objects/password.js'
import { RefreshToken } from '../../../src/domain/value-objects/refreshToken.js'
import { Role } from '../../../src/domain/value-objects/role.js'
import { UserId, type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { Uuid, type UUIDType } from '../../../src/domain/value-objects/uuid.js'
import { UnauthorizedException } from '../../../src/shared/exceptions/unauthorized.exception.js'

describe('RefreshAccessTokenUseCase', () => {
  let useCase: RefreshAccessTokenUseCase
  let mockLogger: LoggerPort
  let mockAuditLog: AuditLogPort
  let mockRefreshTokenRepo: RefreshTokenRepositoryPort
  let mockUserRepo: UserRepositoryPort
  let mockTokenGenerator: TokenGeneratorPort

  // Standard audit context for tests
  const auditContext: AuditContext = {
    userId: null,
    ipAddress: '127.0.0.1',
    userAgent: 'test-user-agent',
  }

  // Helper function to create a branded UUID
  const createUUID = (id?: string): UUIDType => {
    return new Uuid(id || uuidv7()).getValue()
  }

  // Helper function to create a branded UserId
  const createUserId = (id?: string): UserIdType => {
    return new UserId(id || uuidv7()).getValue()
  }

  // Helper function to create a mock user
  const createMockUser = async (
    id?: UserIdType,
    email: string = 'test@example.com',
    role: string = 'user'
  ): Promise<User> => {
    const userId = id || createUserId()
    return new User(
      userId,
      new Email(email).getValue(),
      'Test User',
      new Role(role),
      await Password.create('ValidPassword123!')
    )
  }

  // Helper function to create a refresh token record
  const createMockTokenRecord = (overrides?: {
    userId?: UserIdType
    tokenHash?: string
    tokenFamily?: UUIDType
    expiresAt?: Date
    revokedAt?: Date | null
    isExpired?: boolean
    isRevoked?: boolean
  }): RefreshTokenRecord => {
    const userId = overrides?.userId || createUserId()
    const tokenHash = overrides?.tokenHash || 'a'.repeat(64)
    const tokenFamily = overrides?.tokenFamily || createUUID()
    const now = new Date()
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const pastDate = new Date(now.getTime() - 1000) // 1 second ago

    const expiresAt = overrides?.isExpired ? pastDate : overrides?.expiresAt || futureDate

    const revokedAt = overrides?.isRevoked
      ? now
      : overrides?.revokedAt !== undefined
        ? overrides.revokedAt
        : null

    return new RefreshTokenRecord(
      createUUID(),
      userId,
      tokenHash,
      tokenFamily,
      expiresAt,
      revokedAt,
      new Date()
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }

    mockAuditLog = {
      log: vi.fn().mockResolvedValue(undefined),
      getByEntity: vi.fn(),
      getByUser: vi.fn(),
      getByAction: vi.fn(),
    }

    mockRefreshTokenRepo = {
      create: vi.fn().mockResolvedValue(undefined),
      findByHash: vi.fn(),
      revokeByHash: vi.fn().mockResolvedValue(undefined),
      revokeFamily: vi.fn().mockResolvedValue(undefined),
      revokeAllForUser: vi.fn().mockResolvedValue(undefined),
      deleteExpiredBefore: vi.fn().mockResolvedValue(0),
    }

    mockUserRepo = {
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

    mockTokenGenerator = {
      generateToken: vi.fn().mockReturnValue('mock-access-token'),
    }

    useCase = new RefreshAccessTokenUseCase(
      mockLogger,
      mockAuditLog,
      mockRefreshTokenRepo,
      mockUserRepo,
      mockTokenGenerator
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('execute()', () => {
    describe('successful token refresh', () => {
      it('should refresh access token successfully with valid refresh token', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockUser = await createMockUser()
        const mockRecord = createMockTokenRecord({ userId: mockUser.id as UserIdType })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)

        const result = await useCase.execute(rawToken, auditContext)

        expect(result).toBeDefined()
        expect(result.accessToken).toBe('mock-access-token')
        expect(result.refreshToken).toBeDefined()
        expect(result.refreshToken).toHaveLength(64)
        expect(result.expiresIn).toBeInstanceOf(Date)
      })

      it('should hash incoming refresh token and look it up', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const expectedHash = mockToken.getHash()
        const mockUser = await createMockUser()
        const mockRecord = createMockTokenRecord({
          userId: mockUser.id as UserIdType,
          tokenHash: expectedHash,
        })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)

        await useCase.execute(rawToken, auditContext)

        expect(mockRefreshTokenRepo.findByHash).toHaveBeenCalledTimes(1)
        expect(mockRefreshTokenRepo.findByHash).toHaveBeenCalledWith(expectedHash)
      })

      it('should revoke the current token by hash', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const tokenHash = mockToken.getHash()
        const mockUser = await createMockUser()
        const mockRecord = createMockTokenRecord({
          userId: mockUser.id as UserIdType,
          tokenHash,
        })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)

        await useCase.execute(rawToken, auditContext)

        expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledTimes(1)
        expect(mockRefreshTokenRepo.revokeByHash).toHaveBeenCalledWith(tokenHash)
      })

      it('should load user by userId from token record', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockUser = await createMockUser()
        const mockRecord = createMockTokenRecord({ userId: mockUser.id as UserIdType })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)

        await useCase.execute(rawToken, auditContext)

        expect(mockUserRepo.findById).toHaveBeenCalledTimes(1)
        expect(mockUserRepo.findById).toHaveBeenCalledWith(mockUser.id)
      })

      it('should generate new access token with correct JWT claims', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockUser = await createMockUser(undefined, 'john@example.com', 'admin')
        const mockRecord = createMockTokenRecord({ userId: mockUser.id as UserIdType })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)

        await useCase.execute(rawToken, auditContext)

        expect(mockTokenGenerator.generateToken).toHaveBeenCalledTimes(1)
        expect(mockTokenGenerator.generateToken).toHaveBeenCalledWith({
          sub: mockUser.id,
          email: 'john@example.com',
          roles: ['admin'],
        })
      })

      it('should store new refresh token with same token family', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockUser = await createMockUser()
        const originalTokenFamily = createUUID()
        const mockRecord = createMockTokenRecord({
          userId: mockUser.id as UserIdType,
          tokenFamily: originalTokenFamily,
        })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)

        await useCase.execute(rawToken, auditContext)

        expect(mockRefreshTokenRepo.create).toHaveBeenCalledTimes(1)
        const createCall = vi.mocked(mockRefreshTokenRepo.create).mock.calls[0][0]
        expect(createCall.userId).toBe(mockUser.id)
        expect(createCall.tokenFamily).toBe(originalTokenFamily)
        expect(createCall.tokenHash).toBeDefined()
        expect(createCall.tokenHash).toHaveLength(64)
        expect(createCall.expiresAt).toBeInstanceOf(Date)
        expect(createCall.ipAddress).toBe('127.0.0.1')
        expect(createCall.userAgent).toBe('test-user-agent')
      })

      it('should log successful token refresh to audit log', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockUser = await createMockUser()
        const mockRecord = createMockTokenRecord({ userId: mockUser.id as UserIdType })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)

        await useCase.execute(rawToken, auditContext)

        expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
        const auditCall = vi.mocked(mockAuditLog.log).mock.calls[0][0]
        expect(auditCall.userId).toBe(mockRecord.getUserId())
        expect(auditCall.entityType).toBe(EntityType.TOKEN)
        expect(auditCall.action).toBe(AuditAction.UPDATE)
        expect(auditCall.changes).toEqual({ reason: 'token_refreshed' })
        expect(auditCall.ipAddress).toBe('127.0.0.1')
        expect(auditCall.userAgent).toBe('test-user-agent')
      })

      it('should return new access token, refresh token, and expiration date', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockUser = await createMockUser()
        const mockRecord = createMockTokenRecord({ userId: mockUser.id as UserIdType })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)

        const result = await useCase.execute(rawToken, auditContext)

        expect(result.accessToken).toBe('mock-access-token')
        expect(result.refreshToken).toMatch(/^[0-9a-f]{64}$/i)
        expect(result.expiresIn).toBeInstanceOf(Date)
        expect(result.expiresIn.getTime()).toBeGreaterThan(Date.now())
      })

      it('should log execution start with info level', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockUser = await createMockUser()
        const mockRecord = createMockTokenRecord({ userId: mockUser.id as UserIdType })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)

        await useCase.execute(rawToken, auditContext)

        expect(mockLogger.info).toHaveBeenCalledWith('Executing RefreshAccessTokenUseCase', {
          tokenHash: mockToken.getHash(),
        })
      })
    })

    describe('invalid refresh token', () => {
      it('should throw UnauthorizedException if token not found', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(null)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow(UnauthorizedException)
        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow(
          'Invalid refresh token'
        )
      })

      it('should not attempt to revoke or refresh when token not found', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(null)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow()

        expect(mockRefreshTokenRepo.revokeByHash).not.toHaveBeenCalled()
        expect(mockUserRepo.findById).not.toHaveBeenCalled()
        expect(mockTokenGenerator.generateToken).not.toHaveBeenCalled()
        expect(mockRefreshTokenRepo.create).not.toHaveBeenCalled()
      })

      it('should log error when token not found', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(null)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow()

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to refresh access token',
          expect.any(Error),
          { tokenHash: mockToken.getHash() }
        )
      })
    })

    describe('revoked token (replay attack)', () => {
      it('should throw UnauthorizedException if token is revoked', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockRecord = createMockTokenRecord({ isRevoked: true })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow(UnauthorizedException)
        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow(
          'Token has been revoked'
        )
      })

      it('should revoke entire token family when revoked token is used', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const tokenFamily = createUUID()
        const mockRecord = createMockTokenRecord({
          isRevoked: true,
          tokenFamily,
        })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow()

        expect(mockRefreshTokenRepo.revokeFamily).toHaveBeenCalledTimes(1)
        expect(mockRefreshTokenRepo.revokeFamily).toHaveBeenCalledWith(tokenFamily)
      })

      it('should log replay attack detection to audit log', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockRecord = createMockTokenRecord({ isRevoked: true })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow()

        expect(mockAuditLog.log).toHaveBeenCalledTimes(1)
        const auditCall = vi.mocked(mockAuditLog.log).mock.calls[0][0]
        expect(auditCall.userId).toBe(mockRecord.getUserId())
        expect(auditCall.entityType).toBe(EntityType.TOKEN)
        expect(auditCall.action).toBe(AuditAction.UPDATE)
        expect(auditCall.changes).toEqual({ reason: 'refresh_token_replay_detected' })
      })

      it('should revoke family before logging audit entry', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockRecord = createMockTokenRecord({ isRevoked: true })
        const callOrder: string[] = []

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockRefreshTokenRepo.revokeFamily).mockImplementation(async () => {
          callOrder.push('revokeFamily')
        })
        vi.mocked(mockAuditLog.log).mockImplementation(async () => {
          callOrder.push('auditLog')
        })

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow()

        expect(callOrder).toEqual(['revokeFamily', 'auditLog'])
      })

      it('should not generate new tokens when replay attack is detected', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockRecord = createMockTokenRecord({ isRevoked: true })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow()

        expect(mockUserRepo.findById).not.toHaveBeenCalled()
        expect(mockTokenGenerator.generateToken).not.toHaveBeenCalled()
        expect(mockRefreshTokenRepo.create).not.toHaveBeenCalled()
      })
    })

    describe('expired token', () => {
      it('should throw UnauthorizedException if token is expired', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockRecord = createMockTokenRecord({ isExpired: true })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow(UnauthorizedException)
        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow(
          'Refresh token expired'
        )
      })

      it('should not revoke token family when token is expired', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockRecord = createMockTokenRecord({ isExpired: true })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow()

        expect(mockRefreshTokenRepo.revokeFamily).not.toHaveBeenCalled()
      })

      it('should not generate new tokens when token is expired', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockRecord = createMockTokenRecord({ isExpired: true })

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow()

        expect(mockUserRepo.findById).not.toHaveBeenCalled()
        expect(mockTokenGenerator.generateToken).not.toHaveBeenCalled()
        expect(mockRefreshTokenRepo.create).not.toHaveBeenCalled()
      })
    })

    describe('user not found', () => {
      it('should throw UnauthorizedException if user not found', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockRecord = createMockTokenRecord()

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(null)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow(UnauthorizedException)
        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow('User not found')
      })

      it('should revoke token before checking if user exists', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const tokenHash = mockToken.getHash()
        const mockRecord = createMockTokenRecord({ tokenHash })
        const callOrder: string[] = []

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockRefreshTokenRepo.revokeByHash).mockImplementation(async () => {
          callOrder.push('revokeByHash')
        })
        vi.mocked(mockUserRepo.findById).mockImplementation(async () => {
          callOrder.push('findById')
          return null
        })

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow()

        expect(callOrder).toEqual(['revokeByHash', 'findById'])
      })
    })

    describe('invalid token format', () => {
      it('should throw ValidationException for invalid token format', async () => {
        const invalidToken = 'not-a-valid-token'

        await expect(useCase.execute(invalidToken, auditContext)).rejects.toThrow()
      })

      it('should throw ValidationException for token with wrong length', async () => {
        const shortToken = 'a'.repeat(32)

        await expect(useCase.execute(shortToken, auditContext)).rejects.toThrow()
      })

      it('should throw ValidationException for token with non-hex characters', async () => {
        const invalidToken = 'g'.repeat(64)

        await expect(useCase.execute(invalidToken, auditContext)).rejects.toThrow()
      })
    })

    describe('audit context handling', () => {
      it('should handle missing user agent in audit context', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockUser = await createMockUser()
        const mockRecord = createMockTokenRecord({ userId: mockUser.id as UserIdType })
        const contextWithoutUserAgent: AuditContext = {
          userId: null,
          ipAddress: '192.168.1.1',
          userAgent: null,
        }

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)

        await useCase.execute(rawToken, contextWithoutUserAgent)

        const createCall = vi.mocked(mockRefreshTokenRepo.create).mock.calls[0][0]
        expect(createCall.userAgent).toBeUndefined()
      })

      it('should handle missing IP address in audit context', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockUser = await createMockUser()
        const mockRecord = createMockTokenRecord({ userId: mockUser.id as UserIdType })
        const contextWithoutIp: AuditContext = {
          userId: null,
          ipAddress: null,
          userAgent: 'test-agent',
        }

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)

        await useCase.execute(rawToken, contextWithoutIp)

        const createCall = vi.mocked(mockRefreshTokenRepo.create).mock.calls[0][0]
        expect(createCall.ipAddress).toBeUndefined()
      })
    })

    describe('error handling', () => {
      it('should log and rethrow repository errors', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const dbError = new Error('Database connection failed')

        vi.mocked(mockRefreshTokenRepo.findByHash).mockRejectedValue(dbError)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow(
          'Database connection failed'
        )
        expect(mockLogger.error).toHaveBeenCalledWith('Failed to refresh access token', dbError, {
          tokenHash: mockToken.getHash(),
        })
      })

      it('should log and rethrow user repository errors', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockRecord = createMockTokenRecord()
        const userError = new Error('User service unavailable')

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockRejectedValue(userError)

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow(
          'User service unavailable'
        )
      })

      it('should log and rethrow token generator errors', async () => {
        const mockToken = RefreshToken.generate()
        const rawToken = mockToken.getRawToken()
        const mockUser = await createMockUser()
        const mockRecord = createMockTokenRecord({ userId: mockUser.id as UserIdType })
        const tokenError = new Error('Token generation failed')

        vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValue(mockRecord)
        vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)
        vi.mocked(mockTokenGenerator.generateToken).mockImplementation(() => {
          throw tokenError
        })

        await expect(useCase.execute(rawToken, auditContext)).rejects.toThrow(
          'Token generation failed'
        )
      })
    })
  })
})
