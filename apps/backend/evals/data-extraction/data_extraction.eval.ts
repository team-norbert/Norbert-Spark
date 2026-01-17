// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true })

import { evalite } from 'evalite'
import { streamText, generateText, Output } from 'ai'
import { google } from '@ai-sdk/google'
import { pdfSchema } from '@norberts-spark/shared'
import type { z } from 'zod'

type ExtractedData = z.infer<typeof pdfSchema>

/**
 * Ground truth for the invoice data extraction
 * This should match the actual content in receipt-1.pdf
 */
interface GroundTruth {
  total: number
  currency: string
  invoiceNumber: string
  companyAddress: string
  companyName: string
  invoiceeAddress: string
}

/**
 * Test cases for invoice data extraction
 */
const testCases: Array<{ pdfPath: string; expected: GroundTruth }> = [
  {
    pdfPath: path.join(__dirname, 'receipt-1.pdf'),
    expected: {
      total: 1770,
      currency: 'GBP',
      invoiceNumber: 'ACME-46006',
      companyAddress: '123 Fictional Street, London, AB1 2CD',
      companyName: 'Acme North Services Ltd',
      invoiceeAddress: 'Sophia Hall, 77 Trial Court, Cambridge, CB2 1TN',
    },
  },
]

/**
 * Extract data from PDF using the same logic as AIExtractDataController
 */
async function extractDataFromPdf(pdfPath: string): Promise<ExtractedData> {
  const buffer = readFileSync(pdfPath)

  const result = streamText({
    model: google(process.env.MODEL_NAME || 'gemini-2.0-flash-exp'),
    system: `You will receive an invoice. Please extract the data from the invoice.`,
    output: Output.object({ schema: pdfSchema }),
    experimental_telemetry: {
      isEnabled: false,
      recordInputs: false,
      recordOutputs: false,
    },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'file',
            data: Buffer.from(buffer),
            mediaType: 'application/pdf',
          },
        ],
      },
    ],
  })

  // Collect the text stream and parse the JSON object
  let extractedText = ''
  for await (const textPart of result.textStream) {
    extractedText += textPart
  }

  // Parse the extracted JSON text
  const extractedData = JSON.parse(extractedText) as ExtractedData

  return extractedData
}

/**
 * Calculate field-level accuracy
 */
function calculateFieldAccuracy(
  extracted: ExtractedData,
  expected: GroundTruth
): Record<string, number> {
  const fieldScores: Record<string, number> = {}

  // Total: exact match (with tolerance for floating point)
  fieldScores.total = Math.abs(extracted.total - expected.total) < 0.01 ? 1 : 0

  // Currency: exact match (case-insensitive)
  fieldScores.currency =
    extracted.currency.toUpperCase() === expected.currency.toUpperCase() ? 1 : 0

  // Invoice Number: exact match (case-insensitive, trimmed)
  fieldScores.invoiceNumber =
    extracted.invoiceNumber.trim().toUpperCase() === expected.invoiceNumber.trim().toUpperCase()
      ? 1
      : 0

  // Company Address: fuzzy match (check if key parts are present)
  fieldScores.companyAddress = fuzzyStringMatch(extracted.companyAddress, expected.companyAddress)

  // Company Name: fuzzy match
  fieldScores.companyName = fuzzyStringMatch(extracted.companyName, expected.companyName)

  // Invoicee Address: fuzzy match
  fieldScores.invoiceeAddress = fuzzyStringMatch(
    extracted.invoiceeAddress,
    expected.invoiceeAddress
  )

  return fieldScores
}

/**
 * Fuzzy string matching with normalized comparison
 */
function fuzzyStringMatch(actual: string, expected: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  const actualNorm = normalize(actual)
  const expectedNorm = normalize(expected)

  // Handle empty strings - return 0 if either is empty
  if (!actualNorm || !expectedNorm) return 0

  // Exact match after normalization
  if (actualNorm === expectedNorm) return 1

  // Check if all words from expected are in actual
  const expectedWords = expectedNorm.split(' ').filter((word) => word.length > 0)
  const actualWords = new Set(actualNorm.split(' ').filter((word) => word.length > 0))

  // Return 0 if no valid words exist in either string
  if (expectedWords.length === 0 || actualWords.size === 0) return 0

  const matchedWords = expectedWords.filter((word) => actualWords.has(word)).length
  const wordMatchRatio = matchedWords / expectedWords.length

  // Check substring containment
  const containsExpected = actualNorm.includes(expectedNorm) ? 1 : 0
  const containsActual = expectedNorm.includes(actualNorm) ? 1 : 0
  const containmentScore = Math.max(containsExpected, containsActual)

  // Return weighted average
  return wordMatchRatio * 0.6 + containmentScore * 0.4
}

