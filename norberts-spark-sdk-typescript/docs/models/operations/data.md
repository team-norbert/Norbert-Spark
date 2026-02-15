# Data

## Example Usage

```typescript
import { Data } from 'norberts-spark-sdk/models/operations'

let value: Data = {
  uploadUrls: [
    {
      filename: 'document.pdf',
      uploadUrl: 'https://r2.example.com/bucket/data-extraction/uuid/document.pdf?signature=...',
      fileKey: 'data-extraction/01HXYZ123/document.pdf',
    },
  ],
}
```

## Fields

| Field        | Type                                                            | Required           | Description |
| ------------ | --------------------------------------------------------------- | ------------------ | ----------- |
| `uploadUrls` | [operations.UploadUrl](../../models/operations/upload-url.md)[] | :heavy_check_mark: | N/A         |
