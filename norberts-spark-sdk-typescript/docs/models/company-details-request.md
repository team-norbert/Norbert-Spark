# CompanyDetailsRequest

Structured request containing company and key person details

## Example Usage

```typescript
import { CompanyDetailsRequest } from 'norberts-spark-sdk/models'

let value: CompanyDetailsRequest = {
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
```

## Fields

| Field       | Type                                                                                     | Required           | Description                |
| ----------- | ---------------------------------------------------------------------------------------- | ------------------ | -------------------------- |
| `company`   | [models.CompanyDetailsRequestCompany](../models/company-details-request-company.md)      | :heavy_minus_sign: | Company details            |
| `keyPerson` | [models.CompanyDetailsRequestKeyPerson](../models/company-details-request-key-person.md) | :heavy_minus_sign: | Key person contact details |
