import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ExtractedDataDisplay } from '@/view/client-components/ExtractedDataDisplay.js'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const baseData = {
  invoiceNumber: 'INV-2024-001',
  companyName: 'Acme Corporation',
  total: 1500.0,
  currency: 'USD',
  companyAddress: '123 Main Street\nSpringfield, IL 62701',
  invoiceeAddress: '456 Oak Avenue\nShelbyville, TN 38104',
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ExtractedDataDisplay', () => {
  // ── Success header ──────────────────────────────────────────────────────

  describe('success header', () => {
    it('renders the success heading', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      expect(
        screen.getByRole('heading', { name: /data extracted successfully/i })
      ).toBeInTheDocument()
    })
  })

  // ── fileName ────────────────────────────────────────────────────────────

  describe('fileName prop', () => {
    it('displays the filename when provided', () => {
      render(<ExtractedDataDisplay data={baseData} fileName="invoice.pdf" />)

      expect(screen.getByText(/From: invoice\.pdf/i)).toBeInTheDocument()
    })

    it('does not render a "From:" line when fileName is omitted', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      expect(screen.queryByText(/From:/i)).not.toBeInTheDocument()
    })

    it('does not render a "From:" line when fileName is undefined', () => {
      render(<ExtractedDataDisplay data={baseData} fileName={undefined} />)

      expect(screen.queryByText(/From:/i)).not.toBeInTheDocument()
    })
  })

  // ── Invoice number ───────────────────────────────────────────────────────

  describe('invoice number', () => {
    it('renders the Invoice Number label', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      expect(screen.getByText('Invoice Number')).toBeInTheDocument()
    })

    it('renders the invoice number value', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      expect(screen.getByText('INV-2024-001')).toBeInTheDocument()
    })

    it('renders a different invoice number value', () => {
      render(<ExtractedDataDisplay data={{ ...baseData, invoiceNumber: 'PO-9999' }} />)

      expect(screen.getByText('PO-9999')).toBeInTheDocument()
    })
  })

  // ── Total amount ─────────────────────────────────────────────────────────

  describe('total amount', () => {
    it('renders the Total Amount label', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      expect(screen.getByText('Total Amount')).toBeInTheDocument()
    })

    it('renders the total formatted with two decimal places', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      // toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})
      // → "1,500.00" in en-US, but we just check the number part appears somewhere
      expect(screen.getByText(/1[,.]?500[.,]00/)).toBeInTheDocument()
    })

    it('renders an integer total formatted with two decimal places', () => {
      render(<ExtractedDataDisplay data={{ ...baseData, total: 42 }} />)

      expect(screen.getByText(/42[.,]00/)).toBeInTheDocument()
    })

    it('renders the currency chip', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      expect(screen.getByText('USD')).toBeInTheDocument()
    })

    it('renders a different currency chip', () => {
      render(<ExtractedDataDisplay data={{ ...baseData, currency: 'EUR' }} />)

      expect(screen.getByText('EUR')).toBeInTheDocument()
    })
  })

  // ── Company name ──────────────────────────────────────────────────────────

  describe('company name', () => {
    it('renders the Company Name label', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      expect(screen.getByText('Company Name')).toBeInTheDocument()
    })

    it('renders the company name value', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
    })

    it('renders a different company name', () => {
      render(<ExtractedDataDisplay data={{ ...baseData, companyName: 'Globex Inc' }} />)

      expect(screen.getByText('Globex Inc')).toBeInTheDocument()
    })
  })

  // ── Company address ───────────────────────────────────────────────────────

  describe('company address', () => {
    it('renders the Company Address label', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      expect(screen.getByText('Company Address')).toBeInTheDocument()
    })

    it('renders the company address value', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      expect(screen.getByText(/123 Main Street/)).toBeInTheDocument()
      expect(screen.getByText(/Springfield, IL 62701/)).toBeInTheDocument()
    })

    it('renders a different company address', () => {
      render(
        <ExtractedDataDisplay
          data={{ ...baseData, companyAddress: '1 Infinite Loop\nCupertino, CA' }}
        />
      )

      expect(screen.getByText(/1 Infinite Loop/)).toBeInTheDocument()
      expect(screen.getByText(/Cupertino, CA/)).toBeInTheDocument()
    })
  })

  // ── Invoicee address ──────────────────────────────────────────────────────

  describe('invoicee address (Bill To)', () => {
    it('renders the Bill To label', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      expect(screen.getByText('Bill To')).toBeInTheDocument()
    })

    it('renders the invoicee address value', () => {
      render(<ExtractedDataDisplay data={baseData} />)

      expect(screen.getByText(/456 Oak Avenue/)).toBeInTheDocument()
      expect(screen.getByText(/Shelbyville, TN 38104/)).toBeInTheDocument()
    })

    it('renders a different invoicee address', () => {
      render(
        <ExtractedDataDisplay
          data={{ ...baseData, invoiceeAddress: '99 Elm Street\nNew York, NY' }}
        />
      )

      expect(screen.getByText(/99 Elm Street/)).toBeInTheDocument()
      expect(screen.getByText(/New York, NY/)).toBeInTheDocument()
    })
  })

  // ── All fields visible together ───────────────────────────────────────────

  describe('full render', () => {
    it('renders all labels and values together', () => {
      render(<ExtractedDataDisplay data={baseData} fileName="test.pdf" />)

      expect(
        screen.getByRole('heading', { name: /data extracted successfully/i })
      ).toBeInTheDocument()
      expect(screen.getByText(/From: test\.pdf/i)).toBeInTheDocument()
      expect(screen.getByText('Invoice Number')).toBeInTheDocument()
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument()
      expect(screen.getByText('Total Amount')).toBeInTheDocument()
      expect(screen.getByText('USD')).toBeInTheDocument()
      expect(screen.getByText('Company Name')).toBeInTheDocument()
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
      expect(screen.getByText('Company Address')).toBeInTheDocument()
      expect(screen.getByText('Bill To')).toBeInTheDocument()
    })
  })
})
