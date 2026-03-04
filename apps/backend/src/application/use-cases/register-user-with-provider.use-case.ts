import { uuidv7 } from 'uuidv7'

import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import { User } from '../../domain/entities/user.js'
import { Email } from '../../domain/value-objects/email.js'
import { RefreshToken } from '../../domain/value-objects/refreshToken.js'
import { Role } from '../../domain/value-objects/role.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import { Uuid } from '../../domain/value-objects/uuid.js'
import { EnvConfig } from '../../infrastructure/config/env.config.js'
import { ConflictException } from '../../shared/exceptions/conflict.exception.js'
import { InternalErrorException } from '../../shared/exceptions/internal-error.exception.js'
import { DatabaseUtil } from '../../shared/utils/database.util.js'
import { RegisterUserDto } from '../dtos/register-user.dto.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { EmailServicePort } from '../ports/email.service.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import type { RefreshTokenRepositoryPort } from '../ports/refresh-token.repository.port.js'
import type { TokenGeneratorPort } from '../ports/token-generator.port.js'
import type { UserRepositoryPort } from '../ports/user.repository.port.js'

/**
 * Use case for registering a new user via OAuth provider (e.g., Google)
 *
 * This use case handles the complete OAuth user registration process including:
 * - Creating domain entities from DTO
 * - Validating email format through value objects
 * - Persisting user to repository with duplicate email detection
 * - Sending welcome email (non-blocking)
 * - Generating JWT access token
 *
 * Note: This use case does not handle password-based registration. OAuth users
 * authenticate through their provider and do not have passwords stored in our system.
 *
 * @class RegisterUserWithProviderUseCase
 * @example
 * ```typescript
 * const useCase = new RegisterUserWithProviderUseCase(
 *   userRepository,
 *   emailService,
 *   logger,
 *   tokenGenerator,
 *   auditLog,
 *   refreshTokenRepo
 * )
 * const result = await useCase.execute({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   role: 'member',
 *   provider: 'google'
 * }, auditContext)
 * ```
 */
