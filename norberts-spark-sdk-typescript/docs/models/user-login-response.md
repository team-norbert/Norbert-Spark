# UserLoginResponse

Response returned after successful user authentication

## Example Usage

```typescript
import { UserLoginResponse } from "norberts-spark-sdk/models";

let value: UserLoginResponse = {
  success: true,
  data: {
    userId: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    email: "john.doe@example.com",
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    roles: [
      "user",
    ],
  },
};
```

## Fields

| Field                                                                 | Type                                                                  | Required                                                              | Description                                                           | Example                                                               |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `success`                                                             | *boolean*                                                             | :heavy_check_mark:                                                    | N/A                                                                   | true                                                                  |
| `data`                                                                | [models.UserLoginResponseData](../models/user-login-response-data.md) | :heavy_check_mark:                                                    | Authentication result data                                            |                                                                       |