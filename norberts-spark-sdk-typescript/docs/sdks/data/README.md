# Data

## Overview

Data extraction operations

### Available Operations

- [generatePresignedUrls](#generatepresignedurls) - Generate presigned URLs for direct R2 upload

## generatePresignedUrls

Accepts file metadata (filename and mimetype) and returns presigned URLs for direct upload to Cloudflare R2 storage. The client can then use these URLs to upload files directly without going through the backend.

### Example Usage

<!-- UsageSnippet language="typescript" operationID="generatePresignedUrls" method="post" path="/ai/extract-data/presigned-urls" -->

```typescript
import { NorbertsSparkSDK } from 'norberts-spark-sdk'

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env['NORBERTSSPARKSDK_BEARER_AUTH'] ?? '',
})

async function run() {
  const result = await norbertsSparkSDK.data.generatePresignedUrls({
    files: [],
  })

  console.log(result)
}

run()
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from 'norberts-spark-sdk/core.js'
import { aiGeneratePresignedUrls } from 'norberts-spark-sdk/funcs/ai-generate-presigned-urls.js'

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env['NORBERTSSPARKSDK_BEARER_AUTH'] ?? '',
})

async function run() {
  const res = await aiGeneratePresignedUrls(norbertsSparkSDK, {
    files: [],
  })
  if (res.ok) {
    const { value: result } = res
    console.log(result)
  } else {
    console.log('aiGeneratePresignedUrls failed:', res.error)
  }
}

run()
```

### Parameters

| Parameter              | Type                                                                                                  | Required           | Description                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`              | [operations.GeneratePresignedUrlsRequest](../../models/operations/generate-presigned-urls-request.md) | :heavy_check_mark: | The request object to use for the request.                                                                                                                                     |
| `options`              | RequestOptions                                                                                        | :heavy_minus_sign: | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions` | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)               | :heavy_minus_sign: | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`      | [RetryConfig](../../lib/utils/retryconfig.md)                                                         | :heavy_minus_sign: | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.GeneratePresignedUrlsResponse](../../models/operations/generate-presigned-urls-response.md)\>**

### Errors

| Error Type                          | Status Code | Content Type     |
| ----------------------------------- | ----------- | ---------------- |
| errors.ErrorT                       | 401, 422    | application/json |
| errors.ErrorT                       | 500         | application/json |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX    | \*/\*            |
