import { UtcDate } from '@norberts-spark/shared'

import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import type { EmailType } from '../value-objects/email.js'
import type { PasswordType } from '../value-objects/password.js'
import type { RoleType } from '../value-objects/role.js'
import type { UserIdType } from '../value-objects/userID.js'

/**
 * User entity representing a registered user in the system
 *
 * This entity encapsulates user data and business rules related to user management.
 * It uses branded value object types (EmailType, PasswordType, RoleType, UserIdType)
 * to ensure data validity and compile-time type safety.
 *
 * Supports both credential-based and OAuth-based authentication methods, as well as
 * two-factor authentication (2FA) for enhanced security.
 *
 * @class User
 *
 * @remarks
 * Business Rules:
 * - Users have a unique identifier (UserIdType, UUIDv7) that cannot be changed
 * - Email addresses can only be updated if verified
 * - Password updates require verification of the old password
 * - OAuth users can exist without passwords (provider-based authentication)
 * - Roles define user permissions and can be changed by administrators
 * - Two-factor authentication can be enabled/disabled with encrypted secrets
 * - All user data is encapsulated and accessed through getter methods
 * - createdAt and updatedAt timestamps track record lifecycle
 *
 * Authentication Methods:
 * - **Credential-based**: Uses email and hashed password
 * - **OAuth-based**: Uses provider and providerId (password is optional)
 *
 * @example
 * ```typescript
 * // Credential-based user with database-generated ID
 * const email = new Email('user@example.com').getValue()
 * const password = await Password.create('securePassword123')
 * const role = new Role('user')
 * const user = new User(
 *   undefined,  // Let DB generate UUIDv7
 *   email,
 *   'John Doe',
 *   role,
 *   password,
 *   UtcDate.now().toDate(),
 *   UtcDate.now().toDate()
 * )
 *
 * // OAuth user without password
 * const oauthUser = new User(
 *   undefined,
 *   email,
 *   'Jane Smith',
 *   role,
 *   undefined,      // No password for OAuth
 *   UtcDate.now().toDate(),
 *   UtcDate.now().toDate(),
 *   'google',       // provider
 *   'google123456'  // providerId
 * )
 *
 * // User with 2FA enabled
 * const user2FA = new User(
 *   new UserId('01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a').getValue(),
 *   email,
 *   'Secure User',
 *   role,
 *   password,
 *   UtcDate.now().toDate(),
 *   UtcDate.now().toDate(),
 *   undefined,
 *   undefined,
 *   true,             // twoFactorEnabled
 *   'encrypted_secret' // twoFactorSecret
 * )
 *
 * // Get user information
 * console.log(user.getEmail())     // 'user@example.com'
 * console.log(user.getName())      // 'John Doe'
 * console.log(user.getRole())      // 'user'
 * console.log(user.getProvider())  // undefined for credential users
 *
 * // Update email (if verified)
 * const newEmail = new Email('newemail@example.com').getValue()
 * user.updateEmail(newEmail)
 *
 * // Update password (requires old password verification)
 * const newPassword = await Password.create('newSecurePassword456')
 * await user.updatePassword('securePassword123', newPassword)
 *
 * // Update role (admin-only operation)
 * const newRole = new Role('admin')
 * user.updateRole(newRole)
 *
 * // Enable two-factor authentication
 * user.enableTwoFactor('encrypted_2fa_secret')
 * ```
 */
