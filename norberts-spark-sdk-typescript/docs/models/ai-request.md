# AIRequest

AI-generated response object

## Example Usage

```typescript
import { AIRequest } from 'norberts-spark-sdk/models'

let value: AIRequest = {
  id: '01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a',
  messages: [],
  trigger: 'submit-message',
}
```

## Fields

| Field      | Type                                                         | Required           | Description                                                                                                                                                                 | Example                              |
| ---------- | ------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `id`       | _string_                                                     | :heavy_check_mark: | N/A                                                                                                                                                                         | 01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a |
| `messages` | [models.AIRequestMessage](../models/ai-request-message.md)[] | :heavy_check_mark: | N/A                                                                                                                                                                         |                                      |
| `trigger`  | _string_                                                     | :heavy_check_mark: | Indicates which user or system action caused this AI response to be generated. Implementations should use consistent, machine-readable identifiers (e.g. "submit-message"). | submit-message                       |
