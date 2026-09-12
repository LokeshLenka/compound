import { eachDayOfInterval, subDays } from "date-fns"
import { toISODate } from "@/lib/dates"
import type { WaterLog, WaterUnit } from "@/lib/types"

export const ML_PER_OZ = 29.5735

const clean = (n: number) => Math.round(n * 10) / 10

/** Convert stored ml into the display unit. */
export function mlToUnit(ml: number, unit: WaterUnit): number {
  return unit === "oz" ? clean(ml / ML_PER_OZ) : Math.round(ml)
}

/** Convert a user-entered amount in the display unit back to ml. */
export function unitToMl(amount: number, unit: WaterUnit): number {
  return unit === "oz" ? Math.round(amount * ML_PER_OZ) : Math.round(amount)
}

/**
 * Format a stored ml amount for display.
 * Large ml values collapse to litres; oz stays numeric.
 */
export function formatAmount(ml: number, unit: WaterUnit): string {
  if (unit === "oz") return `${mlToUnit(ml, unit)} oz`
  if (ml >= 1000) return `${clean(ml / 1000)} L`
  return `${ml} ml`
}

/** "07:42" style local clock label for a log timestamp. */
export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

/** Total ml across a set of logs (e.g. today). */
export function totalMl(logs: WaterLog[]): number {
  return logs.reduce((sum, l) => sum + l.amount_ml, 0)
}

/** Bucket logs by local calendar day → total ml. */
export function bucketByDay(logs: WaterLog[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const l of logs) {
    const key = toISODate(new Date(l.drank_at))
    map.set(key, (map.get(key) ?? 0) + l.amount_ml)
  }
  return map
}

/** Totals for each of the last `days` days ending today (today included). */
export function dailyTotals(
  logs: WaterLog[],
  days: number,
  now: Date,
): { date: string; totalMl: number }[] {
  const buckets = bucketByDay(logs)
  const start = subDays(now, days - 1)
  return eachDayOfInterval({ start, end: now }).map((d) => {
    const key = toISODate(d)
    return { date: key, totalMl: buckets.get(key) ?? 0 }
  })
}

/**
 * Consecutive-day hydration streak.
 * If today's goal is already met, today counts; otherwise the streak still
 * lives as long as yesterday was met. Stops at the first missed day.
 */
export function currentStreak(logs: WaterLog[], goalMl: number, now: Date): number {
const totals = bucketByDay(logs)
  let cursor = now
  // start from today; if today hasn't met the goal yet, continue from yesterday
  if ((totals.get(toISODate(cursor)) ?? 0) < goalMl) {
    cursor = subDays(cursor, 1)
  }
  let streak = 0
  while ((totals.get(toISODate(cursor)) ?? 0) >= goalMl) {
    streak += 1
    cursor = subDays(cursor, 1)
  }
  return streak
}

/** Average daily ml over the given window (today included). */
export function dailyAverage(logs: WaterLog[], days: number, now: Date): number {
  return Math.round(dailyTotals(logs, days, now).reduce((s, d) => s + d.totalMl, 0) / days)
}

/** Amount still needed to hit today's goal. */
export function remainingMl(totalMlToday: number, goalMl: number): number {
  return Math.max(0, goalMl - totalMlToday)
}

/** Whole-percent progress toward the goal, clamped to 0–100. */
export function progressPct(totalMlToday: number, goalMl: number): number {
  if (goalMl <= 0) return 0
  return Math.min(100, Math.round((totalMlToday / goalMl) * 100))
}

/**
 * Compact one-line label for chart bars: "800" / "1.5L" in ml mode,
 * "6.8 oz" in oz mode.
 */
export function formatCompact(ml: number, unit: WaterUnit): string {
  if (unit === "oz") return `${mlToUnit(ml, unit)} oz`
  if (ml >= 1000) return `${clean(ml / 1000)}L`
  return `${Math.round(ml)}`
}

/** Largest single-day total in a dailyTotals-style window. */
export function bestDayMl(days: { totalMl: number }[]): number {
  return days.reduce((best, d) => Math.max(best, d.totalMl), 0)
}

/** Sum of a dailyTotals-style window. */
export function weekTotalMl(days: { totalMl: number }[]): number {
  return days.reduce((sum, d) => sum + d.totalMl, 0)
}