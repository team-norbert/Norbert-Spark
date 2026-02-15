# Pagination

## Example Usage

```typescript
import { Pagination } from 'norberts-spark-sdk/models'

let value: Pagination = {
  offset: 0,
  limit: 10,
  total: 42,
}
```

## Fields

| Field    | Type     | Required           | Description              | Example |
| -------- | -------- | ------------------ | ------------------------ | ------- |
| `offset` | _number_ | :heavy_check_mark: | Number of items to skip  | 0       |
| `limit`  | _number_ | :heavy_check_mark: | Number of items per page | 10      |
| `total`  | _number_ | :heavy_check_mark: | Total number of users    | 42      |
