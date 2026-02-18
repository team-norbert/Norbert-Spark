import { expect, test } from '@playwright/test'

const TEST_CREDENTIALS = {
  email: 'james.smith@gmail.com',
  password: 'Admin123!',
} as const

// The seed data written by apps/backend/scripts/seed-chat.ts
const SEEDED_CHAT_TYPE = {
  name: 'The Heart of Darkness',
  seoFriendlyId: 'heart-darkness',
  description:
    'Ask questions about the novella "The Heart of Darkness" by Joseph Conrad. Get insights into its themes, characters, and plot.',
  updatedDescription:
    'Ask questions about the novella "The Heart of Darkness" by Joseph Conrad. Get insights into its themes, characters, and the plot.',
} as const

test.describe('Chat Types Page - Inline Edit', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('admin can edit a description cell and confirm the save', async ({ page }) => {
    // ── 1. Sign in ────────────────────────────────────────────────────────────
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 15_000 }),
      page.getByRole('button', { name: /^sign in$/i }).click(),
    ])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // ── 2. Navigate to /chat-types ────────────────────────────────────────────
    await page.goto('/chat-types')
    await expect(page).toHaveURL('/chat-types')

    // Wait for the DataGrid to render rows
    await page.waitForSelector('.MuiDataGrid-row', { timeout: 15_000 })

    // ── 3. Verify the seeded row is present ───────────────────────────────────

    const firstRowNameCell = page.locator('.MuiDataGrid-row').first().locator('[data-field="name"]')

    await expect(firstRowNameCell).toBeVisible()
    await expect(firstRowNameCell).toContainText(SEEDED_CHAT_TYPE.name, { ignoreCase: true })
    const firstRowseoFriendlyIdCell = page
      .locator('.MuiDataGrid-row')
      .first()
      .locator('[data-field="seoFriendlyId"]')
    await expect(firstRowseoFriendlyIdCell).toBeVisible()
    await expect(firstRowseoFriendlyIdCell).toContainText(SEEDED_CHAT_TYPE.seoFriendlyId, {
      ignoreCase: true,
    })

    const firstRowDescriptionCell = page
      .locator('.MuiDataGrid-row')
      .first()
      .locator('[data-field="description"]')

    await expect(firstRowDescriptionCell).toBeVisible()

    const descriptionInner = firstRowDescriptionCell.locator('[aria-label]')

    await expect(descriptionInner).toHaveAttribute(
      'aria-label',
      new RegExp(SEEDED_CHAT_TYPE.description, 'i')
    )

    // ── 4. Double-click the description cell to enter edit mode ───────────────
    await descriptionInner.dblclick()

    // Wait for the edit-mode TextField to appear inside the cell
    const editInput = page.locator('[data-field="description"]').locator('input, textarea').first()
    await expect(editInput).toBeVisible({ timeout: 5_000 })

    // ── 5. Replace the description text ──────────────────────────────────────
    // Select all existing text and overwrite it
    await editInput.selectText()
    await editInput.fill(SEEDED_CHAT_TYPE.updatedDescription)

    // Commit the edit by pressing Enter
    await editInput.press('Enter')

    // ── 6. Confirm save in the dialog ─────────────────────────────────────────
    const confirmDialog = page.getByTestId('confirm-save-dialog')
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 })

    const confirmButton = page.getByTestId('confirm-save-button')
    await expect(confirmButton).toBeVisible()
    await confirmButton.click()

    // ── 7. Verify the success alert ───────────────────────────────────────────
    const successAlert = page.getByTestId('success-alert')
    await expect(successAlert).toBeVisible({ timeout: 10_000 })
    await expect(successAlert).toContainText('Update successful')
  })
})
