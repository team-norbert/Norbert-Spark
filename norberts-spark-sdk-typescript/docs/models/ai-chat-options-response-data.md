# AIChatOptionsResponseData

## Example Usage

```typescript
import { AIChatOptionsResponseData } from 'norberts-spark-sdk/models'

let value: AIChatOptionsResponseData = {
  id: '019b659a-2ad2-7fd8-9f32-35624caef900',
  name: 'General Assistant',
  description: 'A general-purpose AI assistant for everyday tasks',
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z'),
  seoFriendlyId: 'general-assistant',
  seoFriendlyBase64Id: 'AbCdEfGhIjKlMnOpQrStUv',
}
```

## Fields

| Field                 | Type                                                                                          | Required           | Description                                              | Example                                           |
| --------------------- | --------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------- | ------------------------------------------------- |
| `id`                  | _string_                                                                                      | :heavy_check_mark: | N/A                                                      | 019b659a-2ad2-7fd8-9f32-35624caef900              |
| `name`                | _string_                                                                                      | :heavy_check_mark: | Name of the chat type                                    | General Assistant                                 |
| `description`         | _string_                                                                                      | :heavy_check_mark: | Description of the chat type purpose                     | A general-purpose AI assistant for everyday tasks |
| `createdAt`           | [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | :heavy_check_mark: | N/A                                                      | 2024-01-15T10:30:00Z                              |
| `updatedAt`           | [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | :heavy_check_mark: | N/A                                                      | 2024-01-15T10:30:00Z                              |
| `seoFriendlyId`       | _string_                                                                                      | :heavy_check_mark: | SEO friendly slug for the chat type                      | general-assistant                                 |
| `seoFriendlyBase64Id` | _string_                                                                                      | :heavy_check_mark: | Base64url encoded UUID for the chat type (22 characters) | AbCdEfGhIjKlMnOpQrStUv                            |
