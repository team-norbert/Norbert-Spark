import { useRouter } from 'next/navigation.js'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import { getCompanyDetailsAction } from '@/infrastructure/serverActions/getCompanyDetails.server.js'
import { updateCompanyDetailsAction } from '@/infrastructure/serverActions/updateCompanyDetails.server.js'

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

// Zod schemas for validation based on CompanyDetailsRequest.json
const CompanySchema = z.object({
  legalName: z
    .string()
    .min(2, 'Legal name must be at least 2 characters')
    .max(200, 'Legal name must not exceed 200 characters'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(200, 'Display name must not exceed 200 characters'),
  status: z.enum(['prospect', 'active', 'paused', 'churned']).optional(),
  industry: z
    .string()
    .max(100, 'Industry must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  companySize: z.number().min(1, 'Company size must be at least 1').optional().or(z.literal('')),
  websiteUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  billingCountry: z
    .string()
    .regex(/^[A-Z]{2}$/, 'Must be a 2-letter country code (e.g., US)')
    .optional()
    .or(z.literal('')),
  timezone: z.string().min(1, 'Timezone is required').optional(),
})

const KeyPersonSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name must be at least 1 character')
    .max(100, 'First name must not exceed 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name must be at least 1 character')
    .max(100, 'Last name must not exceed 100 characters'),
  email: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  phone: z.string().max(30, 'Phone must not exceed 30 characters').optional().or(z.literal('')),
  jobTitle: z
    .string()
    .max(100, 'Job title must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
})

export function useCompanyDetailsForm() {
  const router = useRouter()
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState<CompanyDetailsFormData>({
    companyId: '',
    legalName: '',
    displayName: '',
    status: 'prospect',
    industry: '',
    companySize: '',
    websiteUrl: '',
    billingCountry: '',
    timezone: '',
    keyPersonId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    isActive: true,
  })

  const [errors, setErrors] = useState<CompanyDetailsFormErrors>({
    legalName: '',
    displayName: '',
    status: '',
    industry: '',
    companySize: '',
    websiteUrl: '',
    billingCountry: '',
    timezone: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
  })

  // Fetch existing company details on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getCompanyDetailsAction()
        if (result.success && result.data.company && result.data.keyPerson) {
          const { company, keyPerson } = result.data
          setFormData({
            companyId: company.companyId,
            legalName: company.legalName,
            displayName: company.displayName,
            status: company.status,
            industry: company.industry || '',
            companySize: company.companySize?.toString() || '',
            websiteUrl: company.websiteUrl || '',
            billingCountry: company.billingCountry || '',
            timezone: company.timezone,
            keyPersonId: keyPerson.keyPersonId,
            firstName: keyPerson.firstName,
            lastName: keyPerson.lastName,
            email: keyPerson.email || '',
            phone: keyPerson.phone || '',
            jobTitle: keyPerson.jobTitle || '',
            isActive: keyPerson.isActive,
          })
        } else {
          setGeneralError('Failed to load company details')
        }
      } catch {
        setGeneralError('An error occurred while loading company details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const handleChange =
    (field: keyof CompanyDetailsFormData) => (event: { target: { value: unknown } }) => {
      const value = event.target.value
      setFormData({ ...formData, [field]: value })
      // Clear errors when user starts typing
      setErrors({ ...errors, [field]: '' })
      setGeneralError('')
      setSuccessMessage('')
      // Clear redirect timeout when user starts editing
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
        redirectTimeoutRef.current = null
      }
    }

  const handleCancel = () => {
    // Clear redirect timeout if pending
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }
    router.push('/company-details')
  }

  const validateForm = (): boolean => {
    const newErrors: CompanyDetailsFormErrors = {
      legalName: '',
      displayName: '',
      status: '',
      industry: '',
      companySize: '',
      websiteUrl: '',
      billingCountry: '',
      timezone: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
    }

    // Helper function to set error safely
    const setFieldError = (field: string, message: string) => {
      switch (field) {
        case 'legalName':
          newErrors.legalName = message
          break
        case 'displayName':
          newErrors.displayName = message
          break
        case 'status':
          newErrors.status = message
          break
        case 'industry':
          newErrors.industry = message
          break
        case 'companySize':
          newErrors.companySize = message
          break
        case 'websiteUrl':
          newErrors.websiteUrl = message
          break
        case 'billingCountry':
          newErrors.billingCountry = message
          break
        case 'timezone':
          newErrors.timezone = message
          break
        case 'firstName':
          newErrors.firstName = message
          break
        case 'lastName':
          newErrors.lastName = message
          break
        case 'email':
          newErrors.email = message
          break
        case 'phone':
          newErrors.phone = message
          break
        case 'jobTitle':
          newErrors.jobTitle = message
          break
      }
    }

    // Validate company fields
    const companyData = {
      legalName: formData.legalName,
      displayName: formData.displayName,
      status: formData.status,
      industry: formData.industry || undefined,
      companySize: formData.companySize ? parseInt(formData.companySize, 10) : undefined,
      websiteUrl: formData.websiteUrl || undefined,
      billingCountry: formData.billingCountry || undefined,
      timezone: formData.timezone,
    }

    const companyResult = CompanySchema.safeParse(companyData)
    if (!companyResult.success) {
      companyResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        setFieldError(field, issue.message)
      })
    }

    // Validate key person fields
    const keyPersonData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      jobTitle: formData.jobTitle || undefined,
    }

    const keyPersonResult = KeyPersonSchema.safeParse(keyPersonData)
    if (!keyPersonResult.success) {
      keyPersonResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        setFieldError(field, issue.message)
      })
    }

    setErrors(newErrors)
    return Object.values(newErrors).every((error) => error === '')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) {
      setGeneralError('Please fix the validation errors before submitting')
      return
    }

    setIsSubmitting(true)
    setGeneralError('')
    setSuccessMessage('')

    try {
      const updateData = {
        company: {
          companyId: formData.companyId,
          legalName: formData.legalName,
          displayName: formData.displayName,
          status: formData.status,
          industry: formData.industry || null,
          companySize: formData.companySize ? parseInt(formData.companySize, 10) : null,
          websiteUrl: formData.websiteUrl || null,
          billingCountry: formData.billingCountry || null,
          timezone: formData.timezone,
        },
        keyPerson: {
          keyPersonId: formData.keyPersonId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || null,
          phone: formData.phone || null,
          jobTitle: formData.jobTitle || null,
          isActive: formData.isActive,
        },
      }

      const result = await updateCompanyDetailsAction(updateData)

      if (result.status === 204) {
        setSuccessMessage('Company details updated successfully!')
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' })
        // Clear any existing timeout before scheduling a new one
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current)
        }
        // Redirect after 2 seconds
        redirectTimeoutRef.current = setTimeout(() => {
          router.push('/company-details')
        }, 2000)
      }
      if (!result.success && result.status !== 204) {
        setGeneralError(result.error || 'Failed to update company details')
      }
    } catch {
      setGeneralError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    errors,
    generalError,
    successMessage,
    isLoading,
    isSubmitting,
    handleChange,
    handleSubmit,
    handleCancel,
  }
}
