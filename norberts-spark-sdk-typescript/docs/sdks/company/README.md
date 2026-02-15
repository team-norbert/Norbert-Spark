# Company

## Overview

Company details

### Available Operations

- [getCompanyDetails](#getcompanydetails) - Get Company and key person details
- [updateCompanyDetails](#updatecompanydetails) - Update Company and key person details

## getCompanyDetails

Retrieve detailed information about the single company record and the single key person record (each table contains at most one record)

### Example Usage

<!-- UsageSnippet language="typescript" operationID="getCompanyDetails" method="get" path="/company/details" -->

```typescript
import { NorbertsSparkSDK } from 'norberts-spark-sdk'

const norbertsSparkSDK = new NorbertsSparkSDK({
  bearerAuth: process.env['NORBERTSSPARKSDK_BEARER_AUTH'] ?? '',
})

async function run() {
  const result = await norbertsSparkSDK.company.getCompanyDetails()

  console.log(result)
}

run()
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from 'norberts-spark-sdk/core.js'
import { companyGetCompanyDetails } from 'norberts-spark-sdk/funcs/company-get-company-details.js'

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore({
  bearerAuth: process.env['NORBERTSSPARKSDK_BEARER_AUTH'] ?? '',
})

async function run() {
  const res = await companyGetCompanyDetails(norbertsSparkSDK)
  if (res.ok) {
    const { value: result } = res
    console.log(result)
  } else {
    console.log('companyGetCompanyDetails failed:', res.error)
  }
}

run()
```

### Parameters

| Parameter              | Type                                                                                    | Required           | Description                                                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `options`              | RequestOptions                                                                          | :heavy_minus_sign: | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions` | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options) | :heavy_minus_sign: | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`      | [RetryConfig](../../lib/utils/retryconfig.md)                                           | :heavy_minus_sign: | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[models.CompanyDetailsResponse](../../models/company-details-response.md)\>**

### Errors

| Error Type                          | Status Code | Content Type     |
| ----------------------------------- | ----------- | ---------------- |
| errors.ErrorT                       | 401, 404    | application/json |
| errors.ErrorT                       | 500         | application/json |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX    | \*/\*            |

## updateCompanyDetails

Update the single company record and the single key person record (each table contains at most one record)

### Example Usage

<!-- UsageSnippet language="typescript" operationID="updateCompanyDetails" method="put" path="/company/details" -->

```typescript
import { NorbertsSparkSDK } from 'norberts-spark-sdk'

const norbertsSparkSDK = new NorbertsSparkSDK()

async function run() {
  await norbertsSparkSDK.company.updateCompanyDetails(
    {
      oauthSyncSecret: process.env['NORBERTSSPARKSDK_OAUTH_SYNC_SECRET'] ?? '',
    },
    {
      company: {
        companyId: '123e4567-e89b-12d3-a456-426614174000',
        legalName: 'Acme Corporation Ltd.',
        displayName: 'Acme Corp',
        status: 'active',
        industry: 'Technology',
        companySize: 500,
        websiteUrl: 'https://acme.com',
        billingCountry: 'US',
        timezone: 'America/New_York',
      },
      keyPerson: {
        keyPersonId: '987e6543-e21b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@acme.com',
        phone: '+1-555-123-4567',
        jobTitle: 'Chief Executive Officer',
        isActive: true,
      },
    }
  )
}

run()
```

### Standalone function

The standalone function version of this method:

```typescript
import { NorbertsSparkSDKCore } from 'norberts-spark-sdk/core.js'
import { companyUpdateCompanyDetails } from 'norberts-spark-sdk/funcs/company-update-company-details.js'

// Use `NorbertsSparkSDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const norbertsSparkSDK = new NorbertsSparkSDKCore()

async function run() {
  const res = await companyUpdateCompanyDetails(
    norbertsSparkSDK,
    {
      oauthSyncSecret: process.env['NORBERTSSPARKSDK_OAUTH_SYNC_SECRET'] ?? '',
    },
    {
      company: {
        companyId: '123e4567-e89b-12d3-a456-426614174000',
        legalName: 'Acme Corporation Ltd.',
        displayName: 'Acme Corp',
        status: 'active',
        industry: 'Technology',
        companySize: 500,
        websiteUrl: 'https://acme.com',
        billingCountry: 'US',
        timezone: 'America/New_York',
      },
      keyPerson: {
        keyPersonId: '987e6543-e21b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@acme.com',
        phone: '+1-555-123-4567',
        jobTitle: 'Chief Executive Officer',
        isActive: true,
      },
    }
  )
  if (res.ok) {
    const { value: result } = res
  } else {
    console.log('companyUpdateCompanyDetails failed:', res.error)
  }
}

run()
```

### Parameters

| Parameter              | Type                                                                                                  | Required           | Description                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`              | [models.CompanyDetailsRequest](../../models/company-details-request.md)                               | :heavy_check_mark: | The request object to use for the request.                                                                                                                                     |
| `security`             | [operations.UpdateCompanyDetailsSecurity](../../models/operations/update-company-details-security.md) | :heavy_check_mark: | The security requirements to use for the request.                                                                                                                              |
| `options`              | RequestOptions                                                                                        | :heavy_minus_sign: | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions` | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)               | :heavy_minus_sign: | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`      | [RetryConfig](../../lib/utils/retryconfig.md)                                                         | :heavy_minus_sign: | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<void\>**

### Errors

| Error Type                          | Status Code | Content Type     |
| ----------------------------------- | ----------- | ---------------- |
| errors.ErrorT                       | 401, 403    | application/json |
| errors.ErrorT                       | 500         | application/json |
| errors.NorbertsSparkSDKDefaultError | 4XX, 5XX    | \*/\*            |
