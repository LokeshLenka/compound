import { test, expect } from "@playwright/test"
import { registerAndLogin } from "./helpers"

test("create a note with markdown and search for it", async ({ page }) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Notes", exact: true }).click()
  await page.getByRole("heading", { name: "Notes" }).waitFor()

  await page.getByRole("button", { name: "New note" }).click()
  await page.getByPlaceholder("Title").fill("Ideas e2e note")
  await page.locator(".tiptap").fill("Shopping list:\n- milk\n- eggs")
  await page.getByLabel("Tags").fill("ideas, e2e")
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Ideas e2e note")).toBeVisible()

  // Search narrows the list
  const filter = page.getByPlaceholder(/Search notes/i)
  await filter.fill("milk")
  await expect(page.getByText("Ideas e2e note")).toBeVisible()

  // Pin toggle
  await page.getByPlaceholder(/Search notes/i).fill("")
  await page.getByRole("button", { name: "Pin" }).click()
})

test("deep link with ?q= filters and highlights a note", async ({ page }) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Notes", exact: true }).click()
  await page.getByRole("heading", { name: "Notes" }).waitFor()

  await page.getByRole("button", { name: "New note" }).click()
  await page.getByPlaceholder("Title").fill("Focus anchor e2e")
  await page.locator(".tiptap").fill("Deep-link verification note")
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Focus anchor e2e")).toBeVisible()

  await page.goto("/notes?q=" + encodeURIComponent("Focus anchor e2e"))
  await expect(page.getByPlaceholder(/Search notes/i)).toHaveValue(
    "Focus anchor e2e",
  )
  await expect(page.locator(".ring-primary", { hasText: "Focus anchor e2e" })).toBeVisible()
})

test("create a diary entry with a mood", async ({ page }) => {
  await registerAndLogin(page)
  await page.getByRole("link", { name: "Diary", exact: true }).click()
  await page.getByRole("heading", { name: "Diary" }).waitFor()

  // Today should be selected by default
  await page.getByPlaceholder("A short title for today…").fill("A great day")
  await page.locator(".tiptap").fill("Went for a long walk and shipped an app.")
  await page.getByTitle("Good").click()
  await page.getByRole("button", { name: "Save day" }).click()

  // Saved state is reflected back in the editor (and embedded in the day cell title)
  await expect(page.getByPlaceholder("A short title for today…")).toHaveValue(
    "A great day",
  )
  await expect(page.getByTitle("Good")).toBeVisible()
})