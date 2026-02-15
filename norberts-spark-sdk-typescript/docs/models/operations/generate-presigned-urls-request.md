# GeneratePresignedUrlsRequest

## Example Usage

```typescript
import { GeneratePresignedUrlsRequest } from "norberts-spark-sdk/models/operations";

let value: GeneratePresignedUrlsRequest = {
  files: [],
};
```

## Fields

| Field                                                   | Type                                                    | Required                                                | Description                                             |
| ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| `files`                                                 | [operations.FileT](../../models/operations/file-t.md)[] | :heavy_check_mark:                                      | Array of file metadata objects                          |