import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AccordionComponent } from '@/view/client-components/AccordionComponent.js'

describe('AccordionComponent', () => {
  const defaultProps = {
    header: 'Test Header',
    body: 'Test Body Content',
  }

  describe('Rendering', () => {
    it('should render the accordion component', () => {
      const { container } = render(<AccordionComponent {...defaultProps} />)
      const accordion = container.querySelector('.MuiAccordion-root')
      expect(accordion).toBeInTheDocument()
    })

    it('should render the header text', () => {
      render(<AccordionComponent {...defaultProps} />)
      expect(screen.getByText('Test Header')).toBeInTheDocument()
    })

    it('should render the expand icon', () => {
      const { container } = render(<AccordionComponent {...defaultProps} />)
      const expandIcon = container.querySelector('[data-testid="ExpandMoreIcon"]')
      expect(expandIcon).toBeInTheDocument()
    })

    it('should not display body content initially when collapsed', () => {
      render(<AccordionComponent {...defaultProps} />)
      const bodyElement = screen.getByText('Test Body Content')
      // Body is in the DOM but hidden when collapsed
      expect(bodyElement).toBeInTheDocument()
    })

    it('should render with empty header text', () => {
      render(<AccordionComponent header="" body="Body content" />)
      expect(screen.getByText('Body content')).toBeInTheDocument()
    })

    it('should render with empty body text', () => {
      render(<AccordionComponent header="Header text" body="" />)
      expect(screen.getByText('Header text')).toBeInTheDocument()
    })
  })

  describe('Accordion Behavior', () => {
    it('should expand when clicking the accordion summary', () => {
      const { container } = render(<AccordionComponent {...defaultProps} />)

      const accordionSummary = container.querySelector('.MuiAccordionSummary-root')
      expect(accordionSummary).toBeInTheDocument()

      fireEvent.click(accordionSummary!)

      // After clicking, the accordion should expand
      const accordion = container.querySelector('.MuiAccordion-root')
      expect(accordion).toHaveClass('Mui-expanded')
    })

    it('should toggle expansion state on multiple clicks', () => {
      const { container } = render(<AccordionComponent {...defaultProps} />)

      const accordionSummary = container.querySelector('.MuiAccordionSummary-root')
      expect(accordionSummary).toBeInTheDocument()

      fireEvent.click(accordionSummary!)
      let accordion = container.querySelector('.MuiAccordion-root')
      expect(accordion).toHaveClass('Mui-expanded')

      // Second click - collapse

      fireEvent.click(accordionSummary!)
      accordion = container.querySelector('.MuiAccordion-root')
      expect(accordion).not.toHaveClass('Mui-expanded')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-controls attribute', () => {
      const { container } = render(<AccordionComponent {...defaultProps} id="panel" />)
      const accordionSummary = container.querySelector('.MuiAccordionSummary-root')
      expect(accordionSummary).toHaveAttribute('aria-controls', 'panel-content')
    })

    it('should have proper id attribute on summary', () => {
      const { container } = render(<AccordionComponent {...defaultProps} id="panel" />)
      const accordionSummary = container.querySelector('.MuiAccordionSummary-root')
      expect(accordionSummary).toHaveAttribute('id', 'panel-header')
    })

    it('should be keyboard accessible', () => {
      const { container } = render(<AccordionComponent {...defaultProps} />)

      const accordionSummary = container.querySelector('.MuiAccordionSummary-root')
      expect(accordionSummary).toBeInTheDocument()

      // Click to expand (simulates keyboard interaction)
      fireEvent.click(accordionSummary!)
      const accordion = container.querySelector('.MuiAccordion-root')
      expect(accordion).toHaveClass('Mui-expanded')
    })
  })

  describe('Content Display', () => {
    it('should render long header text correctly', () => {
      const longHeader = 'This is a very long header text '.repeat(10)
      const { container } = render(<AccordionComponent header={longHeader} body="Body" />)
      const paragraph = container.querySelector('.MuiAccordionSummary-content p')
      expect(paragraph?.textContent).toBe(longHeader)
    })

    it('should render long body text correctly', () => {
      const longBody = 'This is a very long body text '.repeat(10)
      const { container } = render(<AccordionComponent header="Header" body={longBody} />)
      const typographyEl = container.querySelector('.MuiAccordionDetails-root .MuiTypography-root')
      expect(typographyEl?.textContent).toBe(longBody)
    })

    it('should render special characters in header', () => {
      render(<AccordionComponent header="Header with <>&" body="Body" />)
      expect(screen.getByText('Header with <>&')).toBeInTheDocument()
    })

    it('should render special characters in body', () => {
      render(<AccordionComponent header="Header" body="Body with <>&" />)
      expect(screen.getByText('Body with <>&')).toBeInTheDocument()
    })
  })

  describe('Material UI Components', () => {
    it('should render MUI AccordionSummary', () => {
      const { container } = render(<AccordionComponent {...defaultProps} />)
      const accordionSummary = container.querySelector('.MuiAccordionSummary-root')
      expect(accordionSummary).toBeInTheDocument()
    })

    it('should render MUI AccordionDetails', () => {
      const { container } = render(<AccordionComponent {...defaultProps} />)
      const accordionDetails = container.querySelector('.MuiAccordionDetails-root')
      expect(accordionDetails).toBeInTheDocument()
    })

    it('should render Typography components', () => {
      const { container } = render(<AccordionComponent {...defaultProps} />)
      const typographies = container.querySelectorAll('.MuiTypography-root')
      // Should have at least 2 Typography components (header and body)
      expect(typographies.length).toBeGreaterThanOrEqual(2)
    })
  })
})
