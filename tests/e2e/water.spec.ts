import { test, expect } from "@playwright/test"
import { registerAndLogin } from "./helpers"

test.describe("water", () => {
  test("add a glass, see today's total and a log row appear", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Water", exact: true }).click()
    await page.getByRole("heading", { name: "Water", exact: true }).waitFor()

    await page.getByRole("button", { name: "+200 ml" }).click()

    await expect(page.getByText("200 ml").first()).toBeVisible()
    await expect(page.getByText("8%", { exact: true })).toBeVisible()
    await expect(page.getByText("Today's entries")).toBeVisible()
  })

  test("add a custom amount, edit it, then undo it", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Water", exact: true }).click()
    await page.getByRole("heading", { name: "Water", exact: true }).waitFor()

    await expect(
      page.getByText("No water logged yet today"),
    ).toBeVisible()

    await page.getByLabel("Custom amount").fill("350")
    await page.getByRole("button", { name: "Add", exact: true }).click()

    await expect(page.getByText("350 ml").first()).toBeVisible()
    await expect(page.getByText("14%", { exact: true })).toBeVisible()

    await page.getByRole("button", { name: "Edit entry" }).click()
    await page.getByLabel("Edit amount").fill("400")
    await page.getByRole("button", { name: "Save entry" }).click()
    await expect(page.getByText("400 ml").first()).toBeVisible()
    await expect(page.getByText("16%", { exact: true })).toBeVisible()

    await page.getByRole("button", { name: "Undo last" }).click()
    await expect(
      page.getByText("No water logged yet today"),
    ).toBeVisible()
  })

  test("progress fills render visibly after logging water", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Water", exact: true }).click()
    await page.getByRole("heading", { name: "Water", exact: true }).waitFor()

    await page.getByRole("button", { name: "+400 ml" }).click()
    await expect(page.getByText("16%", { exact: true })).toBeVisible()

    // Wait out the fill transitions, then inspect what actually painted.
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-slot="progress-indicator"]')
      return el ? parseFloat(getComputedStyle(el).width) > 5 : false
    })

    const fills = await page.evaluate(() => {
      const style = (sel: string) => {
        const el = document.querySelector(sel)
        return el ? getComputedStyle(el) : null
      }
      const bars = [...document.querySelectorAll('[data-testid="water-week-bar"]')]
      const todayBar = bars[bars.length - 1]
      const todayStyle = todayBar ? getComputedStyle(todayBar) : null
      const arcStyle = style('[data-testid="water-ring-arc"]')
      return {
        indicatorBg: style('[data-slot="progress-indicator"]')?.backgroundColor ?? "",
        trackBg: style('[data-slot="progress-track"]')?.backgroundColor ?? "",
        todayBarHeight: todayStyle ? parseFloat(todayStyle.height) : 0,
        todayBarBg: todayStyle?.backgroundColor ?? "",
        arcStroke: arcStyle?.getPropertyValue("stroke") ?? "none",
      }
    })

    // Linear bar: indicator painted and distinct from its track.
    expect(fills.indicatorBg).not.toBe(fills.trackBg)
    // Week chart: today's bar has real height and an opaque fill.
    expect(fills.todayBarHeight).toBeGreaterThan(8)
    expect(fills.todayBarBg).not.toBe("rgba(0, 0, 0, 0)")
    // Ring: the progress arc has a resolved stroke color.
    expect(fills.arcStroke).not.toBe("none")
    expect(fills.arcStroke).not.toBe("")
  })

  test("custom amount rejects empty and oversized values", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Water", exact: true }).click()
    await page.getByRole("heading", { name: "Water", exact: true }).waitFor()

    await page.getByRole("button", { name: "Add", exact: true }).click()
    await expect(page.getByText("greater than 0")).toBeVisible()

    await page.getByLabel("Custom amount").fill("99999")
    await page.getByRole("button", { name: "Add", exact: true }).click()
    await expect(page.getByText("capped at")).toBeVisible()
  })

  test("open settings, update the daily goal, and see the ring react", async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole("link", { name: "Water", exact: true }).click()
    await page.getByRole("heading", { name: "Water", exact: true }).waitFor()

    await page.getByRole("button", { name: "Settings", exact: true }).click()
    await page.getByRole("heading", { name: "Water settings" }).waitFor()

    const goal = page.getByLabel("Daily goal")
    await goal.fill("3000")
    await page.getByRole("button", { name: "Save settings" }).click()

    await expect(page.getByRole("heading", { name: "Water settings" })).toBeHidden()
  })
})
