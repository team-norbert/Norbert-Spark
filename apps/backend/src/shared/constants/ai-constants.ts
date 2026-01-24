import { z } from 'zod'

export const schema = z
  .object({
    total: z.number().describe('The total amount of the invoice.'),
    currency: z.string().describe('The currency of the total amount.'),
    invoiceNumber: z.string().describe('The invoice number.'),
    companyAddress: z
      .string()
      .describe('The address of the company or person issuing the invoice.'),
    companyName: z.string().describe('The name of the company issuing the invoice.'),
    invoiceeAddress: z
      .string()
      .describe('The address of the company or person receiving the invoice.'),
  })
  .describe('The extracted data from the invoice.')
