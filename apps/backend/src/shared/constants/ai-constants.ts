import { z } from 'zod'
export const PROMPT = `You are a literary expert on Joseph Conrad's "Heart of Darkness". IMPORTANT: You MUST use the heartOfDarknessQA tool to look up the answer in the actual text. Do NOT answer from memory - always consult the tool first. After receiving the tool result, provide a direct, concise answer (1-3 sentences) based on the text.`

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
