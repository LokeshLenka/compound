import { test, expect, type Page } from "@playwright/test"
import { registerAndLogin } from "./helpers"

/** Click the "New entry" button and wait for the full-page editor to appear. */
async function openEditor(page: Page) {
  await expect(async () => {
    await page.getByRole("button", { name: "New entry" }).click({ timeout: 5_000 })
    await expect(page.getByPlaceholder("Give it a title (optional)")).toBeVisible({ timeout: 3_000 })
  }).toPass({ timeout: 30_000 })
}

/** Submit the journal editor via the form. */
async function saveEntry(page: Page) {
  // Click the form's native submit by pressing Enter in the last input
  await page.locator("#journal-editor-form").evaluate((form) => (form as HTMLFormElement).requestSubmit())
  await expect(page.getByPlaceholder("Give it a title (optional)")).toBeHidden({ timeout: 10_000 })
}

test("create a journal entry with mood, search and filter it", async ({ page }) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Journal", exact: true }).click()
  await page.getByRole("heading", { name: "Journal" }).waitFor()

  await openEditor(page)
  await page.getByPlaceholder("Give it a title (optional)").fill("Morning pages e2e")
  await page.getByPlaceholder(/What's on your mind/i).fill("Coffee, code, and a long walk.")
  await page.getByRole("button", { name: "Good", exact: true }).click()
  await page.getByLabel("Category").fill("personal")
  await saveEntry(page)
  await expect(page.getByText("Morning pages e2e")).toBeVisible()

  // Search narrows the list
  await page.getByPlaceholder(/Search entries/i).fill("long walk")
  await expect(page.getByText("Morning pages e2e")).toBeVisible()
  await page.getByPlaceholder(/Search entries/i).fill("no-such-entry-xyz")
  await expect(page.getByText("Morning pages e2e")).toBeHidden()

  // Mood filter narrows the list
  await page.getByPlaceholder(/Search entries/i).fill("")
  await page.getByRole("button", { name: "Filter by Rough" }).click()
  await expect(page.getByText("Morning pages e2e")).toBeHidden()
  await page.getByRole("button", { name: "Filter by Good" }).click()
  await expect(page.getByText("Morning pages e2e")).toBeVisible()
})

test("open a saved journal entry by clicking its card", async ({ page }) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Journal", exact: true }).click()
  await page.getByRole("heading", { name: "Journal" }).waitFor()

  await openEditor(page)
  await page.getByPlaceholder("Give it a title (optional)").fill("Reopen me e2e")
  await page.getByPlaceholder(/What's on your mind/i).fill("Clicking the card must reopen this entry.")
  await saveEntry(page)
  await expect(page.getByText("Reopen me e2e")).toBeVisible()

  await page.getByText("Reopen me e2e").click()
  await expect(page.getByPlaceholder("Give it a title (optional)")).toBeVisible()
  await expect(page.getByPlaceholder("Give it a title (optional)")).toHaveValue("Reopen me e2e")
})

test("deep link with ?create=1 opens the entry editor", async ({ page }) => {
  await registerAndLogin(page)
  await page.goto("/journal?create=1")
  await expect(page.getByPlaceholder("Give it a title (optional)")).toBeVisible()
})
