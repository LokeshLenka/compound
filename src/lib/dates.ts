import { startOfDay, endOfDay, format, parseISO, subDays, subMonths, eachDayOfInterval } from "date-fns"

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd")
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function startOfToday(): Date {
  return startOfDay(new Date())
}

export function endOfToday(): Date {
  return endOfDay(new Date())
}

export function humanDate(iso: string | null | undefined, fmt = "EEE, MMM d"): string {
  if (!iso) return ""
  return format(parseISO(iso), fmt)
}

export function lastNDates(n: number): string[] {
  return eachDayOfInterval({
    start: subDays(new Date(), n - 1),
    end: new Date(),
  }).map(toISODate)
}

/** Calendar grid for a month: leading blanks (null) then iso date strings. */
export function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = (first.getDay() + 6) % 7 // Monday-first
  const cells: (string | null)[] = []
  for (let i = 0; i < leading; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(year, month, d)))
  return cells
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7) // yyyy-MM
}

/** ISO → display "Sep 2026" */
export function monthLabel(iso: string): string {
  return format(parseISO(`${iso}-01`), "MMMM yyyy")
}

export function datesInRange(startIso: string, endIso: string): string[] {
  return eachDayOfInterval({
    start: parseISO(startIso),
    end: parseISO(endIso),
  }).map(toISODate)
}

export function lastMonthsISO(n: number): string[] {
  const arr: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    arr.push(monthKey(toISODate(subMonths(new Date(), i))))
  }
  return arr
}