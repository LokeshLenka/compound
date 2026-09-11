import { test, expect } from "@playwright/test"
import { registerAndLogin } from "./helpers"

test("create a task, mark it done from the list", async ({ page }) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Tasks", exact: true }).click()
  await page.getByRole("heading", { name: "Tasks" }).waitFor()

  await page.getByRole("button", { name: "New task" }).click()
  await page.getByLabel("Title").fill("Ship e2e task")
  await page.getByRole("button", { name: "Create" }).click()
  await expect(page.getByText("Ship e2e task").first()).toBeVisible()

  // Complete it via the row checkbox — moves to done with a strike-through
  const done = page.getByRole("checkbox", { name: "Mark Ship e2e task as done" })
  await done.click()
  await expect(done).toBeChecked()
})

test("delete a task from the row menu", async ({ page }) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Tasks", exact: true }).click()
  await page.getByRole("button", { name: "New task" }).click()
  await page.getByLabel("Title").fill("Doomed task e2e")
  await page.getByRole("button", { name: "Create" }).click()
  await expect(page.getByText("Doomed task e2e").first()).toBeVisible()

  await page.getByRole("button", { name: "Delete Doomed task e2e" }).click()
  await expect(page.getByText("Doomed task e2e")).toHaveCount(0)
})