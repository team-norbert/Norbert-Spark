# ChatTypesResponseData

## Example Usage

```typescript
import { ChatTypesResponseData } from "norberts-spark-sdk/models";

let value: ChatTypesResponseData = {
  id: "019c52b2-0cac-7995-9461-83d735c5c51d",
  name: "The Heart of Darkness",
  seoFriendlyId: "heart-darkness",
  seoFriendlyBase64Id: "AZxSsgyseZWUYYPXNcXFHQ",
  description:
    "Explore Joseph Conrad's classic novella through interactive AI-powered discussions",
  createdAt: new Date("2024-01-15T10:30:00Z"),
  updatedAt: new Date("2024-01-15T10:30:00Z"),
};
```

## Fields

| Field                                                                                         | Type                                                                                          | Required                                                                                      | Description                                                                                   | Example                                                                                       |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `id`                                                                                          | *string*                                                                                      | :heavy_check_mark:                                                                            | Unique identifier for the chat type                                                           | 019c52b2-0cac-7995-9461-83d735c5c51d                                                          |
| `name`                                                                                        | *string*                                                                                      | :heavy_check_mark:                                                                            | Display name of the chat type                                                                 | The Heart of Darkness                                                                         |
| `seoFriendlyId`                                                                               | *string*                                                                                      | :heavy_check_mark:                                                                            | SEO-friendly URL slug (lowercase alphanumeric with hyphens)                                   | heart-darkness                                                                                |
| `seoFriendlyBase64Id`                                                                         | *string*                                                                                      | :heavy_check_mark:                                                                            | Base64-encoded URL-safe identifier (22 characters)                                            | AZxSsgyseZWUYYPXNcXFHQ                                                                        |
| `description`                                                                                 | *string*                                                                                      | :heavy_check_mark:                                                                            | Detailed description of the chat type                                                         | Explore Joseph Conrad's classic novella through interactive AI-powered discussions            |
| `createdAt`                                                                                   | [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | :heavy_check_mark:                                                                            | Timestamp when the chat type was created                                                      | 2024-01-15T10:30:00Z                                                                          |
| `updatedAt`                                                                                   | [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | :heavy_check_mark:                                                                            | Timestamp when the chat type was last updated                                                 | 2024-01-15T10:30:00Z                                                                          |