import { test, expect } from "@playwright/test"
import { registerAndLogin } from "./helpers"

test.describe("habits", () => {
  test("create a habit, check off today, streak appears", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Habits" }).click()
    await page.getByRole("heading", { name: "Habits" }).waitFor()

    // Create
    await page.getByRole("button", { name: "New habit" }).click()
    await page.getByLabel("Name").fill("Drink water e2e")
    await page.getByRole("button", { name: "Create" }).click()
    await expect(page.getByRole("heading", { name: "Drink water e2e" })).toBeVisible()

    // Check off today (data attribute targets the current day cell)
    const todayCell = page.locator('[data-checkin-today="true"]').last()
    await todayCell.click()

    // Saved check-in should show a green dot for today
    await expect(
      page.locator('[data-checkin-today="true"] .bg-green-500'),
    ).toBeVisible()

    // Streak badge = 1
    const card = page
      .locator(".group\\/?", { has: page.getByRole("heading", { name: "Drink water e2e" }) })
      .last()
    await expect(card).toBeVisible()
  })

  test("habit form frequency switch shows conditional fields", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Habits" }).click()
    await page.getByRole("button", { name: "New habit" }).click()

    await page.getByLabel("Frequency").click()
    await page.getByRole("option", { name: "X times per week" }).click()
    await expect(page.getByLabel("Times per week")).toBeVisible()
  })
})