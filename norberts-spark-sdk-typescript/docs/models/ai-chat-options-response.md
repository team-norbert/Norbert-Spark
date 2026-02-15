# AIChatOptionsResponse

Response returned when fetching AI chat options

## Example Usage

```typescript
import { AIChatOptionsResponse } from "norberts-spark-sdk/models";

let value: AIChatOptionsResponse = {
  success: true,
  data: [],
};
```

## Fields

| Field                                                                            | Type                                                                             | Required                                                                         | Description                                                                      | Example                                                                          |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `success`                                                                        | *boolean*                                                                        | :heavy_check_mark:                                                               | N/A                                                                              | true                                                                             |
| `data`                                                                           | [models.AIChatOptionsResponseData](../models/ai-chat-options-response-data.md)[] | :heavy_check_mark:                                                               | N/A                                                                              |                                                                                  |