/*
Represents a stored refresh token row: `id`, `userId`, `tokenHash`,
`tokenFamily`, `expiresAt`, `revokedAt`, `createdAt`, `lastUsedAt`.

Methods:

- `isExpired(): boolean`
- `isRevoked(): boolean`
- `isValid(): boolean` (not expired AND not revoked)
- `revoke(): void` (sets `revokedAt`)
 */
import type { UserIdType } from '../value-objects/userID.js'
import type { UUIDType } from '../value-objects/uuid.js'

/**
 *   id UUID PRIMARY KEY DEFAULT uuidv7(),
 *
 *     user_id UUID NOT NULL
 *     REFERENCES "users"(user_id) ON DELETE CASCADE,
 *
 *     token_hash TEXT NOT NULL UNIQUE,
 *     token_family UUID NOT NULL,
 *
 *     expires_at TIMESTAMPTZ NOT NULL,
 *     revoked_at TIMESTAMPTZ,
 *
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 *     last_used_at TIMESTAMPTZ,
 *
 *     ip_address INET,
 *     user_agent TEXT
 */

export class RefreshTokenRecord {
  constructor(
    private readonly id: UUIDType,
    private readonly userId: UserIdType,
    private readonly tokenHash: string,
    private readonly tokenFamily: UUIDType,
    private readonly expiresAt: Date,
    private revokedAt: Date | null = null,
    private readonly createdAt: Date = new Date(),
    private readonly lastUsedAt: Date
  ) {}

  public isExpired(): boolean {
    return new Date() > this.expiresAt
  }

  public isRevoked(): boolean {
    return this.revokedAt !== null
  }

  public isValid(): boolean {
    return !this.isExpired() && !this.isRevoked()
  }

  public revoke(): void {
    this.revokedAt = new Date()
  }
}
