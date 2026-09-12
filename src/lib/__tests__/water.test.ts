import { describe, expect, it } from "vitest"
import { subHours, subDays } from "date-fns"
import {
  mlToUnit,
  unitToMl,
  formatAmount,
  formatClock,
  totalMl,
  dailyTotals,
  currentStreak,
  dailyAverage,
  remainingMl,
  progressPct,
  formatCompact,
  bestDayMl,
  weekTotalMl,
} from "@/lib/water"
import type { WaterLog } from "@/lib/types"

const now = new Date("2026-09-12T14:00:00")
const iso = (d: Date) => d.toISOString()

function log(amountMl: number, drankAt: Date, id = String(amountMl)): WaterLog {
  return { id, user_id: "u", amount_ml: amountMl, drank_at: iso(drankAt), note: null, created_at: iso(drankAt) }
}

const ago = (days: number, hours = 0) => subHours(subDays(now, days), hours)

describe("unit conversion", () => {
  it("converts ml to oz and back (round trip ≈ ml)", () => {
    expect(mlToUnit(1000, "oz")).toBeCloseTo(33.8, 1)
    expect(unitToMl(mlToUnit(1000, "oz"), "oz")).toBe(1000)
    expect(mlToUnit(250, "ml")).toBe(250)
    expect(unitToMl(8, "oz")).toBe(Math.round(8 * 29.5735))
  })

  it("formats amounts", () => {
    expect(formatAmount(250, "ml")).toBe("250 ml")
    expect(formatAmount(1500, "ml")).toBe("1.5 L")
    expect(formatAmount(1000, "oz")).toMatch(/oz$/)
  })

  it("formats a clock label", () => {
    const t = formatClock(new Date(2026, 8, 12, 21, 5, 0).toISOString())
    expect(t).toMatch(/21:05|09:05/)
  })
})

describe("totals", () => {
  it("sums ml", () => {
    expect(totalMl([log(250, ago(0)), log(500, ago(0, 2))])).toBe(750)
  })

  it("buckets by local day and pads the last N days incl. today", () => {
    const logs = [log(250, ago(0, 1)), log(500, ago(1)), log(750, ago(5))]
    const totals = dailyTotals(logs, 7, now)
    expect(totals).toHaveLength(7)
    expect(totals[6].totalMl).toBe(250)
    expect(totals[5].totalMl).toBe(500)
    expect(totals[1].totalMl).toBe(750)
    expect(totals.map((t) => t.totalMl).every((v) => v >= 0)).toBe(true)
  })
})

describe("streak", () => {
  it("counts consecutive days that met the goal", () => {
    const logs = [
      log(2500, ago(0)),
      log(2500, ago(1)),
      log(2500, ago(2)),
      log(100, ago(3)), // missed
      log(2500, ago(4)),
    ]
    expect(currentStreak(logs, 2000, now)).toBe(3)
  })

  it("keeps a live streak when today isn't done yet but yesterday was", () => {
    const logs = [log(2500, ago(1)), log(2500, ago(2))]
    expect(currentStreak(logs, 2000, now)).toBe(2)
  })

  it("returns 0 for a missed yesterday", () => {
    const logs = [log(100, ago(1))]
    expect(currentStreak(logs, 2000, now)).toBe(0)
  })

  it("counts today as a streak day once met", () => {
    const logs = [log(2500, ago(0)), log(2500, ago(1))]
    expect(currentStreak(logs, 2000, now)).toBe(2)
  })
})

describe("averages & remainder", () => {
  it("computes daily average over the window", () => {
    const logs = [log(1000, ago(0)), log(500, ago(1))]
    expect(dailyAverage(logs, 2, now)).toBe(750)
  })

  it("computes remaining ml", () => {
    expect(remainingMl(1800, 2500)).toBe(700)
    expect(remainingMl(3000, 2500)).toBe(0)
  })

  it("computes whole-percent progress clamped to 100", () => {
    expect(progressPct(0, 2500)).toBe(0)
    expect(progressPct(1250, 2500)).toBe(50)
    expect(progressPct(2500, 2500)).toBe(100)
    expect(progressPct(5000, 2500)).toBe(100)
    expect(progressPct(100, 0)).toBe(0)
  })

  it("formats compact bar labels", () => {
    expect(formatCompact(800, "ml")).toBe("800")
    expect(formatCompact(1500, "ml")).toBe("1.5L")
    expect(formatCompact(200, "oz")).toBe("6.8 oz")
  })

  it("sums a week window and finds the best day", () => {
    const days = [{ totalMl: 500 }, { totalMl: 2500 }, { totalMl: 0 }]
    expect(weekTotalMl(days)).toBe(3000)
    expect(bestDayMl(days)).toBe(2500)
    expect(bestDayMl([])).toBe(0)
  })
})