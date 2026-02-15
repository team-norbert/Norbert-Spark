# UserLoginRequest

Request payload for user authentication

## Example Usage

```typescript
import { UserLoginRequest } from "norberts-spark-sdk/models";

let value: UserLoginRequest = {
  email: "john.doe@example.com",
  password: "SecurePass123!",
};
```

## Fields

| Field                | Type                 | Required             | Description          | Example              |
| -------------------- | -------------------- | -------------------- | -------------------- | -------------------- |
| `email`              | *string*             | :heavy_check_mark:   | User's email address | john.doe@example.com |
| `password`           | *string*             | :heavy_check_mark:   | User's password      | SecurePass123!       |