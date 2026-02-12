import { expect, test } from '@playwright/test'

const TEST_CREDENTIALS = {
  email: 'james.smith@gmail.com',
  password: 'Admin123!',
} as const

test.describe('Admin Page - Delete Users', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies before each test
    await context.clearCookies()
  })

  test('should display cancel dialog and dismiss when cancel button is clicked', async ({
    page,
  }) => {
    // Step 1: Sign in as admin and navigate to dashboard
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Step 2: Navigate to admin page
    await page.goto('/admin')

    // Verify we're on the admin page
    await expect(page).toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible()

    // Wait for the data grid to load and contain rows
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 })

    // Wait for data to actually load - check for either rows or "No rows" message
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

    // Step 3: Click on the checkbox for one user (first row)
    // Find the first checkbox in the data grid (skip the header checkbox)
    const firstRowCheckbox = page
      .locator('.MuiDataGrid-row')
      .first()
      .locator('input[type="checkbox"]')
    await firstRowCheckbox.waitFor({ state: 'visible', timeout: 10000 })
    await firstRowCheckbox.click()

    // Verify the delete button is enabled
    const deleteButton = page.getByTestId('delete-users-button')
    await expect(deleteButton).toBeEnabled()
    await expect(deleteButton).toContainText('Delete Users (1)')

    // Step 4: Click the delete users button
    await deleteButton.click()

    // Verify the confirmation dialog appears
    await expect(page.getByText('Confirm Delete')).toBeVisible()
    await expect(
      page.getByText(/are you sure you want to delete this user\? all activity from this user/i)
    ).toBeVisible()

    // Step 5: Click the cancel button
    const cancelButton = page.getByTestId('cancel-delete-button')
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()

    // Verify the dialog is dismissed
    await expect(page.getByText('Confirm Delete')).toBeHidden()

    // Verify we're still on the admin page
    await expect(page).toHaveURL('/admin')

    // Verify the checkbox is still checked (user was not deleted)
    await expect(firstRowCheckbox).toBeChecked()
  })

  test('should disable delete button when no users are selected', async ({ page }) => {
    // Sign in and navigate to admin page
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await page.goto('/admin')

    // Wait for the data grid to load
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 })

    // Verify the delete button is disabled when no users are selected
    const deleteButton = page.getByTestId('delete-users-button')
    await expect(deleteButton.last()).toBeDisabled()
    await expect(deleteButton.last()).toContainText('Delete Users (0)')
  })

  test('should update button text with selected user count', async ({ page }) => {
    // Sign in and navigate to admin page
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await page.goto('/admin')

    // Wait for the data grid to load
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 })

    const deleteButton = page.getByTestId('delete-users-button')
    
    // Wait for delete button to be visible
    await expect(deleteButton.last()).toBeVisible()

    // Initially 0 users selected
    await expect(deleteButton.last()).toContainText('Delete Users (0)')

    // Select first user
    const firstRowCheckbox = page
      .locator('.MuiDataGrid-row')
      .first()
      .locator('input[type="checkbox"]')
    await firstRowCheckbox.click()
    await expect(deleteButton).toContainText('Delete Users (1)')

    // Select second user
    const secondRowCheckbox = page
      .locator('.MuiDataGrid-row')
      .nth(1)
      .locator('input[type="checkbox"]')
    await secondRowCheckbox.click()
    await expect(deleteButton).toContainText('Delete Users (2)')

    // Deselect first user
    await firstRowCheckbox.click()
    await expect(deleteButton).toContainText('Delete Users (1)')
  })

  test('should close dialog when clicking outside the dialog box', async ({ page }) => {
    // Sign in and navigate to admin page
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await page.goto('/admin')

    // Wait for the data grid to load
    await page.waitForSelector('.MuiDataGrid-root', { timeout: 10000 })

    // Select a user
    const firstRowCheckbox = page
      .locator('.MuiDataGrid-row')
      .first()
      .locator('input[type="checkbox"]')
    await firstRowCheckbox.click()

    // Click delete button
    const deleteButton = page.getByTestId('delete-users-button')
    await deleteButton.click()

    // Verify dialog appears
    await expect(page.getByText('Confirm Delete')).toBeVisible()

    // Click on the backdrop (outside the dialog inner box)
    // The backdrop is a Box with bgcolor: 'rgba(0, 0, 0, 0.5)' and position: fixed
    // We need to click on an area that's outside the inner dialog box
    // Click at top-left corner of the viewport (definitely outside the dialog)
    await page.mouse.click(10, 10)

    // Verify the dialog is dismissed
    await expect(page.getByText('Confirm Delete')).toBeHidden()
  })
})
