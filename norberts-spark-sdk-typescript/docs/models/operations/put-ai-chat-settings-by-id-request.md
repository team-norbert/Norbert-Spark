# PutAIChatSettingsByIdRequest

## Example Usage

```typescript
import { PutAIChatSettingsByIdRequest } from 'norberts-spark-sdk/models/operations'

let value: PutAIChatSettingsByIdRequest = {
  id: '7a8cdd55-2688-4196-86ca-314e296b4845',
  body: {
    prompt: 'You are a helpful AI assistant...',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,
    topK: 40,
    stopSequences: ['###', 'END', '\n\n\n'],
    seed: 12345,
    maxRetries: 2,
  },
}
```

## Fields

| Field  | Type                                                                            | Required           | Description                               |
| ------ | ------------------------------------------------------------------------------- | ------------------ | ----------------------------------------- |
| `id`   | _string_                                                                        | :heavy_check_mark: | The unique identifier for the chat option |
| `body` | [models.PutRequestAIChatSettings](../../models/put-request-ai-chat-settings.md) | :heavy_check_mark: | N/A                                       |