export class RegisterUserWithProviderUseCase {
  /**
   * Creates an instance of RegisterUserWithProviderUseCase
   * @param {UserRepositoryPort} userRepository - Repository for persisting user data
   * @param {EmailServicePort} emailService - Service for sending welcome emails
   * @param {LoggerPort} logger - Logger for tracking operations
   * @param {TokenGeneratorPort} tokenGenerator - Service for generating JWT tokens
   * @param {AuditLogPort} auditLog - Audit logging service for recording user registration events
   * @param refreshTokenRepo - Repository for managing refresh tokens
   */
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly logger: LoggerPort,
    private readonly tokenGenerator: TokenGeneratorPort,
    private readonly auditLog: AuditLogPort,
    private readonly refreshTokenRepo: RefreshTokenRepositoryPort
  ) {}

  /**
   * Executes the OAuth user registration use case
   *
   * Creates a new user account for OAuth provider authentication. The process includes:
   * 1. Validating email format through value objects
   * 2. Creating user entity with provider information (no password)
   * 3. Saving the user to the database (with duplicate email detection)
   * 4. Sending a welcome email (failure doesn't block registration)
   * 5. Generating a JWT access token for immediate login
   * 6. Recording an audit log entry for the registration event
   *
   * @param {RegisterUserDto} dto - User registration data (email, name, role, provider)
   * @param auditContext
   * @returns {Promise<{ userId: UserIdType, email: string, accessToken: string, refreshToken: string, expiresInSeconds: number, roles: string[] }>}
   *          Registration result with user ID, authentication tokens and roles
   * @throws {ConflictException} If a user with the same email already exists
   * @throws {Error} If email validation, database operation, or token generation fails.
   *                 Note: Email service failures are logged but do not throw errors or prevent registration.
   * @example
   * ```typescript
   * try {
   *   const result = await useCase.execute({
   *     email: 'newuser@example.com',
   *     name: 'Jane Smith',
   *     role: 'member',
   *     provider: 'google'
   *   })
   *   console.log(`User ${result.userId} registered successfully`)
   * } catch (error) {
   *   if (error instanceof ConflictException) {
   *     console.error('Email already in use')
   *   }
   * }
   * ```
   */
  async execute(
    dto: RegisterUserDto,
    auditContext: AuditContext
  ): Promise<{
    userId: UserIdType
    email: string
    accessToken: string
    refreshToken: string
    expiresInSeconds: number
    roles: string[]
  }> {
    this.logger.info('Starting user registration', { email: dto.email })

    // Create domain objects
    const email = new Email(dto.email).getValue()
    const role = new Role(dto.role)

    // Create user entity without ID - PostgreSQL will generate UUIDv7 via uuidv7() function
    const user = new User(
      undefined,
      email,
      dto.name,
      role,
      undefined,
      new Date(),
      new Date(),
      dto.provider,
      dto.providerId
    )

    // Persist user with OAuth provider handling
    // The saveProvider method handles three scenarios:
    // 1. Existing OAuth user with same provider - returns existing userId, isNewUser: false
    // 2. Email exists with password (non-OAuth) - throws ConflictException
    // 3. New user - creates new record, returns new userId, isNewUser: true
    let userId: UserIdType
    let isNewUser: boolean
    try {
      const result = await this.userRepository.saveProvider(user)
      userId = result.userId
      isNewUser = result.isNewUser
    } catch (error) {
      this.logger.error('Failed to save user', error as Error, { email: dto.email })
      if (DatabaseUtil.isDuplicateKeyError(error)) {
        // For failed registration: entityId = email (no user entity created yet)
        const auditEntry: CreateAuditLogDTO = {
          userId: auditContext.userId,
          entityType: EntityType.USER,
          entityId: String(email),
          action: AuditAction.REGISTRATION_FAILED,
          changes: { reason: 'duplicate_email' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        }
        // AuditLogPort.log() never throws per contract
        await this.auditLog.log(auditEntry)
        throw new ConflictException('User with this email already exists', { email: dto.email })
      }
      throw error
    }

    // Only log audit for new user registrations, not returning users
    if (isNewUser) {
      const auditEntry: CreateAuditLogDTO = {
        userId: userId,
        entityType: EntityType.USER,
        entityId: userId,
        action: AuditAction.CREATE,
        changes: { reason: 'new_user' },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)
    }

    // Send welcome email only for new users
    if (isNewUser) {
      try {
        await this.emailService.sendWelcomeEmail(dto.email, dto.name)
      } catch (error) {
        this.logger.error('Failed to send welcome email', error as Error, {
          userId: userId,
          email: dto.email,
        })
        // Don't fail registration if email fails
      }
    }

    this.logger.info(isNewUser ? 'User registered successfully' : 'Returning user signed in', {
      userId: userId,
    })

    // Generate JWT access token
    const accessToken = this.tokenGenerator.generateToken({
      sub: userId,
      email: dto.email,
      roles: [dto.role],
    })

    const newRefreshToken = RefreshToken.generate()
    const tokenFamily = uuidv7() // New token family for this rotation chain

    // Calculate expiration date
    const parsedExpiration = Number.parseInt(EnvConfig.REFRESH_TOKEN_EXPIRATION, 10)
    const expiresInSeconds = Number.isNaN(parsedExpiration)
      ? 7 * 24 * 60 * 60 // default 7 days in seconds
      : parsedExpiration
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

    try {
      // Store the refresh token in the database
      await this.refreshTokenRepo.create({
        userId: userId,
        tokenHash: newRefreshToken.getHash(),
        tokenFamily: new Uuid(tokenFamily).getValue(),
        expiresAt: expiresAt,
        ipAddress: auditContext.ipAddress ?? undefined,
        userAgent: auditContext.userAgent ?? undefined,
      })
    } catch (err) {
      this.logger.error(
        'Failed to store refresh token',
        err instanceof Error ? err : new Error(String(err)),
        {
          userId,
          email: user.getEmail(),
        }
      )
      const auditEntry: CreateAuditLogDTO = {
        userId: userId,
        entityType: EntityType.USER,
        entityId: userId,
        action: AuditAction.TOKEN_ISSUED,
        changes: {
          reason: 'refresh_token_storage_failed',
        },
        ipAddress: auditContext.ipAddress ?? undefined,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)
      throw new InternalErrorException('Failed to store refresh token')
    } finally {
      const auditEntry: CreateAuditLogDTO = {
        userId: userId,
        entityType: EntityType.USER,
        entityId: userId,
        action: AuditAction.TOKEN_ISSUED,
        changes: {
          reason: 'refresh_token_stored',
        },
        ipAddress: auditContext.ipAddress ?? undefined,
        userAgent: auditContext.userAgent ?? undefined,
      }
      // AuditLogPort.log() never throws per contract
      await this.auditLog.log(auditEntry)
    }

    return {
      userId: userId,
      email: user.getEmail(),
      accessToken: accessToken,
      refreshToken: newRefreshToken.getRawToken(),
      expiresInSeconds, // refresh token expiration in seconds
      roles: [user.getRole()],
    }
  }
}
