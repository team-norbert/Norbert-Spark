# Users

## Overview

User management operations

### Available Operations

* [registerUser](#registeruser) - Register a new user
* [getUserById](#getuserbyid) - Get user by ID
* [getAllUsers](#getallusers) - Get all users
* [deleteUsers](#deleteusers) - Delete users

## registerUser

Creates a new user account

### Example Usage

<!-- UsageSnippet language="typescript" operationID="registerUser" method="post" path="/users/register" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK();

async function run() {
  const result = await norbertsSparkSDK.users.registerUser({
    email: "john.doe@example.com",
    password: "SecurePass123!",
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
import { usersRegisterUser } from "norberts-spark-sdk/funcs/users-register-user.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore();

async function run() {
  const res = await usersRegisterUser(norbertsSparkSDK, {
    email: "john.doe@example.com",
    password: "SecurePass123!",
    name: "John Doe",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("usersRegisterUser failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [models.RegisterUserRequest](../../models/register-user-request.md)                                                                                                            | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[models.RegisterUserResponse](../../models/register-user-response.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 400, 409                            | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |

## getUserById

Retrieves a user's profile information

### Example Usage

<!-- UsageSnippet language="typescript" operationID="getUserById" method="get" path="/users/{id}" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.users.getUserById({
    id: "019bc2f3-7b6a-7c2e-9c4a-9b5f3e2a1d87",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { usersGetUserById } from "norberts-spark-sdk/funcs/users-get-user-by-id.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await usersGetUserById(norbertsSparkSDK, {
    id: "019bc2f3-7b6a-7c2e-9c4a-9b5f3e2a1d87",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("usersGetUserById failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.GetUserByIdRequest](../../models/operations/get-user-by-id-request.md)                                                                                             | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[models.User](../../models/user.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 404                                 | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |

## getAllUsers

Retrieves all users in date order with pagination. Requires authentication with admin or moderator role.

### Example Usage

<!-- UsageSnippet language="typescript" operationID="getAllUsers" method="get" path="/users" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.users.getAllUsers({});

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { usersGetAllUsers } from "norberts-spark-sdk/funcs/users-get-all-users.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await usersGetAllUsers(norbertsSparkSDK, {});
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("usersGetAllUsers failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.GetAllUsersRequest](../../models/operations/get-all-users-request.md)                                                                                              | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[models.PaginatedUsersResponse](../../models/paginated-users-response.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 401, 403                            | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |

## deleteUsers

Deletes multiple user accounts by their IDs. Requires authentication with admin role.

### Example Usage

<!-- UsageSnippet language="typescript" operationID="deleteUsers" method="delete" path="/users" -->
```typescript
import { NorbertsSparkSDK } from "norberts-spark-sdk";

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await norbertsSparkSDK.users.deleteUsers({
    userIds: [
      "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    ],
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from "norberts-spark-sdk/core.js";
import { usersDeleteUsers } from "norberts-spark-sdk/funcs/users-delete-users.js";

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env["NORBERTSSPARKSDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const res = await usersDeleteUsers(norbertsSparkSDK, {
    userIds: [
      "01890c3a-6f2b-7c1a-b9e1-9b5a0d5f6e3a",
    ],
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("usersDeleteUsers failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DeleteUsersRequest](../../models/operations/delete-users-request.md)                                                                                               | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DeleteUsersResponse](../../models/operations/delete-users-response.md)\>**

### Errors

| Error Type                          | Status Code                         | Content Type                        |
| ----------------------------------- | ----------------------------------- | ----------------------------------- |
| errors.ErrorT                       | 400, 401, 403, 404                  | application/json                    |
| errors.ErrorT                       | 500                                 | application/json                    |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX                            | \*/\*                               |