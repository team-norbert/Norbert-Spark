# Ai

## Overview

AI-generated response operations

### Available Operations

* [getAIResponse](#getairesponse) - Get AI-generated response
* [getAIChatsByUserId](#getaichatsbyuserid) - Get chat IDs for user
* [getAIFetchChatByChatId](#getaifetchchatbychatid) - Fetch chat by chatId
* [generatePresignedUrls](#generatepresignedurls) - Generate presigned URLs for direct R2 upload
* [extractData](#extractdata) - Fetch data extracted from PDFs
* [getAIChatDetails](#getaichatdetails) - Get chat AI configuration
* [getAIChatSettingsById](#getaichatsettingsbyid) - Get specific chat AI settings by ID
* [putAIChatSettingsById](#putaichatsettingsbyid) - Update specific chat AI settings by ID

## getAIResponse

Sends a prompt to the AI service and retrieves the generated response

### Example Usage: invalidIdFormat

<!-- UsageSnippet language="typescript" operationID="getAIResponse" method="post" path="/ai/chat" example="invalidIdFormat" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.getAIResponse({
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiGetAIResponse } from "norberts-spark-sdk/funcs/ai-get-ai-response.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiGetAIResponse(norbertsSparkSDK, {
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiGetAIResponse failed:", res.error);
  }
}

run();
```
### Example Usage: invalidMessages

<!-- UsageSnippet language="typescript" operationID="getAIResponse" method="post" path="/ai/chat" example="invalidMessages" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.getAIResponse({
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiGetAIResponse } from "norberts-spark-sdk/funcs/ai-get-ai-response.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiGetAIResponse(norbertsSparkSDK, {
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiGetAIResponse failed:", res.error);
  }
}

run();
```
### Example Usage: lastMessageNotUser

<!-- UsageSnippet language="typescript" operationID="getAIResponse" method="post" path="/ai/chat" example="lastMessageNotUser" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.getAIResponse({
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiGetAIResponse } from "norberts-spark-sdk/funcs/ai-get-ai-response.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiGetAIResponse(norbertsSparkSDK, {
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiGetAIResponse failed:", res.error);
  }
}

run();
```
### Example Usage: missingFields

<!-- UsageSnippet language="typescript" operationID="getAIResponse" method="post" path="/ai/chat" example="missingFields" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.getAIResponse({
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiGetAIResponse } from "norberts-spark-sdk/funcs/ai-get-ai-response.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiGetAIResponse(norbertsSparkSDK, {
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiGetAIResponse failed:", res.error);
  }
}

run();
```
### Example Usage: noMessages

<!-- UsageSnippet language="typescript" operationID="getAIResponse" method="post" path="/ai/chat" example="noMessages" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.getAIResponse({
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiGetAIResponse } from "norberts-spark-sdk/funcs/ai-get-ai-response.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiGetAIResponse(norbertsSparkSDK, {
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiGetAIResponse failed:", res.error);
  }
}

run();
```
### Example Usage: responseWithToolCall

<!-- UsageSnippet language="typescript" operationID="getAIResponse" method="post" path="/ai/chat" example="responseWithToolCall" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.getAIResponse({
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiGetAIResponse } from "norberts-spark-sdk/funcs/ai-get-ai-response.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiGetAIResponse(norbertsSparkSDK, {
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiGetAIResponse failed:", res.error);
  }
}

run();
```
### Example Usage: simpleTextResponse

<!-- UsageSnippet language="typescript" operationID="getAIResponse" method="post" path="/ai/chat" example="simpleTextResponse" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.getAIResponse({
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiGetAIResponse } from "norberts-spark-sdk/funcs/ai-get-ai-response.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiGetAIResponse(norbertsSparkSDK, {
    id: "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    messages: [
      {
        id: "Z9HbJCTLArucKCzf",
        role: "user",
        parts: [],
      },
    ],
    trigger: "submit-message",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiGetAIResponse failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [models.AIRequest](../../models/ai-request.md)                                                                                                                                 | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[string](../../models/.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 400, 401                            | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |

## getAIChatsByUserId

Retrieves a list of chat IDs associated with the specified user

### Example Usage

<!-- UsageSnippet language="typescript" operationID="getAIChatsByUserId" method="get" path="/ai/chats/{userId}" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.getAIChatsByUserId({
    userId: "019bc2f3-7b6a-7c2e-9c4a-9b5f3e2a1d87",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiGetAIChatsByUserId } from "norberts-spark-sdk/funcs/ai-get-ai-chats-by-user-id.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiGetAIChatsByUserId(norbertsSparkSDK, {
    userId: "019bc2f3-7b6a-7c2e-9c4a-9b5f3e2a1d87",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiGetAIChatsByUserId failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.GetAIChatsByUserIdRequest](../../models/operations/get-ai-chats-by-user-id-request.md)                                                                             | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[models.AIUserIdResponse](../../models/ai-user-id-response.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 400, 401, 403                       | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |

## getAIFetchChatByChatId

Retrieves the chat object for the specified chatId

### Example Usage

<!-- UsageSnippet language="typescript" operationID="getAIFetchChatByChatId" method="get" path="/ai/fetchChat/{chatId}" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.getAIFetchChatByChatId({
    chatId: "529bf0f9-2384-4a21-a98b-8ad274c3d2cb",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiGetAIFetchChatByChatId } from "norberts-spark-sdk/funcs/ai-get-ai-fetch-chat-by-chat-id.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiGetAIFetchChatByChatId(norbertsSparkSDK, {
    chatId: "529bf0f9-2384-4a21-a98b-8ad274c3d2cb",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiGetAIFetchChatByChatId failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.GetAIFetchChatByChatIdRequest](../../models/operations/get-ai-fetch-chat-by-chat-id-request.md)                                                                    | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[models.AIfetchChatResponse](../../models/a-ifetch-chat-response.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 400, 401, 403                       | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |

## generatePresignedUrls

Accepts file metadata (filename and mimetype) and returns presigned URLs for direct upload to Cloudflare R2 storage. The client can then use these URLs to upload files directly without going through the backend.

### Example Usage

<!-- UsageSnippet language="typescript" operationID="generatePresignedUrls" method="post" path="/ai/extract-data/presigned-urls" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.generatePresignedUrls({
    files: [],
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiGeneratePresignedUrls } from "norberts-spark-sdk/funcs/ai-generate-presigned-urls.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiGeneratePresignedUrls(norbertsSparkSDK, {
    files: [],
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiGeneratePresignedUrls failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.GeneratePresignedUrlsRequest](../../models/operations/generate-presigned-urls-request.md)                                                                          | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.GeneratePresignedUrlsResponse](../../models/operations/generate-presigned-urls-response.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 401, 422                            | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |

## extractData

Retrieves the data from the PDF file previously uploaded to bucket

### Example Usage

<!-- UsageSnippet language="typescript" operationID="extractData" method="get" path="/ai/extract-data/{fileId}" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.extractData({
    fileId: "<value>",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiExtractData } from "norberts-spark-sdk/funcs/ai-extract-data.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiExtractData(norbertsSparkSDK, {
    fileId: "<value>",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiExtractData failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.ExtractDataRequest](../../models/operations/extract-data-request.md)                                                                                               | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[string](../../models/.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 401, 403, 404                       | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |

## getAIChatDetails

Retrieves all available chat types with their details and SEO-friendly identifiers

### Example Usage

<!-- UsageSnippet language="typescript" operationID="getAIChatDetails" method="get" path="/ai/chats/config" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.getAIChatDetails();

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiGetAIChatDetails } from "norberts-spark-sdk/funcs/ai-get-ai-chat-details.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiGetAIChatDetails(norbertsSparkSDK);
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiGetAIChatDetails failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[models.AIChatOptionsResponse](../../models/ai-chat-options-response.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 401, 403                            | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |

## getAIChatSettingsById

Retrieves AI configuration settings for a specific chat type using its unique identifier

### Example Usage

<!-- UsageSnippet language="typescript" operationID="getAIChatSettingsById" method="get" path="/ai/chats/config/{id}/settings" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.ai.getAIChatSettingsById({
    id: "4dc6fd6f-346f-41bb-9a71-d6c9239e2d0f",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiGetAIChatSettingsById } from "norberts-spark-sdk/funcs/ai-get-ai-chat-settings-by-id.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiGetAIChatSettingsById(norbertsSparkSDK, {
    id: "4dc6fd6f-346f-41bb-9a71-d6c9239e2d0f",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("aiGetAIChatSettingsById failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.GetAIChatSettingsByIdRequest](../../models/operations/get-ai-chat-settings-by-id-request.md)                                                                       | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[models.AIChatOptionResponse](../../models/ai-chat-option-response.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 400, 401, 403, 404                  | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |

## putAIChatSettingsById

Updates (replaces) AI configuration settings for a specific chat type using its unique identifier. Returns 404 if the chat configuration does not exist.

### Example Usage

<!-- UsageSnippet language="typescript" operationID="putAIChatSettingsById" method="put" path="/ai/chats/config/{id}/settings" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  await norbertsSparkSDK.ai.putAIChatSettingsById({
    id: "fb142a93-96e4-44bf-a2fd-96c4b931cd15",
    body: {
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
    },
  });


}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { aiPutAIChatSettingsById } from "norberts-spark-sdk/funcs/ai-put-ai-chat-settings-by-id.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await aiPutAIChatSettingsById(norbertsSparkSDK, {
    id: "fb142a93-96e4-44bf-a2fd-96c4b931cd15",
    body: {
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
    },
  });
  if (res.ok) {
    const { value: result } = res;
    
  } else {
    console.log("aiPutAIChatSettingsById failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.PutAIChatSettingsByIdRequest](../../models/operations/put-ai-chat-settings-by-id-request.md)                                                                       | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<void\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 400, 401, 403, 404                  | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |