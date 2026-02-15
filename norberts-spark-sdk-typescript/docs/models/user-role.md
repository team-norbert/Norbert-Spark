# UserRole

User's role in the system

## Example Usage

```typescript
import { UserRole } from "norberts-spark-sdk/models";

let value: UserRole = "user";
```

## Values

This is an open enum. Unrecognized values will be captured as the `Unrecognized<string>` branded type.

```typescript
"user" | "admin" | "moderator" | Unrecognized<string>
```