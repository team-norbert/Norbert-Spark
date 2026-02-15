# Status

## Example Usage

```typescript
import { Status } from 'norberts-spark-sdk/models/operations'

let value: Status = 'ok'
```

## Values

This is an open enum. Unrecognized values will be captured as the `Unrecognized<string>` branded type.

```typescript
;'ok' | 'degraded' | 'down' | Unrecognized<string>
```
