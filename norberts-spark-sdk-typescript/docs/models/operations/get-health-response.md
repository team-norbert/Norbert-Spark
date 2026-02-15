# GetHealthResponse

Service is healthy

## Example Usage

```typescript
import { GetHealthResponse } from 'norberts-spark-sdk/models/operations'

let value: GetHealthResponse = {
  status: 'ok',
  timestamp: new Date('2035-01-01T00:00:00.000Z'),
}
```

## Fields

| Field       | Type                                                                                          | Required           | Description | Example                  |
| ----------- | --------------------------------------------------------------------------------------------- | ------------------ | ----------- | ------------------------ |
| `status`    | [operations.Status](../../models/operations/status.md)                                        | :heavy_check_mark: | N/A         | ok                       |
| `timestamp` | [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | :heavy_check_mark: | N/A         | 2035-01-01T00:00:00.000Z |
