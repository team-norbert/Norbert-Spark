# AIRequestMessage

## Example Usage

```typescript
import { AIRequestMessage } from "norberts-spark-sdk/models";

let value: AIRequestMessage = {
  id: "Z9HbJCTLArucKCzf",
  role: "assistant",
  parts: [
    {
      type: "step-start",
    },
  ],
};
```

## Fields

| Field                                                | Type                                                 | Required                                             | Description                                          | Example                                              |
| ---------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| `id`                                                 | *string*                                             | :heavy_check_mark:                                   | N/A                                                  | Z9HbJCTLArucKCzf                                     |
| `role`                                               | [models.AIRequestRole](../models/ai-request-role.md) | :heavy_check_mark:                                   | N/A                                                  |                                                      |
| `parts`                                              | [models.Part](../models/part.md)[]                   | :heavy_check_mark:                                   | N/A                                                  |                                                      |