'use client'

import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Box, Card, CardContent, Chip, Divider, Paper, Typography } from '@mui/material'
import type { pdfSchema } from '@norberts-spark/shared'
import type { z } from 'zod'

type ExtractedInvoiceData = z.infer<typeof pdfSchema>

interface ExtractedDataDisplayProps {
  data: ExtractedInvoiceData
  fileName?: string
}

/**
 * Component to display extracted invoice data from PDF files.
 * Renders structured data including invoice number, company info, and amounts.
 *
 * @param {ExtractedDataDisplayProps} props - Component properties
 * @param {ExtractedInvoiceData | null} props.data - The extracted invoice data
 * @param {string} [props.fileName] - Optional filename for display
 *
 * @example
 * ```tsx
 * <ExtractedDataDisplay
 *   data={{
 *     invoiceNumber: "INV-001",
 *     companyName: "Acme Corp",
 *     total: 1500.00,
 *     currency: "USD"
 *   }}
 *   fileName="invoice.pdf"
 * />
 * ```
 */
export function ExtractedDataDisplay({ data, fileName }: ExtractedDataDisplayProps) {
  return (
    <Card
      elevation={2}
      sx={{
        mb: 3,
        border: 1,
        borderColor: 'success.light',
        backgroundColor: 'success.50',
      }}
      className="extracted-data-display"
      data-testid="extracted-data-display"
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
          <Typography variant="h6" component="h2" color="success.main">
            Data Extracted Successfully
          </Typography>
        </Box>

        {fileName && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            From: {fileName}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Invoice Number and Total Amount Row */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'background.paper' }}>
                <Typography variant="caption" color="text.secondary">
                  Invoice Number
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {data.invoiceNumber}
                </Typography>
              </Paper>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'background.paper' }}>
                <Typography variant="caption" color="text.secondary">
                  Total Amount
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {data.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                  <Chip label={data.currency} size="small" color="primary" variant="outlined" />
                </Box>
              </Paper>
            </Box>
          </Box>

          {/* Company Name */}
          <Paper elevation={0} sx={{ p: 2, backgroundColor: 'background.paper' }}>
            <Typography variant="caption" color="text.secondary">
              Company Name
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {data.companyName}
            </Typography>
          </Paper>

          {/* Company Address and Invoicee Address Row */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'background.paper' }}>
                <Typography variant="caption" color="text.secondary">
                  Company Address
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {data.companyAddress}
                </Typography>
              </Paper>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'background.paper' }}>
                <Typography variant="caption" color="text.secondary">
                  Bill To
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {data.invoiceeAddress}
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
