# OAuthSyncRequest

Request payload for OAuth user synchronization

## Example Usage

```typescript
import { OAuthSyncRequest } from 'norberts-spark-sdk/models'

let value: OAuthSyncRequest = {
  provider: 'google',
  providerId: '1234567890',
  email: 'user@example.com',
  name: 'John Doe',
}
```

## Fields

| Field        | Type     | Required           | Description                                        | Example          |
| ------------ | -------- | ------------------ | -------------------------------------------------- | ---------------- |
| `provider`   | _string_ | :heavy_check_mark: | OAuth provider name (e.g., 'google', 'github')     | google           |
| `providerId` | _string_ | :heavy_check_mark: | User ID from OAuth provider                        | 1234567890       |
| `email`      | _string_ | :heavy_check_mark: | User's email address from OAuth provider           | user@example.com |
| `name`       | _string_ | :heavy_minus_sign: | User's display name from OAuth provider (optional) | John Doe         |
