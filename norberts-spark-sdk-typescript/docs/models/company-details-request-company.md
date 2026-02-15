# CompanyDetailsRequestCompany

Company details

## Example Usage

```typescript
import { CompanyDetailsRequestCompany } from "norberts-spark-sdk/models";

let value: CompanyDetailsRequestCompany = {
  companyId: "123e4567-e89b-12d3-a456-426614174000",
  legalName: "Acme Corporation Ltd.",
  displayName: "Acme Corp",
  status: "active",
  industry: "Technology",
  companySize: 500,
  websiteUrl: "https://acme.com",
  billingCountry: "US",
  timezone: "America/New_York",
};
```

## Fields

| Field                                                                             | Type                                                                              | Required                                                                          | Description                                                                       | Example                                                                           |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `companyId`                                                                       | *string*                                                                          | :heavy_check_mark:                                                                | Unique identifier for the company                                                 | 123e4567-e89b-12d3-a456-426614174000                                              |
| `legalName`                                                                       | *string*                                                                          | :heavy_minus_sign:                                                                | Legal name of the company                                                         | Acme Corporation Ltd.                                                             |
| `displayName`                                                                     | *string*                                                                          | :heavy_minus_sign:                                                                | Display name of the company                                                       | Acme Corp                                                                         |
| `status`                                                                          | [models.CompanyDetailsRequestStatus](../models/company-details-request-status.md) | :heavy_minus_sign:                                                                | Current status of the company                                                     | active                                                                            |
| `industry`                                                                        | *string*                                                                          | :heavy_minus_sign:                                                                | Industry sector                                                                   | Technology                                                                        |
| `companySize`                                                                     | *number*                                                                          | :heavy_minus_sign:                                                                | Number of employees                                                               | 500                                                                               |
| `websiteUrl`                                                                      | *string*                                                                          | :heavy_minus_sign:                                                                | Company website URL                                                               | https://acme.com                                                                  |
| `billingCountry`                                                                  | *string*                                                                          | :heavy_minus_sign:                                                                | ISO 3166-1 alpha-2 country code                                                   | US                                                                                |
| `timezone`                                                                        | *string*                                                                          | :heavy_minus_sign:                                                                | Company timezone                                                                  | America/New_York                                                                  |