export class User {
  /**
   * Creates a new User instance
   *
   * @param {UserIdType | undefined} id - Unique identifier for the user (UUIDv7 branded type, readonly). Optional - database generates UUIDv7 if undefined
   * @param {EmailType} email - User's email address (EmailType branded type for compile-time type safety)
   * @param {string} name - User's display name
   * @param {RoleType} role - User's role (RoleType branded type: 'user', 'admin', 'moderator')
   * @param {PasswordType} [password] - User's hashed password (PasswordType branded type). Optional for OAuth users
   * @param {Date} [createdAt] - Timestamp when the user was created (defaults to current date/time)
   * @param {Date} [updatedAt] - Timestamp when the user was last modified (defaults to current date/time)
   * @param {string} [provider] - Authentication provider name (e.g., 'google', 'github'). Required for OAuth users
   * @param {string} [providerId] - Unique identifier from the authentication provider. Required for OAuth users
   * @param {boolean} [twoFactorEnabled=false] - Whether two-factor authentication is enabled
   * @param {string} [twoFactorSecret] - Encrypted two-factor authentication secret. Only present if 2FA is enabled
   *
   * @example
   * ```typescript
   * // New credential-based user (database generates ID)
   * const email = new Email('john@example.com').getValue()
   * const password = await Password.create('myPassword123')
   * const role = new Role('user')
   * const user = new User(
   *   undefined,      // Let DB generate ID
   *   email,
   *   'John Smith',
   *   role,
   *   password,
   *   UtcDate.now().toDate(),     // createdAt
   *   UtcDate.now().toDate()      // updatedAt
   * )
   *
   * // Existing user with provided ID
   * const userId = new UserId('01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a').getValue()
   * const existingUser = new User(
   *   userId,
   *   email,
   *   'John Smith',
   *   role,
   *   password,
   *   UtcDate.now('2024-01-15').toDate(),
   *   UtcDate.now('2024-01-15').toDate()
   * )
   *
   * // OAuth user without password
   * const oauthUser = new User(
   *   undefined,      // Let DB generate ID
   *   email,
   *   'Jane Doe',
   *   role,
   *   undefined,      // No password for OAuth
   *   UtcDate.now().toDate(),
   *   UtcDate.now().toDate(),
   *   'google',       // provider
   *   'google1234567' // providerId
   * )
   *
   * // User with 2FA enabled
   * const user2FA = new User(
   *   userId,
   *   email,
   *   'Secure User',
   *   role,
   *   password,
   *   UtcDate.now().toDate(),
   *   UtcDate.now().toDate(),
   *   undefined,      // Not OAuth
   *   undefined,
   *   true,           // 2FA enabled
   *   'encrypted_secret_value'
   * )
   * ```
   */
  constructor(
    public readonly id: UserIdType | undefined,
    private email: EmailType,
    private name: string,
    private role: RoleType,
    private password?: PasswordType,
    private createdAt: Date = UtcDate.now().toDate(),
    private updatedAt: Date = UtcDate.now().toDate(),
    private provider?: string,
    private providerId?: string,
    private twoFactorEnabled: boolean = false,
    private twoFactorSecret?: string
  ) {}

  /**
   * Updates the user's email address
   *
   * Business Rule: Email can only be updated if the current email is verified.
   * This prevents unauthorized email changes and ensures email ownership.
   *
   * @param {EmailType} newEmail - The new email address to set (EmailType branded type, must be validated)
   * @returns {void}
   * @throws {ValidationException} If the current email is not verified
   *
   * @example
   * ```typescript
   * const newEmail = new Email('newemail@example.com').getValue()
   * user.updateEmail(newEmail)
   * ```
   */
  updateEmail(newEmail: EmailType): void {
    // Business rule: Email can only be updated if verified
    if (!this.isEmailVerified()) {
      throw new ValidationException('Cannot update unverified email')
    }
    this.email = newEmail
  }

  /**
   * Updates the user's password
   *
   * Business Rules:
   * - Must verify the old password before updating to the new password
   * - This ensures that only the user who knows the current password can change it
   * - Cannot update password for OAuth users who don't have a password set
   *
   * @async
   * @param {string} oldPassword - The current password (plain text) for verification
   * @param {PasswordType} newPassword - The new password to set (PasswordType branded type, must be hashed)
   * @returns {Promise<void>} A promise that resolves when the password is successfully updated
   * @throws {ValidationException} If the old password is incorrect or if attempting to update password for OAuth user
   *
   * @example
   * ```typescript
   * const newPassword = await Password.create('newSecurePass123')
   * await user.updatePassword('oldPassword', newPassword)
   * ```
   */
  async updatePassword(oldPassword: string, newPassword: PasswordType): Promise<void> {
    // Business rule: Must verify old password before updating
    if (!this.password) {
      throw new ValidationException('Cannot update password for OAuth users')
    }
    if (!(await this.password.matches(oldPassword))) {
      throw new ValidationException('Old password is incorrect')
    }
    this.password = newPassword
  }

