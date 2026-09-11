import type { Page } from "@playwright/test"

/** Unique per-test email so parallel runs never collide. */
export function freshUser() {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 7)
  return {
    email: `e2e-${ts}-${rand}@test.local`,
    password: `Passw0rd-${rand}`,
  }
}

/** Register a brand-new account through the UI, landing on /dashboard. */
export async function registerAndLogin(page: Page, user = freshUser()) {
  await page.goto("/login")
  await page.getByRole("tab", { name: "Create account" }).click()
  await page.getByLabel("Email").fill(user.email)
  await page.getByLabel("Password").fill(user.password)
  await page.getByRole("button", { name: "Create account" }).click()
  await page.waitForURL("**/dashboard", { timeout: 20_000 })
  return user
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.waitForURL("**/dashboard", { timeout: 20_000 })
}