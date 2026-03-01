/*
Represents a stored refresh token row: `id`, `userId`, `tokenHash`, `tokenFamily`, `expiresAt`, `revokedAt`, `createdAt`, `lastUsedAt`.

Methods:

- `isExpired(): boolean`
- `isRevoked(): boolean`
- `isValid(): boolean` (not expired AND not revoked)
- `revoke(): void` (sets `revokedAt`)
 */
import type { UserIdType } from '../value-objects/userID.js'
import type { UUIDType } from '../value-objects/uuid.js'

export class RefreshTokenRecord {
  constructor(
    private readonly id: UUIDType,
    private readonly userId: UserIdType
  ) {}
}
