# ChatTypesResponse

Structured response containing array of chat types

## Example Usage

```typescript
import { ChatTypesResponse } from 'norberts-spark-sdk/models'

let value: ChatTypesResponse = {
  success: true,
  data: [
    {
      id: '019c52b2-0cac-7995-9461-83d735c5c51d',
      name: 'The Heart of Darkness',
      seoFriendlyId: 'heart-darkness',
      seoFriendlyBase64Id: 'AZxSsgyseZWUYYPXNcXFHQ',
      description:
        "Explore Joseph Conrad's classic novella through interactive AI-powered discussions",
      createdAt: new Date('2024-01-15T10:30:00Z'),
      updatedAt: new Date('2024-01-15T10:30:00Z'),
    },
  ],
}
```

## Fields

| Field     | Type                                                                    | Required           | Description                             | Example |
| --------- | ----------------------------------------------------------------------- | ------------------ | --------------------------------------- | ------- |
| `success` | _boolean_                                                               | :heavy_check_mark: | Indicates if the request was successful | true    |
| `data`    | [models.ChatTypesResponseData](../models/chat-types-response-data.md)[] | :heavy_check_mark: | Array of chat type objects              |         |
