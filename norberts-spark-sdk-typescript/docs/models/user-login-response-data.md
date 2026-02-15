# UserLoginResponseData

Authentication result data

## Example Usage

```typescript
import { UserLoginResponseData } from "norberts-spark-sdk/models";

let value: UserLoginResponseData = {
  userId: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
  email: "john.doe@example.com",
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  roles: [
    "user",
  ],
};
```

## Fields

| Field                                                                   | Type                                                                    | Required                                                                | Description                                                             | Example                                                                 |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `userId`                                                                | *string*                                                                | :heavy_check_mark:                                                      | The authenticated user's unique identifier                              | 01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a                                    |
| `email`                                                                 | *string*                                                                | :heavy_check_mark:                                                      | The authenticated user's email address                                  | john.doe@example.com                                                    |
| `accessToken`                                                           | *string*                                                                | :heavy_check_mark:                                                      | JWT access token for authenticated requests                             | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...                                 |
| `roles`                                                                 | [models.UserLoginResponseRole](../models/user-login-response-role.md)[] | :heavy_check_mark:                                                      | User's assigned roles                                                   | [<br/>"user"<br/>]                                                      |