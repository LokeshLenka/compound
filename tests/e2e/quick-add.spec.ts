import { test, expect } from "@playwright/test"
import { registerAndLogin } from "./helpers"

test("dashboard quick-add opens the task form via deep link", async ({ page }) => {
  await registerAndLogin(page) // lands on /dashboard
  await page.getByRole("heading", { name: "Dashboard" }).waitFor()

  await page.getByRole("button", { name: "Quick add" }).click()
  await page.getByRole("menuitem", { name: "New task" }).click()
  await page.waitForURL("**/tasks?create=1")
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.getByLabel("Title").fill("Quick-add task e2e")
  await page.getByRole("button", { name: "Create" }).click()
  await expect(page.getByText("Quick-add task e2e").first()).toBeVisible()
})

test("mobile dashboard shows the quick-add FAB", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await registerAndLogin(page)
  await page.getByRole("heading", { name: "Dashboard" }).waitFor()

  const fab = page.locator('button[aria-label="Quick add"]')
  await expect(fab).toBeVisible()
  const gap = async () => {
    const box = await fab.boundingBox()
    return box ? 844 - box.y - box.height : -1
  }
  await expect.poll(gap).toBeGreaterThanOrEqual(64)
  await expect.poll(gap).toBeLessThanOrEqual(120)

  await fab.click()
  await page.getByRole("menuitem", { name: "New note" }).click()
  await page.waitForURL("**/notes?create=1")
  await expect(page.getByRole("dialog")).toBeVisible()
})