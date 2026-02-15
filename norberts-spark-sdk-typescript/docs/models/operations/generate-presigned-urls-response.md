# GeneratePresignedUrlsResponse

Presigned URLs generated successfully

## Example Usage

```typescript
import { GeneratePresignedUrlsResponse } from "norberts-spark-sdk/models/operations";

let value: GeneratePresignedUrlsResponse = {
  success: true,
  data: {
    uploadUrls: [
      {
        filename: "document.pdf",
        uploadUrl:
          "https://r2.example.com/bucket/data-extraction/uuid/document.pdf?signature=...",
        fileKey: "data-extraction/01HXYZ123/document.pdf",
      },
    ],
  },
  message: "Presigned URLs generated successfully",
};
```

## Fields

| Field                                              | Type                                               | Required                                           | Description                                        | Example                                            |
| -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| `success`                                          | *boolean*                                          | :heavy_check_mark:                                 | N/A                                                | true                                               |
| `data`                                             | [operations.Data](../../models/operations/data.md) | :heavy_check_mark:                                 | N/A                                                |                                                    |
| `message`                                          | *string*                                           | :heavy_minus_sign:                                 | N/A                                                | Presigned URLs generated successfully              |