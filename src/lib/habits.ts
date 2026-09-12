import {
  differenceInCalendarDays,
  eachDayOfInterval,
  getISODay,
  parseISO,
  subDays,
} from "date-fns"
import { todayISO, toISODate, lastNDates } from "@/lib/dates"
import type { Habit } from "@/lib/types"

/** Is the habit due (expected) on a given date? */
export function isDueOnDate(habit: Habit, isoDate: string): boolean {
  const date = parseISO(isoDate)
  switch (habit.frequency_type) {
    case "daily":
      return true
    case "weekdays": {
      const days = habit.frequency_value.days ?? [1, 2, 3, 4, 5]
      return days.includes(getISODay(date))
    }
    case "weekly": {
      // Due any day; the target count (times) is tracked separately.
      const times = habit.frequency_value.times ?? 3
      return times > 0
    }
    case "every_n_days": {
      const every = habit.frequency_value.every ?? 2
      if (every <= 0) return true
      const anchor = parseISO(habit.created_at.slice(0, 10))
      const since = differenceInCalendarDays(date, anchor)
      return since >= 0 && since % every === 0
    }
    default:
      return true
  }
}

export function isDueToday(habit: Habit): boolean {
  return isDueOnDate(habit, todayISO())
}

/** Weekly progress: how many logs landed within the current ISO week (Mon–Sun). */
export function weekCount(habit: Habit, logDates: string[], onDate = todayISO()): number {
  const target = habit.frequency_type === "weekly" ? (habit.frequency_value.times ?? 3) : null
  if (target === null) return 0
  const anchor = parseISO(onDate)
  const monday = subDays(anchor, getISODay(anchor) - 1)
  const iso = monday.toISOString().slice(0, 10)
  const set = new Set(logDates)
  let count = 0
  for (let i = 0; i < 7; i++) {
    const day = subDays(monday, -i)
    if (set.has(day.toISOString().slice(0, 10))) count++
  }
  void iso
  return count
}

/**
 * Current streak ending today (or `toDate`). A due date that is *not yet*
 * logged on the starting day is treated as in-progress (doesn't break).
 * Non-due days are skipped without breaking.
 */
export function currentStreak(habit: Habit, logDates: string[], toDate = todayISO()): number {
  const set = new Set(logDates)
  const start = parseISO(toDate)
  const startDueUnlogged = isDueOnDate(habit, toDate) && !set.has(toDate)
  let cursor = startDueUnlogged ? subDays(start, 1) : start
  let streak = 0
  for (;;) {
    const iso = toISODate(cursor)
    if (isDueOnDate(habit, iso)) {
      if (set.has(iso)) streak++
      else break
    }
    cursor = subDays(cursor, 1)
  }
  return streak
}

/** Longest run of consecutive due days that were logged. */
export function bestStreak(habit: Habit, logDates: string[], toDate = todayISO()): number {
  const set = new Set(logDates)
  if (set.size === 0) return 0
  const end = parseISO(toDate)
  const start = parseISO([...set].sort()[0])
  const days = eachDayOfInterval({ start, end }).map(toISODate)
  let best = 0
  let run = 0
  for (const iso of days) {
    if (isDueOnDate(habit, iso)) {
      if (set.has(iso)) {
        run++
        best = Math.max(best, run)
      } else {
        run = 0
      }
    }
  }
  return best
}

/** Fraction of due days in the last `days` window that were logged. */
export function completionRate(habit: Habit, logDates: string[], days = 30): number {
  const set = new Set(logDates)
  const due = lastNDates(days).filter((d) => isDueOnDate(habit, d))
  if (due.length === 0) return 0
  const done = due.filter((d) => set.has(d)).length
  return done / due.length
}

/**
 * Move a habit in the list and reindex `sort_order` to 0..n-1.
 * Returns the same array reference when nothing moves.
 */
export function reorderHabit(
  list: Habit[],
  id: string,
  dir: "up" | "down",
): Habit[] {
  const idx = list.findIndex((h) => h.id === id)
  const target = dir === "up" ? idx - 1 : idx + 1
  if (idx === -1 || target < 0 || target >= list.length) return list
  const next = [...list]
  const [moved] = next.splice(idx, 1)
  next.splice(target, 0, moved)
  return next.map((h, i) => ({ ...h, sort_order: i }))
}