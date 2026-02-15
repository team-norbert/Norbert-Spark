# FileT

## Example Usage

```typescript
import { FileT } from "norberts-spark-sdk/models/operations";

let value: FileT = {
  filename: "document.pdf",
  mimetype: "application/pdf",
};
```

## Fields

| Field                 | Type                  | Required              | Description           | Example               |
| --------------------- | --------------------- | --------------------- | --------------------- | --------------------- |
| `filename`            | *string*              | :heavy_check_mark:    | Name of the file      | document.pdf          |
| `mimetype`            | *string*              | :heavy_check_mark:    | MIME type of the file | application/pdf       |