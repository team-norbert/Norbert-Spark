# OAuthSyncResponse

Response returned after successful OAuth user synchronization

## Example Usage

```typescript
import { OAuthSyncResponse } from 'norberts-spark-sdk/models'

let value: OAuthSyncResponse = {
  success: true,
  message: 'OAuth user sync completed',
}
```

## Fields

| Field     | Type      | Required           | Description                                   | Example                   |
| --------- | --------- | ------------------ | --------------------------------------------- | ------------------------- |
| `success` | _boolean_ | :heavy_check_mark: | N/A                                           | true                      |
| `message` | _string_  | :heavy_check_mark: | Success message confirming the sync operation | OAuth user sync completed |
