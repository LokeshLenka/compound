import { test, expect } from "@playwright/test"
import { registerAndLogin } from "./helpers"

test.describe("habits", () => {
  test("create a habit, check off today, streak appears", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Habits", exact: true }).click()
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
      todayCell.locator(".bg-green-500"),
    ).toBeVisible()
  })

  test("habit form frequency switch shows conditional fields", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Habits", exact: true }).click()
    await page.getByRole("button", { name: "New habit" }).click()

    await page.getByLabel("Frequency").click()
    await page.getByRole("option", { name: "X times per week" }).click()
    await expect(page.getByLabel("Times per week")).toBeVisible()
  })

  test("reorder habits and persist the new order", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Habits", exact: true }).click()
    await page.getByRole("heading", { name: "Habits" }).waitFor()

    for (const name of ["Reorder alpha", "Reorder beta"]) {
      await page.getByRole("button", { name: "New habit" }).click()
      await page.getByLabel("Name").fill(name)
      await page.getByRole("button", { name: "Create" }).click()
      await expect(page.getByRole("heading", { name })).toBeVisible()
    }

    const cardTitles = async () =>
      (await page.locator("h3").allTextContents()).map((t) => t.trim())

    await page.getByRole("button", { name: "Reorder", exact: true }).click()
    await page.getByRole("button", { name: "Move Reorder beta up" }).click()
    await expect.poll(cardTitles).toEqual(["Reorder beta", "Reorder alpha"])

    await page.getByRole("button", { name: "Done", exact: true }).click()
    await page.reload()
    await page.getByRole("heading", { name: "Habits" }).waitFor()
    await expect.poll(cardTitles).toEqual(["Reorder beta", "Reorder alpha"])
  })

  test("habit analytics page opens from Habits with stats", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Habits", exact: true }).click()
    await page.getByRole("heading", { name: "Habits" }).waitFor()

    await page.getByRole("button", { name: "New habit" }).click()
    await page.getByLabel("Name").fill("Stats habit")
    await page.getByRole("button", { name: "Create" }).click()
    await expect(page.getByRole("heading", { name: "Stats habit" })).toBeVisible()

    await page.getByRole("link", { name: "Analytics" }).click()
    await page.getByRole("heading", { name: "Habit analytics" }).waitFor()
    await expect(page.getByText("Consistency leaderboard")).toBeVisible()
    await expect(page.getByText("Per-habit detail")).toBeVisible()
    await expect(page.getByText("Stats habit").first()).toBeVisible()
  })

  test("mobile habits page has a thumb-reach create button", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Habits", exact: true }).click()
    await page.getByRole("heading", { name: "Habits" }).waitFor()

    await page.locator('button[aria-label="New habit"]').click()
    await expect(page.getByRole("dialog")).toBeVisible()
  })
})