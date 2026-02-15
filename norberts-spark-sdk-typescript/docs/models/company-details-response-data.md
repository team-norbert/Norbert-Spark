# CompanyDetailsResponseData

Company and key person information

## Example Usage

```typescript
import { CompanyDetailsResponseData } from "norberts-spark-sdk/models";

let value: CompanyDetailsResponseData = {
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
};
```

## Fields

| Field                                                                                      | Type                                                                                       | Required                                                                                   | Description                                                                                |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `company`                                                                                  | [models.CompanyDetailsResponseCompany](../models/company-details-response-company.md)      | :heavy_check_mark:                                                                         | Company details                                                                            |
| `keyPerson`                                                                                | [models.CompanyDetailsResponseKeyPerson](../models/company-details-response-key-person.md) | :heavy_check_mark:                                                                         | Key person contact details                                                                 |