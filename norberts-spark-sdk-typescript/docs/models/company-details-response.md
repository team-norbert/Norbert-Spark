# CompanyDetailsResponse

Structured response containing company and key person details

## Example Usage

```typescript
import { CompanyDetailsResponse } from "norberts-spark-sdk/models";

let value: CompanyDetailsResponse = {
  success: true,
  data: {
    company: {
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
    },
    keyPerson: {
      keyPersonId: "987e6543-e21b-12d3-a456-426614174000",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@acme.com",
      phone: "+1-555-123-4567",
      jobTitle: "Chief Executive Officer",
      isActive: true,
      createdAt: new Date("2024-01-15T10:30:00Z"),
      updatedAt: new Date("2024-01-20T14:45:00Z"),
    },
  },
};
```

## Fields

| Field                                                                           | Type                                                                            | Required                                                                        | Description                                                                     | Example                                                                         |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `success`                                                                       | *boolean*                                                                       | :heavy_check_mark:                                                              | Indicates if the request was successful                                         | true                                                                            |
| `data`                                                                          | [models.CompanyDetailsResponseData](../models/company-details-response-data.md) | :heavy_check_mark:                                                              | Company and key person information                                              |                                                                                 |