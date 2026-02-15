# User

User profile information

## Example Usage

```typescript
import { User } from 'norberts-spark-sdk/models'

let value: User = {
  id: '01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a',
  email: 'john.doe@example.com',
  name: 'John Doe',
  role: 'user',
  createdAt: new Date('2035-01-01T00:00:00.000Z'),
}
```

## Fields

| Field       | Type                                                                                          | Required           | Description               | Example                              |
| ----------- | --------------------------------------------------------------------------------------------- | ------------------ | ------------------------- | ------------------------------------ |
| `id`        | _string_                                                                                      | :heavy_check_mark: | N/A                       | 01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a |
| `email`     | _string_                                                                                      | :heavy_check_mark: | N/A                       | john.doe@example.com                 |
| `name`      | _string_                                                                                      | :heavy_check_mark: | N/A                       | John Doe                             |
| `role`      | [models.UserRole](../models/user-role.md)                                                     | :heavy_check_mark: | User's role in the system | user                                 |
| `createdAt` | [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | :heavy_check_mark: | N/A                       | 2035-01-01T00:00:00.000Z             |