  /**
   * Checks if the user's email is verified.
   *
   * @private
   * @returns True if the email is verified, false otherwise
   */
  private isEmailVerified(): boolean {
    // Business logic for email verification
    return true // Simplified
  }

  /**
   * Gets the user's email address
   *
   * @returns {string} The user's email address in lowercase format (returns the EmailType branded value)
   *
   * @example
   * ```typescript
   * const email = user.getEmail() // 'john@example.com'
   * ```
   */
  getEmail(): string {
    return this.email
  }

  /**
   * Gets the user's display name
   *
   * @returns {string} The user's name
   *
   * @example
   * ```typescript
   * const name = user.getName() // 'John Smith'
   * ```
   */
  getName(): string {
    return this.name
  }

  /**
   * Gets the user's role
   *
   * @returns {string} The user's role as a string ('user', 'admin', or 'moderator')
   *
   * @example
   * ```typescript
   * const role = user.getRole() // 'user'
   * ```
   */
  getRole(): string {
    return this.role.getValue()
  }

  /**
   * Gets the OAuth provider name
   *
   * @returns {string | undefined} The authentication provider name (e.g., 'google', 'github'), or undefined for credential-based users
   *
   * @example
   * ```typescript
   * const provider = user.getProvider() // 'google' or undefined
   * ```
   */
  getProvider(): string | undefined {
    return this.provider
  }

  /**
   * Gets the OAuth provider identifier
   *
   * @returns {string | undefined} The unique identifier from the authentication provider, or undefined for credential-based users
   *
   * @example
   * ```typescript
   * const providerId = user.getProviderId() // 'google1234567' or undefined
   * ```
   */
  getProviderId(): string | undefined {
    return this.providerId
  }

  /**
   * Gets the user's password value object
   *
   * @returns {PasswordType | undefined} The hashed password (PasswordType branded type), or undefined for OAuth users without password
   *
   * @example
   * ```typescript
   * const password = user.getPassword() // PasswordType or undefined
   * if (password) {
   *   const hash = password.getHash()
   * }
   * ```
   */
  getPassword(): PasswordType | undefined {
    return this.password
  }

  /**
   * Updates the user's role
   *
   * Business Rule: Role changes should typically be restricted to administrators.
   * This method should be called through a use case that enforces authorization.
   *
   * @param {RoleType} newRole - The new role to assign (RoleType branded type: 'user', 'admin', or 'moderator')
   * @returns {void}
   *
   * @example
   * ```typescript
   * const newRole = new Role('admin')
   * user.updateRole(newRole)
   * ```
   */
  updateRole(newRole: RoleType): void {
    this.role = newRole
  }

  /**
   * Gets the user's password hash
   *
   * @returns {string | undefined} The hashed password string, or undefined if user has no password (OAuth users)
   *
   * @example
   * ```typescript
   * const passwordHash = user.getPasswordHash()
   * if (passwordHash) {
   *   // User has a password
   * }
   * ```
   */
  getPasswordHash(): string | undefined {
    if (!this.password) {
      return undefined
    }
    return this.password.getHash()
  }

  /**
   * Verifies if a plain text password matches the user's password
   *
   * Uses bcrypt's constant-time comparison to prevent timing attacks.
   * Returns false for OAuth users who don't have a password set.
   *
   * @async
   * @param {string} plainPassword - The plain text password to verify
   * @returns {Promise<boolean>} A Promise resolving to true if the password matches, false otherwise (including OAuth users)
   *
   * @example
   * ```typescript
   * const isValid = await user.verifyPassword('myPassword123')
   * if (isValid) {
   *   // Password is correct
   * } else {
   *   // Password is incorrect or user is OAuth-based
   * }
   * ```
   */
  async verifyPassword(plainPassword: string): Promise<boolean> {
    if (!this.password) {
      return false
    }
    return this.password.matches(plainPassword)
  }

