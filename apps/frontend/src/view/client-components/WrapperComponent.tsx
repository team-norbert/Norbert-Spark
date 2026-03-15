'use client'
import type { ContainerProps } from '@mui/material'
import { Container } from '@mui/material'
import React from 'react'

export const Wrapper = ({ children, ...rest }: ContainerProps) => {
  return (
    <Container
      maxWidth="md"
      sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 4 }}
      {...rest}
    >
      {children}
    </Container>
  )
}
