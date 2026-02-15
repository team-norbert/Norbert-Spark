# CompanyDetailsResponseStatus

Current status of the company

## Example Usage

```typescript
import { CompanyDetailsResponseStatus } from "norberts-spark-sdk/models";

let value: CompanyDetailsResponseStatus = "active";
```

## Values

This is an open enum. Unrecognized values will be captured as the `Unrecognized<string>` branded type.

```typescript
"prospect" | "active" | "paused" | "churned" | Unrecognized<string>
```