# CompanyDetailsRequestKeyPerson

Key person contact details

## Example Usage

```typescript
import { CompanyDetailsRequestKeyPerson } from 'norberts-spark-sdk/models'

let value: CompanyDetailsRequestKeyPerson = {
  keyPersonId: '987e6543-e21b-12d3-a456-426614174000',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@acme.com',
  phone: '+1-555-123-4567',
  jobTitle: 'Chief Executive Officer',
  isActive: true,
}
```

## Fields

| Field         | Type      | Required           | Description                                                                                                                                                   | Example                              |
| ------------- | --------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `keyPersonId` | _string_  | :heavy_check_mark: | Unique identifier for the key person                                                                                                                          | 987e6543-e21b-12d3-a456-426614174000 |
| `firstName`   | _string_  | :heavy_minus_sign: | First name of the key person                                                                                                                                  | John                                 |
| `lastName`    | _string_  | :heavy_minus_sign: | Last name of the key person                                                                                                                                   | Doe                                  |
| `email`       | _string_  | :heavy_minus_sign: | Email address (case-insensitive)                                                                                                                              | john.doe@acme.com                    |
| `phone`       | _string_  | :heavy_minus_sign: | Phone number                                                                                                                                                  | +1-555-123-4567                      |
| `jobTitle`    | _string_  | :heavy_minus_sign: | Job title                                                                                                                                                     | Chief Executive Officer              |
| `isActive`    | _boolean_ | :heavy_minus_sign: | Whether the key person is currently active. This field has a database default of true and will always be present in responses unless explicitly set to false. | true                                 |
