'use client'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import { type ReactNode, useId } from 'react'

interface AccordionComponentProps {
  header: string
  body: ReactNode
  id?: string
}

export const AccordionComponent = ({ body, header, id }: AccordionComponentProps) => {
  const reactId = useId()
  const baseId = id ?? reactId
  const headerId = `${baseId}-header`
  const contentId = `${baseId}-content`

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={contentId} id={headerId}>
        <Typography className="accordion-header">{header}</Typography>
      </AccordionSummary>
      <AccordionDetails id={contentId}>
        <Typography>{body}</Typography>
      </AccordionDetails>
    </Accordion>
  )
}
