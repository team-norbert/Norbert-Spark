import { expect, test } from '@playwright/test'

const TEST_CREDENTIALS = {
  email: 'james.smith@gmail.com',
  password: 'Admin123!',
} as const

test.describe.configure({ mode: 'serial' })

test.describe('AI Admin Page - Role-Based Access Control', () => {
  test.beforeEach(async ({ context }) => {
    // Clear all cookies to ensure clean state
    await context.clearCookies()
  })

  //TODO: Enable this test after implementing proper redirect handling for unauthenticated users
  test.skip('should redirect unauthenticated user to signin page', async ({ page }) => {
    // Navigate to AI admin page (a protected route with role requirements)
    await page.goto('/ai-admin')

    // Wait for navigation to complete
    await page.waitForURL(/\/signin/)

    // Verify user is redirected to signin page
    expect(page.url()).toContain('/signin')

    // Verify the callbackUrl parameter preserves the original destination
    const url = new URL(page.url())
    expect(url.searchParams.get('callbackUrl')).toBe('/ai-admin')

    // Verify error parameter indicates unauthorized access
    expect(url.searchParams.get('error')).toBe('unauthorized')

    // Verify signin page elements are visible
    await expect(page.getByRole('heading', { name: /Norbert's Spark/i })).toBeVisible()
  })

  test('should allow admin user to access AI admin page', async ({ page }) => {
    // Sign in as admin user
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Navigate to AI admin page
    await page.goto('/ai-admin')

    // Verify we stay on the AI admin page (not redirected)
    await expect(page).toHaveURL('/ai-admin')

    // Verify the page title/heading is visible
    await expect(page.getByRole('heading', { name: /AI Chat Configuration/i })).toBeVisible()

    // Wait for the data grid to load
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 })

    // Verify the read-only notice is visible
    await expect(
      page.getByText(/Note: This page displays read-only AI chat configuration data/i).first()
    ).toBeVisible()
  })

  test('should display AI chat configuration data in DataGrid', async ({ page }) => {
    // Sign in as admin user
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Navigate to AI admin page
    await page.goto('/ai-admin')

    // Wait for the data grid to load
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 })

    // Wait for data to load - check for either rows or "No rows" message
    await page.waitForFunction(
      () => {
        const grid = document.querySelector('.MuiDataGrid-root')
        if (!grid) return false
        // Check if there are rows or a "no rows" overlay
        const hasRows = grid.querySelectorAll('.MuiDataGrid-row').length > 0
        const hasNoRowsOverlay = grid.querySelector('.MuiDataGrid-overlay')
        return hasRows || hasNoRowsOverlay
      },
      { timeout: 10000 }
    )

    // Verify column headers are present
    const columnHeaders = [
      'Name',
      'Description',
      'SEO Friendly ID',
      'Base64 ID',
      'Created At',
      'Updated At',
    ]

    for (const header of columnHeaders) {
      await expect(
        page.locator('.MuiDataGrid-columnHeaderTitle', { hasText: header })
      ).toBeVisible()
    }
  })

  test('should support search functionality in AI admin page', async ({ page }) => {
    // Sign in as admin user
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Navigate to AI admin page
    await page.goto('/ai-admin')

    // Wait for the page to load
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 })

    // Find the search field
    const searchField = page.getByPlaceholder(/Search by name, description, or SEO ID/i)
    await expect(searchField.last()).toBeVisible()

    // Type a search query
    await searchField.last().fill('general')

    // Wait a moment for debouncing
    await page.waitForTimeout(500)

    // Verify search field has the value
    await expect(searchField.last()).toHaveValue('general')
  })

  test('should support pagination in AI admin page', async ({ page }) => {
    // Sign in as admin user
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Navigate to AI admin page
    await page.goto('/ai-admin')

    // Wait for the data grid to load
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 })

    // Verify pagination controls are present
    await expect(page.locator('.MuiTablePagination-root')).toBeVisible()

    // Verify "Rows per page" dropdown is present
    await expect(page.getByText(/Rows per page/i)).toBeVisible()
  })

  test('should display error message when data fetch fails', async ({ page }) => {
    // Sign in as admin user
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Intercept the API call and force it to fail
    await page.route('**/api/v1/ai/chats/config*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    })

    // Navigate to AI admin page
    await page.goto('/ai-admin')

    // Wait for the error alert to appear
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 })
  })

  test.skip('should allow closing error message', async ({ page }) => {
    // Sign in as admin user
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Intercept the API call and force it to fail
    await page.route('**/api/v1/ai/chats/config*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    })

    // Navigate to AI admin page
    await page.goto('/ai-admin')

    // Wait for the error alert to appear
    const errorAlert = page.getByRole('alert')
    await expect(errorAlert).toBeVisible({ timeout: 10000 })

    // Find and click the close button
    const closeButton = errorAlert.locator('button[aria-label="close"]')
    await closeButton.click()

    // Verify error message is dismissed
    await expect(errorAlert).toBeHidden()
  })

  test('should show loading state initially', async ({ page }) => {
    // Sign in as admin user
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Delay the API response to see loading state
    await page.route('**/api/v1/ai/chats/config*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await route.continue()
    })

    // Navigate to AI admin page
    await page.goto('/ai-admin')

    // Verify loading indicator is shown (the data grid shows loading overlay)
    await expect(page.locator('.MuiDataGrid-root')).toBeVisible()

    // After delay, data should load
    await page.waitForFunction(
      () => {
        const grid = document.querySelector('.MuiDataGrid-root')
        if (!grid) return false
        const hasRows = grid.querySelectorAll('.MuiDataGrid-row').length > 0
        const hasNoRowsOverlay = grid.querySelector('.MuiDataGrid-overlay')
        return hasRows || hasNoRowsOverlay
      },
      { timeout: 15000 }
    )
  })

  test('should navigate to AI options form and verify all form elements', async ({ page }) => {
    // 1. Sign in as admin user
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // 2. Navigate to AI admin page
    await page.goto('/ai-admin')

    // Wait for the data grid to load
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 })

    // Wait for data rows with data-id attribute to appear
    await page.waitForFunction(
      () => {
        const grid = document.querySelector('.MuiDataGrid-root')
        if (!grid) return false
        const rows = grid.querySelectorAll('.MuiDataGrid-row[data-id]')
        return rows.length > 0
      },
      { timeout: 10000 }
    )

    // 3. Get the first row's ID and click the 'change options' button
    const firstRowId = await page.evaluate(() => {
      const firstRow = document.querySelector('.MuiDataGrid-row[data-id]')
      return firstRow?.getAttribute('data-id')
    })

    expect(firstRowId).toBeTruthy()

    const changeOptionsButton = page.getByTestId(`change-options-${firstRowId}`)
    await expect(changeOptionsButton).toBeVisible()
    await changeOptionsButton.click()

    // 4. Verify navigation to the dynamic AI options form page
    await expect(page).toHaveURL(`/ai-admin/${firstRowId}`, { timeout: 10000 })

    // Wait for form to load (check for page title)
    await expect(page.getByRole('heading', { name: /AI Chat Options Configuration/i })).toBeVisible(
      { timeout: 10000 }
    )

    // 5. Verify all form elements are present using data-testid attributes
    const formElements = [
      'prompt-input',
      'max-tokens-input',
      'temperature-input',
      'top-p-input',
      'frequency-penalty-input',
      'presence-penalty-input',
      'top-k-input',
      'stop-sequences-input',
      'seed-input',
      'max-retries-input',
      'save-button',
    ]

    for (const testId of formElements) {
      await expect(page.getByTestId(testId)).toBeVisible({ timeout: 5000 })
    }
  })
})
