# Auth

## Overview

Authentication operations

### Available Operations

* [loginUser](#loginuser) - Authenticate a user
* [oauthSync](#oauthsync) - Synchronize OAuth user data

## loginUser

Authenticates a user and returns a JWT access token

### Example Usage

<!-- UsageSnippet language="typescript" operationID="loginUser" method="post" path="/auth/login" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK();

async function run() {
  const result = await norbertsSparkSDK.auth.loginUser({
    email: "john.doe@example.com",
    password: "SecurePass123!",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { authLoginUser } from "norberts-spark-sdk/funcs/auth-login-user.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore();

async function run() {
  const res = await authLoginUser(norbertsSparkSDK, {
    email: "john.doe@example.com",
    password: "SecurePass123!",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("authLoginUser failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [models.UserLoginRequest](../../models/user-login-request.md)                                                                                                                  | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[models.UserLoginResponse](../../models/user-login-response.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 400, 401                            | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |

## oauthSync

Creates or updates user records for OAuth-authenticated users (Google, GitHub, etc.). This endpoint is called by the frontend NextAuth callback to ensure OAuth users are stored in the backend database for consistency with credentials users. Protected by a shared secret header to prevent unauthorized access.

### Example Usage: invalidEmail

<!-- UsageSnippet language="typescript" operationID="oauthSync" method="post" path="/auth/oauth-sync" example="invalidEmail" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK();

async function run() {
  const result = await norbertsSparkSDK.auth.oauthSync({
    oauthSyncSecret: process.env["NORBERTSSPARKSDK_OAUTH_SYNC_SECRET"] ?? "",
  }, {
    provider: "google",
    providerId: "1234567890",
    email: "user@example.com",
    name: "John Doe",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { authOauthSync } from "norberts-spark-sdk/funcs/auth-oauth-sync.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore();

async function run() {
  const res = await authOauthSync(norbertsSparkSDK, {
    oauthSyncSecret: process.env["NORBERTSSPARKSDK_OAUTH_SYNC_SECRET"] ?? "",
  }, {
    provider: "google",
    providerId: "1234567890",
    email: "user@example.com",
    name: "John Doe",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("authOauthSync failed:", res.error);
  }
}

run();
```
### Example Usage: missingProvider

<!-- UsageSnippet language="typescript" operationID="oauthSync" method="post" path="/auth/oauth-sync" example="missingProvider" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK();

async function run() {
  const result = await norbertsSparkSDK.auth.oauthSync({
    oauthSyncSecret: process.env["NORBERTSSPARKSDK_OAUTH_SYNC_SECRET"] ?? "",
  }, {
    provider: "google",
    providerId: "1234567890",
    email: "user@example.com",
    name: "John Doe",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { authOauthSync } from "norberts-spark-sdk/funcs/auth-oauth-sync.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore();

async function run() {
  const res = await authOauthSync(norbertsSparkSDK, {
    oauthSyncSecret: process.env["NORBERTSSPARKSDK_OAUTH_SYNC_SECRET"] ?? "",
  }, {
    provider: "google",
    providerId: "1234567890",
    email: "user@example.com",
    name: "John Doe",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("authOauthSync failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [models.OAuthSyncRequest](../../models/o-auth-sync-request.md)                                                                                                                 | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `security`                                                                                                                                                                     | [operations.OauthSyncSecurity](../../models/operations/oauth-sync-security.md)                                                                                                 | :heavy_check_mark:                                                                                                                                                             | The security requirements to use for the request.                                                                                                                              |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[models.OAuthSyncResponse](../../models/o-auth-sync-response.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 400, 401                            | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |