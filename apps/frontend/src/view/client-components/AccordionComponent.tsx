'use client'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'

interface AccordionComponentProps {
  header: string
  body: string
}

export const AccordionComponent = ({ body, header }: AccordionComponentProps) => (
  <Accordion>
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      aria-controls="panel-content"
      id="panel-header"
    >
      <Typography>{header}</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Typography>{body}</Typography>
    </AccordionDetails>
  </Accordion>
)
