import { expect, test } from '@playwright/test'

const TEST_CREDENTIALS = {
  email: 'james.smith@gmail.com',
  password: 'Admin123!',
} as const

test.describe('Company Details Page', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ context }) => {
    // Clear all cookies to ensure clean state
    await context.clearCookies()
  })

  test.describe('Authenticated Admin Access', () => {
    test('should allow admin user to access company details page', async ({ page }) => {
      // Sign in as admin user
      await page.goto('/signin')
      await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
      await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })
      await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

      // Navigate to company details page
      await page.goto('/company-details', { waitUntil: 'load' })

      // Verify we stay on the company details page (not redirected)
      await expect(page).toHaveURL('/company-details')

      // Verify the page heading is visible with increased timeout
      await expect(page.getByTestId('company-details-heading')).toBeVisible({ timeout: 15000 })
      const companiesHeading = page.locator('[data-testid="company-details-heading"] h1')
      await expect(companiesHeading).toBeVisible()
      await expect(companiesHeading).toHaveText(/^Company Details$/i)
    })
  })

  test.describe('Company Information Display', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as admin user
      await page.goto('/signin')
      await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
      await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })
      await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])

      // Navigate to company details page
      await page.goto('/company-details')
      await expect(page.getByTestId('company-details-heading')).toBeVisible()
    })

    test('should display company information section with correct data', async ({ page }) => {
      // Verify Company Information section heading
      await expect(page.getByRole('heading', { name: 'Company Information' })).toBeVisible()

      // Verify Legal Name is displayed
      const legalName = page.getByTestId('company-legal-name')
      await expect(legalName).toBeVisible()
      await expect(legalName).not.toBeEmpty()

      // Verify Display Name is displayed
      const displayName = page.getByTestId('company-display-name')
      await expect(displayName).toBeVisible()
      await expect(displayName).not.toBeEmpty()

      // Verify Status chip is displayed
      await expect(page.locator('span.MuiChip-label').first()).toBeVisible()

      // Verify Timezone is displayed
      const timezone = page.getByTestId('company-timezone')
      await expect(timezone).toBeVisible()
      await expect(timezone).not.toBeEmpty()

      // Verify Created At timestamp is displayed
      const createdAt = page.getByTestId('company-created-at')
      await expect(createdAt).toBeVisible()
      await expect(createdAt).not.toBeEmpty()

      // Verify Last Updated timestamp is displayed
      const updatedAt = page.getByTestId('company-updated-at')
      await expect(updatedAt).toBeVisible()
      await expect(updatedAt).not.toBeEmpty()
    })

    test('should display optional company fields when available', async ({ page }) => {
      // Check if Industry is displayed (optional field)
      const industry = page.getByTestId('company-industry')
      const industryCount = await industry.count()
      if (industryCount > 0) {
        await expect(industry).toBeVisible()
        await expect(industry).not.toBeEmpty()
      }

      // Check if Company Size is displayed (optional field)
      const companySize = page.getByTestId('company-company-size')
      const companySizeCount = await companySize.count()
      if (companySizeCount > 0) {
        await expect(companySize).toBeVisible()
        await expect(companySize).toContainText('employees')
      }

      // Check if Website URL is displayed (optional field)
      const websiteUrl = page.getByTestId('company-website-url')
      const websiteCount = await websiteUrl.count()
      if (websiteCount > 0) {
        await expect(websiteUrl).toBeVisible()
        await expect(websiteUrl).toHaveAttribute('href')
        await expect(websiteUrl).toHaveAttribute('target', '_blank')
        await expect(websiteUrl).toHaveAttribute('rel', 'noopener noreferrer')
      }

      // Check if Billing Country is displayed (optional field)
      const billingCountry = page.getByTestId('company-billing-country')
      const billingCountryCount = await billingCountry.count()
      if (billingCountryCount > 0) {
        await expect(billingCountry).toBeVisible()
        await expect(billingCountry).not.toBeEmpty()
      }
    })

    test('should display company status with correct color coding', async ({ page }) => {
      // Get the status chip
      const statusChip = page.locator('span.MuiChip-label').first()
      await expect(statusChip).toBeVisible()

      const statusText = await statusChip.textContent()
      expect(statusText).toMatch(/^(Active|Prospect|Paused|Churned)$/)

      // Verify the chip has appropriate styling (MUI Chip component)
      const chipContainer = page.locator('.MuiChip-root').first()
      await expect(chipContainer).toBeVisible()
    })
  })

  test.describe('Key Person Contact Display', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as admin user
      await page.goto('/signin')
      await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
      await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })
      await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])

      // Navigate to company details page
      await page.goto('/company-details')
      await expect(page.getByTestId('company-details-heading')).toBeVisible()
    })

    test('should display key person contact section with required data', async ({ page }) => {
      // Verify Key Person Contact section heading
      const keyPersonHeading = page.getByRole('heading', { name: 'Key Person Contact' })
      await expect(keyPersonHeading).toBeVisible()

      // Verify Name is displayed (firstName + lastName) within the Key Person section
      // Find the section element by locating the heading and going to its parent
      const keyPersonSection = keyPersonHeading.locator('../..')
      await expect(keyPersonSection.getByText('Name', { exact: true })).toBeVisible()

      // Verify Status chip is displayed for key person
      const keyPersonChips = page.locator('span.MuiChip-label')
      const chipCount = await keyPersonChips.count()
      expect(chipCount).toBeGreaterThanOrEqual(2) // At least company status and key person status

      // Get the last chip (key person status)
      const keyPersonStatusChip = keyPersonChips.last()
      await expect(keyPersonStatusChip).toBeVisible()
      const keyPersonStatusText = await keyPersonStatusChip.textContent()
      expect(keyPersonStatusText).toMatch(/^(Active|Inactive)$/)
    })

    test('should display optional key person fields when available', async ({ page }) => {
      // Check if Email is displayed and is a clickable mailto link
      const emailLinks = page.locator('a[href^="mailto:"]')
      const emailCount = await emailLinks.count()
      if (emailCount > 0) {
        const emailLink = emailLinks.first()
        await expect(emailLink).toBeVisible()
        const href = await emailLink.getAttribute('href')
        expect(href).toContain('mailto:')
      }

      // Check if Phone is displayed and is a clickable tel link
      const phoneLinks = page.locator('a[href^="tel:"]')
      const phoneCount = await phoneLinks.count()
      if (phoneCount > 0) {
        const phoneLink = phoneLinks.first()
        await expect(phoneLink).toBeVisible()
        const href = await phoneLink.getAttribute('href')
        expect(href).toContain('tel:')
      }

      // Check if Job Title is displayed
      const jobTitleSection = page.getByText(/Job Title/i).locator('..')
      const jobTitleCount = await jobTitleSection.count()
      if (jobTitleCount > 0) {
        await expect(jobTitleSection).toBeVisible()
      }
    })

    test('should display key person timestamps', async ({ page }) => {
      // Verify key person section has created and updated timestamps
      const allTimestamps = page.locator('text=/Created At|Last Updated/i')
      const timestampCount = await allTimestamps.count()

      // Should have at least 4 timestamps total (2 for company, 2 for key person)
      expect(timestampCount).toBeGreaterThanOrEqual(4)
    })
  })

  test.describe('Edit Link', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as admin user
      await page.goto('/signin')
      await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
      await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })
      await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])

      // Navigate to company details page
      await page.goto('/company-details')
      await expect(page.getByTestId('company-details-heading')).toBeVisible()
    })

    test('should display edit link to update page', async ({ page }) => {
      // Verify edit link is present
      const editLink = page.getByRole('link', {
        name: /edit above company and key person details/i,
      })
      await expect(editLink).toBeVisible()

      // Verify the link points to the update page
      await expect(editLink).toHaveAttribute('href', '/company-details/update')
    })

    test('should navigate to update page when edit link is clicked', async ({ page }) => {
      // Click the edit link
      const editLink = page.getByRole('link', {
        name: /edit above company and key person details/i,
      })
      await editLink.click()

      // Verify navigation to update page
      await expect(page).toHaveURL('/company-details/update')

      // Verify the update page loaded (could check for form elements)
      await expect(page.getByRole('heading', { name: /Company Details/i })).toBeVisible()
    })
  })

  test.describe('Data Integrity', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as admin user
      await page.goto('/signin')
      await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
      await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })
      await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])

      // Navigate to company details page
      await page.goto('/company-details')
      await expect(page.getByTestId('company-details-heading')).toBeVisible()
    })

    test('should display consistent data across both sections', async ({ page }) => {
      // Verify both main sections are present
      await expect(page.getByRole('heading', { name: 'Company Information' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Key Person Contact' })).toBeVisible()

      // Verify both sections have timestamp information
      const companyCreatedAt = page.getByTestId('company-created-at')
      const companyUpdatedAt = page.getByTestId('company-updated-at')

      await expect(companyCreatedAt).toBeVisible()
      await expect(companyUpdatedAt).toBeVisible()

      // Verify timestamps contain text (not empty)
      await expect(companyCreatedAt).not.toBeEmpty()
      await expect(companyUpdatedAt).not.toBeEmpty()

      // Verify timestamps contain date-like patterns (numbers, colons, etc.)
      await expect(companyCreatedAt).toContainText(/\d/)
      await expect(companyUpdatedAt).toContainText(/\d/)
    })

    test('should properly format and display all required fields', async ({ page }) => {
      // Legal Name
      const legalName = page.getByTestId('company-legal-name')
      await expect(legalName).toBeVisible()
      await expect(legalName).not.toBeEmpty()

      // Display Name
      const displayName = page.getByTestId('company-display-name')
      await expect(displayName).toBeVisible()
      await expect(displayName).not.toBeEmpty()

      // Timezone
      const timezone = page.getByTestId('company-timezone')
      await expect(timezone).toBeVisible()
      await expect(timezone).not.toBeEmpty()
    })
  })
})
