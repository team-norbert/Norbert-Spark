import { expect, test } from '@playwright/test'

const TEST_CREDENTIALS = {
  email: 'james.smith@gmail.com',
  password: 'Admin123!',
} as const

const NEW_CHAT_TYPE = {
  name: 'this is a test chat',
  description:
    'Vestibulum libero est, euismod a eleifend a, tempor in sem. Mauris et nunc ac arcu placerat molestie. Aliquam hendrerit tempus enim vitae fringilla.',
} as const

test.describe('Create Chat Type Page', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('admin can create a new chat type and verify it appears in the chat types table', async ({
    page,
  }) => {
    // ── 1. Sign in ────────────────────────────────────────────────────────────
    await page.goto('/signin')
    await page.getByLabel(/email address/i).fill(TEST_CREDENTIALS.email)
    await page.getByLabel(/^password/i).fill(TEST_CREDENTIALS.password)
    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 15_000 }),
      page.getByRole('button', { name: /^sign in$/i }).click(),
    ])
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // ── 2. Navigate to /chat-types/create ─────────────────────────────────────
    await page.goto('/chat-types/create')
    await expect(page).toHaveURL('/chat-types/create')

    // ── 3. Fill in the Name field ─────────────────────────────────────────────
    const nameInput = page.getByLabel('Name *')
    await expect(nameInput).toBeVisible({ timeout: 10_000 })
    await nameInput.fill(NEW_CHAT_TYPE.name)

    // ── 4. Fill in the Description field ─────────────────────────────────────
    const descriptionInput = page.getByLabel('Description *')
    await expect(descriptionInput).toBeVisible()
    await descriptionInput.fill(NEW_CHAT_TYPE.description)

    // -- 5. Check the RAG checkbox ─────────────────────────────────────────────
    const ragCheckbox = page.getByLabel('RAG (Retrieval-Augmented Generation)')
    await expect(ragCheckbox).toBeVisible()
    await ragCheckbox.check()

    // ── 6. Click the submit (Create) button ───────────────────────────────────
    const createButton = page.getByTestId('create-button')
    await expect(createButton).toBeVisible()
    await createButton.click()

    // ── 7. Wait for automatic navigation to /chat-types ──────────────────────
    await page.waitForURL('/chat-types', { timeout: 15_000 })
    await expect(page).toHaveURL('/chat-types')

    // ── 8. Wait for the DataGrid rows to render ───────────────────────────────
    await page.waitForSelector('.MuiDataGrid-row', { timeout: 15_000 })

    // ── 9. Verify the new chat type name appears in the Name column ───────────
    const nameCell = page.locator('[data-field="name"]').filter({ hasText: NEW_CHAT_TYPE.name })
    await expect(nameCell).toBeVisible({ timeout: 10_000 })
    await expect(nameCell).toContainText(NEW_CHAT_TYPE.name, { ignoreCase: true })

    // ── 10. Verify the description appears in the Description column ───────────
    const descriptionCell = page
      .locator('[data-field="description"]')
      .filter({ hasText: NEW_CHAT_TYPE.description.substring(0, 40) })
    await expect(descriptionCell).toBeVisible({ timeout: 10_000 })

    // ── 11. Verify the RAG value is persisted and shown as true in the RAG column ─
    const newChatTypeRow = page.locator('.MuiDataGrid-row').filter({ hasText: NEW_CHAT_TYPE.name }).first()
    await expect(newChatTypeRow).toBeVisible({ timeout: 10_000 })
    const ragCell = newChatTypeRow.locator('[data-field="rag"]')
    await expect(ragCell).toBeVisible({ timeout: 10_000 })
    await expect(ragCell).toHaveText(/true/i)
  })
})
