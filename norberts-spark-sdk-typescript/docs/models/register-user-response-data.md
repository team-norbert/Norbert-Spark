# RegisterUserResponseData

Registration result data

## Example Usage

```typescript
import { RegisterUserResponseData } from 'norberts-spark-sdk/models'

let value: RegisterUserResponseData = {
  userId: '01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  tokenType: 'Bearer',
  expiresIn: 3600,
}
```

## Fields

| Field         | Type     | Required           | Description                       | Example                                 |
| ------------- | -------- | ------------------ | --------------------------------- | --------------------------------------- |
| `userId`      | _string_ | :heavy_check_mark: | N/A                               | 01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a    |
| `accessToken` | _string_ | :heavy_check_mark: | JWT access token                  | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| `tokenType`   | _string_ | :heavy_minus_sign: | Type of the token                 | Bearer                                  |
| `expiresIn`   | _number_ | :heavy_minus_sign: | How long the user token lasts for | 3600                                    |
