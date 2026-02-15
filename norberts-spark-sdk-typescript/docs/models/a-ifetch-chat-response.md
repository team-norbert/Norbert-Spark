# AIfetchChatResponse

Response returned when fetching a chat

## Example Usage

```typescript
import { AIfetchChatResponse } from "norberts-spark-sdk/models";

let value: AIfetchChatResponse = {
  success: true,
  data: {
    id: "019b659a-2ad2-7fd8-9f32-35624caef900",
  },
};
```

## Fields

| Field                                                                      | Type                                                                       | Required                                                                   | Description                                                                | Example                                                                    |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `success`                                                                  | *boolean*                                                                  | :heavy_check_mark:                                                         | N/A                                                                        | true                                                                       |
| `data`                                                                     | [models.AIfetchChatResponseData](../models/a-ifetch-chat-response-data.md) | :heavy_check_mark:                                                         | N/A                                                                        |                                                                            |