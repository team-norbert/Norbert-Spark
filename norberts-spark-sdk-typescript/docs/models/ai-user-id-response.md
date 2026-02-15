# AIUserIdResponse

Structured response containing array of chat IDs for a user

## Example Usage

```typescript
import { AIUserIdResponse } from "norberts-spark-sdk/models";

let value: AIUserIdResponse = {
  success: true,
  data: [
    "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
  ],
};
```

## Fields

| Field                                       | Type                                        | Required                                    | Description                                 | Example                                     |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------- | ------------------------------------------- | ------------------------------------------- |
| `success`                                   | *boolean*                                   | :heavy_check_mark:                          | Indicates if the request was successful     | true                                        |
| `data`                                      | *string*[]                                  | :heavy_check_mark:                          | Array of UUID strings for previous AI chats |                                             |