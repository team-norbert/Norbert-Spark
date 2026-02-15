# PutRequestAIChatSettings

Settings for AI chat requests

## Example Usage

```typescript
import { PutRequestAIChatSettings } from "norberts-spark-sdk/models";

let value: PutRequestAIChatSettings = {
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
};
```

## Fields

| Field                                                                    | Type                                                                     | Required                                                                 | Description                                                              | Example                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `prompt`                                                                 | *string*                                                                 | :heavy_check_mark:                                                       | The prompt template for the AI model                                     | You are a helpful AI assistant...                                        |
| `maxTokens`                                                              | *number*                                                                 | :heavy_minus_sign:                                                       | Maximum number of tokens to generate                                     | 4096                                                                     |
| `temperature`                                                            | *number*                                                                 | :heavy_minus_sign:                                                       | Sampling temperature for randomness (0 = deterministic, 2 = very random) | 0.7                                                                      |
| `topP`                                                                   | *number*                                                                 | :heavy_minus_sign:                                                       | Nucleus sampling threshold (0-1)                                         | 0.9                                                                      |
| `frequencyPenalty`                                                       | *number*                                                                 | :heavy_minus_sign:                                                       | Penalty for repeating words/phrases (-2 to 2)                            | 0                                                                        |
| `presencePenalty`                                                        | *number*                                                                 | :heavy_minus_sign:                                                       | Penalty for repeating information from prompt (-2 to 2)                  | 0                                                                        |
| `topK`                                                                   | *number*                                                                 | :heavy_minus_sign:                                                       | Top-K sampling parameter                                                 | 40                                                                       |
| `stopSequences`                                                          | *string*[]                                                               | :heavy_minus_sign:                                                       | Array of sequences that stop text generation                             | [<br/>"###",<br/>"END",<br/>"\n\n\n"<br/>]                               |
| `seed`                                                                   | *number*                                                                 | :heavy_minus_sign:                                                       | Random seed for deterministic results                                    | 12345                                                                    |
| `maxRetries`                                                             | *number*                                                                 | :heavy_minus_sign:                                                       | Maximum number of retries for transient errors                           | 2                                                                        |