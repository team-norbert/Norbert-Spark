# RegisterUserRequest

Request payload for registering a new user

## Example Usage

```typescript
import { RegisterUserRequest } from "norberts-spark-sdk/models";

let value: RegisterUserRequest = {
  email: "john.doe@example.com",
  password: "SecurePass123!",
  name: "John Doe",
};
```

## Fields

| Field                                   | Type                                    | Required                                | Description                             | Example                                 |
| --------------------------------------- | --------------------------------------- | --------------------------------------- | --------------------------------------- | --------------------------------------- |
| `email`                                 | *string*                                | :heavy_check_mark:                      | User's email address                    | john.doe@example.com                    |
| `password`                              | *string*                                | :heavy_check_mark:                      | User's password (minimum 12 characters) | SecurePass123!                          |
| `name`                                  | *string*                                | :heavy_check_mark:                      | User's full name                        | John Doe                                |