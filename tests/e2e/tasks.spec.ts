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

test("deep link highlights a task and drag moves it to in progress", async ({
  page,
}) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Tasks", exact: true }).click()
  await page.getByRole("heading", { name: "Tasks" }).waitFor()

  await page.getByRole("button", { name: "New task" }).click()
  await page.getByLabel("Title").fill("Drag storefront e2e")
  await page.getByRole("button", { name: "Create" }).click()
  await expect(page.getByText("Drag storefront e2e").first()).toBeVisible()

  await page.goto("/tasks?q=" + encodeURIComponent("Drag storefront e2e"))
  await expect(page.getByPlaceholder(/Search tasks/i)).toHaveValue(
    "Drag storefront e2e",
  )
  await expect(page.locator(".ring-primary", { hasText: "Drag storefront e2e" })).toBeVisible()

  await page.getByRole("button", { name: /Board/ }).click()

  const checkbox = page.getByRole("checkbox", {
    name: "Mark Drag storefront e2e as done",
  })
  const row = checkbox.locator("..")
  const inProgressColumn = page.getByText(/In progress/).first()

  const dataTransfer = await page.evaluateHandle(() => new DataTransfer())
  await row.dispatchEvent("dragstart", { dataTransfer })
  await inProgressColumn.dispatchEvent("dragenter", { dataTransfer })
  await inProgressColumn.dispatchEvent("dragover", { dataTransfer })
  await inProgressColumn.dispatchEvent("drop", { dataTransfer })
  await row.dispatchEvent("dragend", { dataTransfer })

  await expect(row.getByText("In progress", { exact: true })).toBeVisible()
})