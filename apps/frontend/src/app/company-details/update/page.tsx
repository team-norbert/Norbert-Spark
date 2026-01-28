'use client'

import { Box, CircularProgress, Container, Typography } from '@mui/material'

import { CompanyDetailsForm } from '@/view/client-components/CompanyDetailsForm.js'
import { useCompanyDetailsForm } from '@/view/hooks/useCompanyDetailsForm.js'

/**
 * Company Details Update page following DDD architecture.
 * This page is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export default function UpdateCompanyDetailsPage() {
  const {
    errors,
    formData,
    generalError,
    handleCancel,
    handleChange,
    handleSubmit,
    isLoading,
    isSubmitting,
    successMessage,
  } = useCompanyDetailsForm()

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading company details...
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <CompanyDetailsForm
      formData={formData}
      errors={errors}
      generalError={generalError}
      successMessage={successMessage}
      onFieldChange={handleChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
    />
  )
}
