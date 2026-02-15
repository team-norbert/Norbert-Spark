# PaginatedUsersResponse

Paginated response for users list

## Example Usage

```typescript
import { PaginatedUsersResponse } from 'norberts-spark-sdk/models'

let value: PaginatedUsersResponse = {
  success: true,
  data: [
    {
      id: '01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a',
      email: 'john.doe@example.com',
      name: 'John Doe',
      role: 'user',
      createdAt: new Date('2035-01-01T00:00:00.000Z'),
    },
  ],
  pagination: {
    offset: 0,
    limit: 10,
    total: 42,
  },
}
```

## Fields

| Field        | Type                                         | Required           | Description | Example |
| ------------ | -------------------------------------------- | ------------------ | ----------- | ------- |
| `success`    | _boolean_                                    | :heavy_check_mark: | N/A         | true    |
| `data`       | [models.User](../models/user.md)[]           | :heavy_check_mark: | N/A         |         |
| `pagination` | [models.Pagination](../models/pagination.md) | :heavy_check_mark: | N/A         |         |
