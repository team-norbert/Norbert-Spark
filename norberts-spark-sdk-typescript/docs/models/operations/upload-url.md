# UploadUrl

## Example Usage

```typescript
import { UploadUrl } from 'norberts-spark-sdk/models/operations'

let value: UploadUrl = {
  filename: 'document.pdf',
  uploadUrl: 'https://r2.example.com/bucket/data-extraction/uuid/document.pdf?signature=...',
  fileKey: 'data-extraction/01HXYZ123/document.pdf',
}
```

## Fields

| Field       | Type     | Required           | Description                           | Example                                                                       |
| ----------- | -------- | ------------------ | ------------------------------------- | ----------------------------------------------------------------------------- |
| `filename`  | _string_ | :heavy_check_mark: | Original filename                     | document.pdf                                                                  |
| `uploadUrl` | _string_ | :heavy_check_mark: | Presigned URL for direct upload to R2 | https://r2.example.com/bucket/data-extraction/uuid/document.pdf?signature=... |
| `fileKey`   | _string_ | :heavy_check_mark: | Storage key for the file in R2        | data-extraction/01HXYZ123/document.pdf                                        |