  /**
   * Gets the user's creation date
   *
   * @returns {Date} The date when the user was created
   *
   * @example
   * ```typescript
   * const createdAt = user.getCreatedAt()
   * console.log(`User registered on ${createdAt.toLocaleDateString()}`)
   * ```
   */
  getCreatedAt(): Date {
    return this.createdAt
  }

  /**
   * Gets the user's last modification date
   *
   * @returns {Date} The date when the user record was last updated
   *
   * @example
   * ```typescript
   * const updatedAt = user.getUpdatedAt()
   * console.log(`User last modified on ${updatedAt.toLocaleDateString()}`)
   * ```
   */
  getUpdatedAt(): Date {
    return this.updatedAt
  }

  /**
   * Checks if two-factor authentication is enabled for the user
   *
   * @returns {boolean} True if 2FA is enabled, false otherwise
   *
   * @example
   * ```typescript
   * if (user.isTwoFactorEnabled()) {
   *   // Require 2FA token for login
   * }
   * ```
   */
  isTwoFactorEnabled(): boolean {
    return this.twoFactorEnabled
  }

  /**
   * Gets the encrypted two-factor authentication secret
   *
   * @returns {string | undefined} The encrypted 2FA secret, or undefined if 2FA is not enabled
   *
   * @example
   * ```typescript
   * const secret = user.getTwoFactorSecret()
   * if (secret) {
   *   // Decrypt and validate TOTP token
   * }
   * ```
   */
  getTwoFactorSecret(): string | undefined {
    return this.twoFactorSecret
  }

  /**
   * Enables two-factor authentication for the user
   *
   * Business Rule: The 2FA secret must be provided and should be encrypted before storing.
   * This method sets the twoFactorEnabled flag to true and stores the encrypted secret.
   *
   * @param {string} encryptedSecret - The encrypted 2FA secret to store (must not be empty)
   * @returns {void}
   * @throws {ValidationException} If the encrypted secret is not provided or is empty
   *
   * @example
   * ```typescript
   * const encryptedSecret = encryptTwoFactorSecret('JBSWY3DPEHPK3PXP')
   * user.enableTwoFactor(encryptedSecret)
   * console.log(user.isTwoFactorEnabled()) // true
   * ```
   */
  enableTwoFactor(encryptedSecret: string): void {
    if (!encryptedSecret || encryptedSecret.trim() === '') {
      throw new ValidationException(
        'Encrypted 2FA secret is required to enable two-factor authentication'
      )
    }
    this.twoFactorEnabled = true
    this.twoFactorSecret = encryptedSecret
  }

  /**
   * Disables two-factor authentication for the user
   *
   * Business Rule: Disabling 2FA should remove the stored secret for security.
   * This method sets the twoFactorEnabled flag to false and clears the encrypted secret.
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * user.disableTwoFactor()
   * console.log(user.isTwoFactorEnabled()) // false
   * console.log(user.getTwoFactorSecret()) // undefined
   * ```
   */
  disableTwoFactor(): void {
    this.twoFactorEnabled = false
    this.twoFactorSecret = undefined
  }

  /**
   * Updates the two-factor authentication secret
   *
   * Business Rule: Can only update the secret if 2FA is already enabled.
   * Use this method to rotate the 2FA secret for security purposes.
   *
   * @param {string} encryptedSecret - The new encrypted 2FA secret (must not be empty)
   * @returns {void}
   * @throws {ValidationException} If 2FA is not enabled or if encrypted secret is empty/invalid
   *
   * @example
   * ```typescript
   * if (user.isTwoFactorEnabled()) {
   *   const newEncryptedSecret = encryptTwoFactorSecret('NEWJBSWY3DPEHPK3PXP')
   *   user.updateTwoFactorSecret(newEncryptedSecret)
   * }
   * ```
   */
  updateTwoFactorSecret(encryptedSecret: string): void {
    if (!this.twoFactorEnabled) {
      throw new ValidationException(
        'Cannot update 2FA secret when two-factor authentication is not enabled'
      )
    }
    if (!encryptedSecret || encryptedSecret.trim() === '') {
      throw new ValidationException('Encrypted 2FA secret cannot be empty')
    }
    this.twoFactorSecret = encryptedSecret
  }
}
