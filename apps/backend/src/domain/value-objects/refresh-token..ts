import crypto from 'node:crypto'

import { ValidationException } from '../../shared/exceptions/validation.exception.js'

/**
 * RefreshToken value object
 *
 * Represents an opaque refresh token for authentication.
 * The raw token is sent to the client, but only the SHA-256 hash is stored in the database.
 *
 * Security:
 * - Raw tokens are 32 bytes (64 hex characters) of cryptographically random data
 * - Only the SHA-256 hash is persisted to the database
 * - If the database is compromised, hashes cannot be used to impersonate users
 */
export class RefreshToken {
  private constructor(
    private readonly rawToken: string,
    private readonly hash: string
  ) {}

  /**
   * Generate a new refresh token with cryptographically random data
   *
   * @returns A new RefreshToken instance with raw token and computed hash
   *
   * @example
   * const token = RefreshToken.generate()
   * await db.insert({ tokenHash: token.getHash() })
   * res.json({ refreshToken: token.getRawToken() })
   */
  static generate(): RefreshToken {
    const raw = crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHash('sha256').update(raw).digest('hex')
    return new RefreshToken(raw, hash)
  }

  /**
   * Recreate a RefreshToken from an existing raw token string (e.g., from client request)
   *
   * Validates the token format and computes its hash for database lookup.
   *
   * @param raw - The raw token string (64 hex characters)
   * @returns A RefreshToken instance with the provided raw token and computed hash
   * @throws {ValidationException} If the token format is invalid
   *
   * @example
   * const rawToken = req.body.refreshToken
   * const token = RefreshToken.fromRaw(rawToken)
   * const dbRecord = await db.findByHash(token.getHash())
   */
  static fromRaw(raw: string): RefreshToken {
    // Validate format: must be exactly 64 hexadecimal characters
    if (typeof raw !== 'string') {
      throw new ValidationException('Refresh token must be a string')
    }

    if (raw.length !== 64) {
      throw new ValidationException('Refresh token must be 64 characters')
    }

    if (!/^[0-9a-f]{64}$/i.test(raw)) {
      throw new ValidationException('Refresh token must contain only hexadecimal characters')
    }

    // Compute hash
    const hash = crypto.createHash('sha256').update(raw).digest('hex')

    return new RefreshToken(raw, hash)
  }

  /**
   * Get the raw token string
   *
   * WARNING: Only expose this at token creation time to send to the client.
   * Never store the raw token in the database or logs.
   *
   * @returns The raw token (64 hex characters)
   */
  getRawToken(): string {
    return this.rawToken
  }

  /**
   * Get the SHA-256 hash of the token
   *
   * This is what should be stored in the database for secure token validation.
   *
   * @returns The SHA-256 hash (64 hex characters)
   */
  getHash(): string {
    return this.hash
  }
}
