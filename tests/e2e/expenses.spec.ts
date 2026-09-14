import { test, expect, type Page } from "@playwright/test"
import { registerAndLogin } from "./helpers"

/** Click a dialog field before filling it — lets the dialog enter-animation settle. */
async function fillField(page: Page, label: string | RegExp, value: string) {
  const field = page.getByRole("dialog").getByLabel(label)
  await field.click()
  await field.fill(value)
}

/**
 * Clicks until the UI reflects it. First paint is SSR HTML — a click that lands
 * before React hydrates is silently lost, so retry the click until state changes.
 */
async function openTab(page: Page, name: string) {
  const tab = page.getByRole("tab", { name })
  await expect(async () => {
    await tab.click({ timeout: 5_000 })
    await expect(tab).toHaveAttribute("aria-selected", "true", { timeout: 2_000 })
  }).toPass({ timeout: 30_000 })
}

async function openDialog(page: Page, name: string | RegExp) {
  await expect(async () => {
    await page.getByRole("button", { name }).click({ timeout: 5_000 })
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2_000 })
  }).toPass({ timeout: 30_000 })
}

test("create a category, log a transaction, see it in the month summary", async ({ page }) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Expenses", exact: true }).click()
  await page.getByRole("heading", { name: "Expenses" }).waitFor()

  // Categories tab → new expense category
  await openTab(page, "Categories")
  await openDialog(page, "New category")
  await fillField(page, "Name", "Groceries e2e")
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Groceries e2e")).toBeVisible()

  // Transactions tab → add an expense in that category
  await openTab(page, "Transactions")
  await openDialog(page, "Add transaction")
  await fillField(page, "Amount", "12.50")
  await page.getByRole("dialog").getByLabel("Category").click()
  await page.getByRole("option", { name: "Groceries e2e" }).click()
  await fillField(page, "Note", "Milk e2e")
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()

  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 })
  await expect(page.getByText("Milk e2e")).toBeVisible()
  await expect(page.getByText("12.50", { exact: true }).first()).toBeVisible()
  // Month summary reflects the spend
  await expect(page.getByText("Spent")).toBeVisible()
})

test("filter transactions by type and search", async ({ page }) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Expenses", exact: true }).click()
  await page.getByRole("heading", { name: "Expenses" }).waitFor()

  await openDialog(page, "Add transaction")
  await fillField(page, "Amount", "99.00")
  await fillField(page, "Note", "Salary e2e")
  await page.getByRole("group", { name: "Transaction type" }).getByRole("button", { name: "Income" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Salary e2e")).toBeVisible()

  // Type filter hides income when showing expenses only
  await page.getByRole("group", { name: "Filter by type" }).getByRole("button", { name: "Out" }).click()
  await expect(page.getByText("Salary e2e")).toBeHidden()
  await page.getByRole("group", { name: "Filter by type" }).getByRole("button", { name: "In" }).click()
  await expect(page.getByText("Salary e2e")).toBeVisible()

  // Search narrows the list
  await page.getByRole("group", { name: "Filter by type" }).getByRole("button", { name: "All" }).click()
  await page.getByPlaceholder(/Search notes or categories/i).fill("salary")
  await expect(page.getByText("Salary e2e")).toBeVisible()
  await page.getByPlaceholder(/Search notes or categories/i).fill("no-such-txn-xyz")
  await expect(page.getByText("Salary e2e")).toBeHidden()
})

test("create a budget and see spend progress", async ({ page }) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Expenses", exact: true }).click()
  await page.getByRole("heading", { name: "Expenses" }).waitFor()

  // Need a category first
  await openTab(page, "Categories")
  await openDialog(page, "New category")
  await fillField(page, "Name", "Dining e2e")
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Dining e2e")).toBeVisible()

  // Spend against it
  await openTab(page, "Transactions")
  await openDialog(page, "Add transaction")
  await fillField(page, "Amount", "25")
  await page.getByRole("dialog").getByLabel("Category").click()
  await page.getByRole("option", { name: "Dining e2e" }).click()
  await fillField(page, "Note", "Lunch e2e")
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Lunch e2e")).toBeVisible()

  // Budget tab → new monthly budget, progress shows spend
  await openTab(page, "Budgets")
  await openDialog(page, "Create a budget")
  await fillField(page, "Limit", "100")
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Dining e2e")).toBeVisible()
  await expect(page.getByText(/25% used/)).toBeVisible()
})