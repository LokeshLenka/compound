import { test, expect } from "@playwright/test"
import { registerAndLogin } from "./helpers"

test("update profile name and see it in the sidebar", async ({ page }) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Settings", exact: true }).click()
  await page.getByRole("heading", { name: "Settings" }).waitFor()

  await page.getByLabel("Full name").fill("Test User")
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await expect(page.getByText("Profile updated")).toBeVisible()

  // Sidebar avatar name reflects the change
  await expect(page.getByText("Test User").first()).toBeVisible()
})

test("delete confirmation dialog opens", async ({ page }) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Settings", exact: true }).click()
  await page.getByRole("heading", { name: "Settings" }).waitFor()

  await page.getByRole("button", { name: "Delete account…" }).click()
  await expect(
    page.getByRole("heading", { name: "Delete your account?" }),
  ).toBeVisible()
  // Cancel — deletion itself needs the deployed edge function (cloud) and is
  // covered manually / in production checks.
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
})

test("search opens with Ctrl+K and finds notes", async ({ page }) => {
  const user = await registerAndLogin(page)
  await page.getByRole("link", { name: "Notes", exact: true }).click()
  await page.getByRole("button", { name: "New note" }).click()
  await page.getByPlaceholder("Title").fill(`unique-token-${user.password}`)
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.getByText(`unique-token-${user.password}`)).toBeVisible()

  await page.keyboard.press("Control+K")
  const dialog = page.getByRole("dialog")
  const input = page
    .locator('input[placeholder*="Search habits, tasks, notes"]')
    .filter({ visible: true })
  await input.fill(`unique-token-${user.password}`)
  await expect(dialog.locator(`text=unique-token-${user.password}`)).toBeVisible()
})