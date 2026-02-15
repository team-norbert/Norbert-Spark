# CompanyDetailsResponseCompany

Company details

## Example Usage

```typescript
import { CompanyDetailsResponseCompany } from "norberts-spark-sdk/models";

let value: CompanyDetailsResponseCompany = {
  companyId: "123e4567-e89b-12d3-a456-426614174000",
  legalName: "Acme Corporation Ltd.",
  displayName: "Acme Corp",
  status: "active",
  industry: "Technology",
  companySize: 500,
  websiteUrl: "https://acme.com",
  billingCountry: "US",
  timezone: "America/New_York",
  createdAt: new Date("2024-01-15T10:30:00Z"),
  updatedAt: new Date("2024-01-20T14:45:00Z"),
};
```

## Fields

| Field                                                                                         | Type                                                                                          | Required                                                                                      | Description                                                                                   | Example                                                                                       |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `companyId`                                                                                   | *string*                                                                                      | :heavy_check_mark:                                                                            | Unique identifier for the company                                                             | 123e4567-e89b-12d3-a456-426614174000                                                          |
| `legalName`                                                                                   | *string*                                                                                      | :heavy_check_mark:                                                                            | Legal name of the company                                                                     | Acme Corporation Ltd.                                                                         |
| `displayName`                                                                                 | *string*                                                                                      | :heavy_check_mark:                                                                            | Display name of the company                                                                   | Acme Corp                                                                                     |
| `status`                                                                                      | [models.CompanyDetailsResponseStatus](../models/company-details-response-status.md)           | :heavy_check_mark:                                                                            | Current status of the company                                                                 | active                                                                                        |
| `industry`                                                                                    | *string*                                                                                      | :heavy_minus_sign:                                                                            | Industry sector                                                                               | Technology                                                                                    |
| `companySize`                                                                                 | *number*                                                                                      | :heavy_minus_sign:                                                                            | Number of employees                                                                           | 500                                                                                           |
| `websiteUrl`                                                                                  | *string*                                                                                      | :heavy_minus_sign:                                                                            | Company website URL                                                                           | https://acme.com                                                                              |
| `billingCountry`                                                                              | *string*                                                                                      | :heavy_minus_sign:                                                                            | ISO 3166-1 alpha-2 country code                                                               | US                                                                                            |
| `timezone`                                                                                    | *string*                                                                                      | :heavy_check_mark:                                                                            | Company timezone                                                                              | America/New_York                                                                              |
| `createdAt`                                                                                   | [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | :heavy_check_mark:                                                                            | Timestamp when the company record was created                                                 | 2024-01-15T10:30:00Z                                                                          |
| `updatedAt`                                                                                   | [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | :heavy_check_mark:                                                                            | Timestamp when the company record was last updated                                            | 2024-01-20T14:45:00Z                                                                          |