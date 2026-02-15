# Health

## Overview

Health check endpoints

### Available Operations

* [getHealth](#gethealth) - Health check

## getHealth

Returns the current health status of the API

### Example Usage

<!-- UsageSnippet language="typescript" operationID="getHealth" method="get" path="/health" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.health.getHealth();

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { healthGetHealth } from "norberts-spark-sdk/funcs/health-get-health.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await healthGetHealth(norbertsSparkSDK);
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("healthGetHealth failed:", res.error);
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

**Promise\<[operations.GetHealthResponse](../../models/operations/get-health-response.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |