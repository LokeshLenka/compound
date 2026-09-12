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

  test("reorder habits with drag and drop", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Habits", exact: true }).click()
    await page.getByRole("heading", { name: "Habits" }).waitFor()

    for (const name of ["Alpha habit", "Beta habit"]) {
      await page.getByRole("button", { name: "New habit" }).click()
      await page.getByLabel("Name").fill(name)
      await page.getByRole("button", { name: "Create" }).click()
      await expect(page.getByRole("heading", { name })).toBeVisible()
    }

    const cardTitles = async () =>
      (await page.locator("h3").allTextContents()).map((t) => t.trim())
    await expect.poll(cardTitles).toEqual(["Alpha habit", "Beta habit"])

    const alpha = await page.getByRole("button", { name: "Drag Alpha habit" }).boundingBox()
    const beta = await page.getByRole("button", { name: "Drag Beta habit" }).boundingBox()
    if (!alpha || !beta) throw new Error("drag handles not visible")

    await page.mouse.move(beta.x + beta.width / 2, beta.y + beta.height / 2)
    await page.mouse.down()
    await page.mouse.move(alpha.x + alpha.width / 2, alpha.y + alpha.height / 2, { steps: 12 })
    await page.mouse.up()

    await expect.poll(cardTitles).toEqual(["Beta habit", "Alpha habit"])

    await page.reload()
    await page.getByRole("heading", { name: "Habits" }).waitFor()
    await expect.poll(cardTitles).toEqual(["Beta habit", "Alpha habit"])
  })

  test("habit analytics page opens from the header link", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Habits", exact: true }).click()
    await page.getByRole("heading", { name: "Habits" }).waitFor()

    await page.getByRole("link", { name: "Analytics" }).click()
    await page.getByRole("heading", { name: "Habit analytics" }).waitFor()
    await expect(page.getByText("Consistency leaderboard")).toBeVisible()
  })

  test("mobile habits page has a thumb-reach create button", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Habits", exact: true }).click()
    await page.getByRole("heading", { name: "Habits" }).waitFor()

    const fab = page.locator('button[aria-label="New habit"]')
    const gap = async () => {
      const box = await fab.boundingBox()
      return box ? 844 - box.y - box.height : -1
    }
    // Sits just above the mobile bottom nav (~70px tall) — not off-screen.
    await expect.poll(gap).toBeGreaterThanOrEqual(64)
    await expect.poll(gap).toBeLessThanOrEqual(120)

    await fab.click()
    await expect(page.getByRole("dialog")).toBeVisible()
  })
})