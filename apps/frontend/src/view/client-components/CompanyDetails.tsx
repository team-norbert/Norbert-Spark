'use client'
import { Box, Chip, Container, Divider, Link, Paper, Typography } from '@mui/material'
import { UtcDate } from '@norberts-spark/shared'

import type {
  CompanyDetails as CompanyDetailsType,
  KeyPersonDetails,
} from '@/infrastructure/serverActions/getCompanyDetails.server.js'

import { PageHeader } from './PageHeader.js'

function formatUtcDate(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return UtcDate.create(value).toDate().toLocaleString()
  } catch {
    return ''
  }
}

interface CompanyDetailsProps {
  company: CompanyDetailsType | null
  keyPerson: KeyPersonDetails | null
  isLoading: boolean
  error: string | null
  onNavigateHome: () => void
  onSignOut: () => void
}

/**
 * Company Details presentational component.
 * Pure presentation component that receives all data and callbacks as props.
 * No business logic - follows DDD architecture View layer principles.
 */
export function CompanyDetails({
  company,
  error,
  isLoading,
  keyPerson,
  onNavigateHome,
  onSignOut,
}: CompanyDetailsProps) {
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Company Details
        </Typography>
        <Typography color="text.secondary">Loading company details...</Typography>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          fontWeight="bold"
          data-testid="error-heading"
        >
          Company Details
        </Typography>
        <Typography color="error">Error: {error}</Typography>
      </Container>
    )
  }

  if (!company || !keyPerson) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          fontWeight="bold"
          data-testid="no-data-heading"
        >
          Company Details
        </Typography>
        <Typography color="text.secondary">No company or key person data available.</Typography>
      </Container>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'prospect':
        return 'info'
      case 'paused':
        return 'warning'
      case 'churned':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }} id="company-details" data-testid="company-details">
      <header data-testid="company-details-heading">
        <PageHeader title="Company Details" onNavigateHome={onNavigateHome} onSignOut={onSignOut} />
      </header>

      {/* Company Information Section */}
      <Box component="section" sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" color="primary" gutterBottom sx={{ mb: 2 }}>
          Company Information
        </Typography>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                Legal Name
              </Typography>
              <Typography variant="body1" data-testid="company-legal-name">
                {company.legalName}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                Display Name
              </Typography>
              <Typography variant="body1" data-testid="company-display-name">
                {company.displayName}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                Status
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                  color={getStatusColor(company.status)}
                  size="small"
                />
              </Box>
            </Box>

            {company.industry && (
              <Box>
                <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                  Industry
                </Typography>
                <Typography variant="body1" data-testid="company-industry">
                  {company.industry}
                </Typography>
              </Box>
            )}

            {company.companySize != null && (
              <Box>
                <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                  Company Size
                </Typography>
                <Typography variant="body1" data-testid="company-company-size">
                  {company.companySize} employees
                </Typography>
              </Box>
            )}

            {company.websiteUrl && (
              <Box>
                <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                  Website
                </Typography>
                <Link
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  data-testid="company-website-url"
                >
                  {company.websiteUrl}
                </Link>
              </Box>
            )}

            {company.billingCountry && (
              <Box>
                <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                  Billing Country
                </Typography>
                <Typography variant="body1" data-testid="company-billing-country">
                  {company.billingCountry}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                Timezone
              </Typography>
              <Typography variant="body1" data-testid="company-timezone">
                {company.timezone}
              </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="medium">
                  Created At
                </Typography>
                <Typography variant="body1" data-testid="company-created-at">
                  {formatUtcDate(company.createdAt)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="medium">
                  Last Updated
                </Typography>
                <Typography variant="body1" data-testid="company-updated-at">
                  {formatUtcDate(company.updatedAt)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Key Person Section */}
      <Box component="section" sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" color="primary" gutterBottom sx={{ mb: 2 }}>
          Key Person Contact
        </Typography>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                Name
              </Typography>
              <Typography variant="body1">
                {keyPerson.firstName} {keyPerson.lastName}
              </Typography>
            </Box>

            {keyPerson.email && (
              <Box>
                <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                  Email
                </Typography>
                <Link href={`mailto:${keyPerson.email}`} underline="hover">
                  {keyPerson.email}
                </Link>
              </Box>
            )}

            {keyPerson.phone && (
              <Box>
                <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                  Phone
                </Typography>
                <Link href={`tel:${keyPerson.phone}`} underline="hover">
                  {keyPerson.phone}
                </Link>
              </Box>
            )}

            {keyPerson.jobTitle && (
              <Box>
                <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                  Job Title
                </Typography>
                <Typography variant="body1">{keyPerson.jobTitle}</Typography>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                Status
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={keyPerson.isActive ? 'Active' : 'Inactive'}
                  color={keyPerson.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="medium">
                  Created At
                </Typography>
                <Typography variant="body1">
                  {formatUtcDate(keyPerson.createdAt)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="medium">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {formatUtcDate(keyPerson.updatedAt)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Link to edit data */}
      <Box component="section" sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" color="primary" gutterBottom sx={{ mb: 2 }}>
          <Link href="/company-details/update" underline="hover">
            Edit above company and key person details
          </Link>
        </Typography>
      </Box>
    </Container>
  )
}