/**
 * LLM-as-Judge scorer for overall quality
 */
async function llmJudgeScorer(
  extracted: ExtractedData,
  expected: GroundTruth
): Promise<{ score: number; reasoning: string }> {
  const judgePrompt = `You are evaluating an AI invoice data extraction system.

Expected Data:
- Total: ${expected.total} ${expected.currency}
- Invoice Number: ${expected.invoiceNumber}
- Company Name: ${expected.companyName}
- Company Address: ${expected.companyAddress}
- Invoicee Address: ${expected.invoiceeAddress}

Extracted Data:
- Total: ${extracted.total} ${extracted.currency}
- Invoice Number: ${extracted.invoiceNumber}
- Company Name: ${extracted.companyName}
- Company Address: ${extracted.companyAddress}
- Invoicee Address: ${extracted.invoiceeAddress}

Evaluate the extraction accuracy (0.0-1.0):
- 1.0 = Perfect extraction, all fields correct
- 0.8-0.9 = Excellent, minor formatting differences
- 0.6-0.7 = Good, some fields slightly off
- 0.4-0.5 = Acceptable, several issues
- 0.2-0.3 = Poor, major errors
- 0.0-0.1 = Failed, mostly wrong

Respond in JSON format:
{
  "score": <number between 0 and 1>,
  "reasoning": "<brief explanation>"
}`

  try {
    const result = await generateText({
      model: google(process.env.MODEL_NAME || 'gemini-2.0-flash-exp'),
      prompt: judgePrompt,
    })

    // Try to parse JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        score: Math.max(0, Math.min(1, parsed.score)),
        reasoning: parsed.reasoning || 'No reasoning provided',
      }
    }

    // Fallback: try to extract just the number
    const numberMatch = result.text.match(/\d+\.?\d*/)?.[0]
    if (numberMatch) {
      return {
        score: Math.max(0, Math.min(1, parseFloat(numberMatch))),
        reasoning: 'Extracted score from text',
      }
    }

    throw new Error('Could not parse judge response')
  } catch (error) {
    console.error('LLM Judge error:', error)
    throw error
  }
}

/**
 * Main evalite test
 */
evalite('Invoice Data Extraction', {
  data: async () => {
    return testCases.map((testCase) => ({
      input: testCase.pdfPath,
      expected: testCase.expected,
    }))
  },
  task: async (pdfPath: string) => {
    const extracted = await extractDataFromPdf(pdfPath)
    return extracted
  },
  scorers: [
    {
      name: 'Field Accuracy',
      scorer: async ({ output, expected }) => {
        if (!expected) return { score: 0, passed: false }

        const fieldScores = calculateFieldAccuracy(output, expected)

        // Calculate overall accuracy
        const overallScore =
          Object.values(fieldScores).reduce((sum, score) => sum + score, 0) /
          Object.keys(fieldScores).length

        return {
          score: overallScore,
          passed: overallScore >= 0.75,
          details: {
            fieldScores,
            extracted: output,
            expected,
          },
        }
      },
    },

    {
      name: 'LLM Judge',
      scorer: async ({ output, expected }) => {
        if (!expected) return { score: 0, passed: false }

        const { score, reasoning } = await llmJudgeScorer(output, expected)

        return {
          score,
          passed: score >= 0.75,
          details: {
            reasoning,
            extracted: output,
            expected,
          },
        }
      },
    },

    {
      name: 'Critical Fields (Total, Currency, Invoice #)',
      scorer: async ({ output, expected }) => {
        if (!expected) return { score: 0, passed: false }

        const totalMatch = Math.abs(output.total - expected.total) < 0.01 ? 1 : 0
        const currencyMatch =
          output.currency.toUpperCase() === expected.currency.toUpperCase() ? 1 : 0
        const invoiceNumberMatch =
          output.invoiceNumber.trim().toUpperCase() === expected.invoiceNumber.trim().toUpperCase()
            ? 1
            : 0

        const criticalFieldsScore = (totalMatch + currencyMatch + invoiceNumberMatch) / 3

        return {
          score: criticalFieldsScore,
          passed: criticalFieldsScore >= 0.8,
          details: {
            totalMatch,
            currencyMatch,
            invoiceNumberMatch,
          },
        }
      },
    },
  ],
})
