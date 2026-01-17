# Invoice Data Extraction Eval

This evaluation tests the accuracy of the AI-powered invoice data extraction system implemented in `AIExtractDataController`.

## What It Tests

The eval measures how accurately the system extracts structured data from invoice PDFs, specifically:

- **Total amount** (numeric value)
- **Currency** (e.g., USD, EUR)
- **Invoice number** (alphanumeric identifier)
- **Company name** (issuer of invoice)
- **Company address** (issuer address)
- **Invoicee address** (recipient address)

## Test Data

- **PDF file**: `receipt-1.pdf` - Sample invoice document
- **Ground truth**: Hardcoded expected values in `data_extraction.eval.ts`

## Scoring Methods

The eval uses three complementary scorers:

### 1. Field Accuracy (Rule-based)

- Compares each field individually with fuzzy matching
- Uses exact match for numeric/currency fields
- Uses normalized string matching for addresses/names
- Returns overall accuracy across all fields
- **Pass threshold**: ≥ 0.75

### 2. LLM Judge

- Uses Gemini model to evaluate extraction quality holistically
- Considers formatting, completeness, and semantic accuracy
- Returns score (0-1) with reasoning
- **Pass threshold**: ≥ 0.75

### 3. Critical Fields

- Focuses on the most important fields: total, currency, invoice number
- Uses exact matching (case-insensitive, trimmed)
- **Pass threshold**: ≥ 0.8

## Running the Eval

```bash
cd apps/backend
pnpm eval
```

## Updating Ground Truth

**IMPORTANT**: Before running the eval, update the `expected` values in `data_extraction.eval.ts` to match the actual content of `receipt-1.pdf`.

To update:

1. Open `receipt-1.pdf` and manually extract the correct values
2. Update the `expected` object in `testCases` array
3. Run the eval

## Adding More Test Cases

To add additional PDFs to test:

1. Add PDF file to `apps/backend/evals/data-extraction/`
2. Add new object to `testCases` array:

```typescript
{
  pdfPath: path.join(__dirname, 'your-invoice.pdf'),
  expected: {
    total: 500.0,
    currency: 'EUR',
    // ... other fields
  },
}
```

## Implementation Details

The eval replicates the exact extraction logic from `AIExtractDataController`:

- Uses `streamText` with `Output.object({ schema: pdfSchema })`
- Same system prompt: "You will receive an invoice. Please extract the data from the invoice."
- Same model configuration (respects `MODEL_NAME` env var)
- Streams text and parses JSON output

## Environment Variables

Requires:

- `MODEL_NAME` - Gemini model name (defaults to `gemini-2.0-flash-exp`)
- Google API credentials configured in `.env`
