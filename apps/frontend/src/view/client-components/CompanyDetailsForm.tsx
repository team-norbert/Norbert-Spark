'use client'

import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import React from 'react'

import { PageHeader } from './PageHeader.js'

interface CompanyDetailsFormData {
  // Company fields
  companyId: string
  legalName: string
  displayName: string
  status: 'prospect' | 'active' | 'paused' | 'churned'
  industry: string
  companySize: string
  websiteUrl: string
  billingCountry: string
  timezone: string

  // Key person fields
  keyPersonId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  jobTitle: string
  isActive: boolean
}

interface CompanyDetailsFormErrors {
  legalName: string
  displayName: string
  status: string
  industry: string
  companySize: string
  websiteUrl: string
  billingCountry: string
  timezone: string
  firstName: string
  lastName: string
  email: string
  phone: string
  jobTitle: string
}

interface CompanyDetailsFormProps {
  readonly formData: CompanyDetailsFormData
  readonly errors: CompanyDetailsFormErrors
  readonly generalError?: string
  readonly successMessage?: string
  readonly onFieldChange: (
    field: keyof CompanyDetailsFormData
  ) => (event: { target: { value: unknown } }) => void
  readonly onSubmit: (event: React.FormEvent) => void
  readonly onCancel: () => void
  readonly onNavigateHome: () => void
  readonly onSignOut: () => void
  readonly isSubmitting?: boolean
}

/**
 * CompanyDetailsForm - Presentational component for updating company and key person details.
 * Follows DDD architecture View layer principles - pure presentation with no business logic.
 */
export function CompanyDetailsForm({
  errors,
  formData,
  generalError,
  isSubmitting,
  onCancel,
  onFieldChange,
  onNavigateHome,
  onSignOut,
  onSubmit,
  successMessage,
}: CompanyDetailsFormProps) {
  return (
    <Container maxWidth="md" id="company-details-form" data-testid="company-details-form">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          py: 4,
        }}
      >
        <header>
          <PageHeader
            title="Update Company Details"
            onNavigateHome={onNavigateHome}
            onSignOut={onSignOut}
          />
        </header>

        {generalError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {generalError}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={onSubmit} noValidate>
          {/* Company Information Section */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              sx={{ mb: 2, color: 'primary.main' }}
              data-testid="company-information-heading"
            >
              Company Information
            </Typography>

            <TextField
              sx={{ display: 'none' }}
              type="hidden"
              value={formData.companyId}
              onChange={onFieldChange('companyId')}
            />

            <TextField
              fullWidth
              label="Legal Name"
              value={formData.legalName}
              onChange={onFieldChange('legalName')}
              error={!!errors.legalName}
              helperText={errors.legalName || 'Legal name of the company (2-200 characters)'}
              margin="normal"
              required
              sx={{ mb: 2 }}
              data-testid="legal-name-input"
            />

            <TextField
              fullWidth
              label="Display Name"
              value={formData.displayName}
              onChange={onFieldChange('displayName')}
              error={!!errors.displayName}
              helperText={errors.displayName || 'Display name of the company (2-200 characters)'}
              margin="normal"
              required
              sx={{ mb: 2 }}
              data-testid="display-name-input"
            />

            <FormControl fullWidth margin="normal" required sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => onFieldChange('status')(e as any)}
                error={!!errors.status}
                data-testid="status-select"
              >
                <MenuItem value="prospect">Prospect</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="churned">Churned</MenuItem>
              </Select>
              {errors.status && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {errors.status}
                </Typography>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="Industry"
              value={formData.industry}
              onChange={onFieldChange('industry')}
              error={!!errors.industry}
              helperText={errors.industry || 'Industry sector (optional, max 100 characters)'}
              margin="normal"
              sx={{ mb: 2 }}
              data-testid="industry-input"
            />

            <TextField
              fullWidth
              label="Company Size"
              type="number"
              value={formData.companySize}
              onChange={onFieldChange('companySize')}
              error={!!errors.companySize}
              helperText={errors.companySize || 'Number of employees (optional, minimum 1)'}
              margin="normal"
              inputProps={{ min: 1 }}
              sx={{ mb: 2 }}
              data-testid="company-size-input"
            />

            <TextField
              fullWidth
              label="Website URL"
              value={formData.websiteUrl}
              onChange={onFieldChange('websiteUrl')}
              error={!!errors.websiteUrl}
              helperText={errors.websiteUrl || 'Company website (optional, must be valid URL)'}
              margin="normal"
              placeholder="https://example.com"
              sx={{ mb: 2 }}
              data-testid="website-url-input"
            />

            <TextField
              fullWidth
              label="Billing Country"
              value={formData.billingCountry}
              onChange={onFieldChange('billingCountry')}
              error={!!errors.billingCountry}
              helperText={
                errors.billingCountry || 'ISO 3166-1 alpha-2 country code (optional, e.g., US, GB)'
              }
              margin="normal"
              inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
              sx={{ mb: 2 }}
              data-testid="billing-country-input"
            />

            <TextField
              fullWidth
              label="Timezone"
              value={formData.timezone}
              onChange={onFieldChange('timezone')}
              error={!!errors.timezone}
              helperText={errors.timezone || 'Company timezone (e.g., America/New_York)'}
              margin="normal"
              required
              sx={{ mb: 2 }}
              data-testid="timezone-input"
            />
          </Paper>

          {/* Key Person Section */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              sx={{ mb: 2, color: 'primary.main' }}
            >
              Key Person Contact
            </Typography>

            <TextField
              sx={{ display: 'none' }}
              type="hidden"
              value={formData.keyPersonId}
              onChange={onFieldChange('keyPersonId')}
            />

            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={onFieldChange('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName || 'First name (1-100 characters)'}
              margin="normal"
              required
              sx={{ mb: 2 }}
              data-testid="first-name-input"
            />

            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={onFieldChange('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName || 'Last name (1-100 characters)'}
              margin="normal"
              required
              sx={{ mb: 2 }}
              data-testid="last-name-input"
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={onFieldChange('email')}
              error={!!errors.email}
              helperText={errors.email || 'Email address (optional)'}
              margin="normal"
              sx={{ mb: 2 }}
              data-testid="email-input"
            />

            <TextField
              fullWidth
              label="Phone"
              value={formData.phone}
              onChange={onFieldChange('phone')}
              error={!!errors.phone}
              helperText={errors.phone || 'Phone number (optional, max 30 characters)'}
              margin="normal"
              sx={{ mb: 2 }}
              data-testid="phone-input"
            />

            <TextField
              fullWidth
              label="Job Title"
              value={formData.jobTitle}
              onChange={onFieldChange('jobTitle')}
              error={!!errors.jobTitle}
              helperText={errors.jobTitle || 'Job title (optional, max 100 characters)'}
              margin="normal"
              sx={{ mb: 2 }}
              data-testid="job-title-input"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    onFieldChange('isActive')({
                      target: { value: e.target.checked },
                    } as any)
                  }
                />
              }
              label="Active Status"
              sx={{ mt: 1 }}
            />
          </Paper>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isSubmitting}
              sx={{ minWidth: 120 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ minWidth: 120 }}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
