import { test, expect } from "@playwright/test"
import { registerAndLogin } from "./helpers"

test("redirects unauthenticated visitors to login", async ({ page }) => {
  await page.goto("/dashboard")
  await page.waitForURL("**/login**")
  await expect(
    page.getByText("Habits, tasks, notes & diary in one private place."),
  ).toBeVisible()
})

test("register → dashboard → sign out → login again", async ({ page }) => {
  const user = await registerAndLogin(page)
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()

  // Sidebar shows the four modules
  for (const label of ["Habits", "Tasks", "Notes", "Diary"]) {
    await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible()
  }

  // Sign out
  await page.getByLabel("Sign out").click()
  await page.waitForURL("**/login**")

  // Sign back in
  await page.getByLabel("Email").fill(user.email)
  await page.getByLabel("Password").fill(user.password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.waitForURL("**/dashboard**")
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
})