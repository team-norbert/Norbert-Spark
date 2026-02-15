# RegisterUserResponse

Response returned after successful user registration

## Example Usage

```typescript
import { RegisterUserResponse } from 'norberts-spark-sdk/models'

let value: RegisterUserResponse = {
  success: true,
  data: {
    userId: '01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a',
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    tokenType: 'Bearer',
    expiresIn: 3600,
  },
}
```

## Fields

| Field     | Type                                                                        | Required           | Description              | Example |
| --------- | --------------------------------------------------------------------------- | ------------------ | ------------------------ | ------- |
| `success` | _boolean_                                                                   | :heavy_check_mark: | N/A                      | true    |
| `data`    | [models.RegisterUserResponseData](../models/register-user-response-data.md) | :heavy_check_mark: | Registration result data |         |
