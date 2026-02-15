# AIChatOptionResponse

Response returned when fetching a specific chat AI option configuration

## Example Usage

```typescript
import { AIChatOptionResponse } from "norberts-spark-sdk/models";

let value: AIChatOptionResponse = {
  success: true,
  data: {
    id: "019b659a-2ad2-7fd8-9f32-35624caef900",
    chatTypeId: "019b659a-2ad2-7fd8-9f32-35624caef901",
    prompt: "You are a helpful AI assistant...",
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,
    topK: 40,
    stopSequences: [
      "###",
      "END",
      "\n\n\n",
    ],
    seed: 12345,
    maxRetries: 2,
    createdAt: new Date("2024-01-15T10:30:00Z"),
    updatedAt: new Date("2024-01-15T10:30:00Z"),
  },
};
```

## Fields

| Field                                                                        | Type                                                                         | Required                                                                     | Description                                                                  | Example                                                                      |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `success`                                                                    | *boolean*                                                                    | :heavy_check_mark:                                                           | N/A                                                                          | true                                                                         |
| `data`                                                                       | [models.AIChatOptionResponseData](../models/ai-chat-option-response-data.md) | :heavy_check_mark:                                                           | N/A                                                                          |                                                                              |