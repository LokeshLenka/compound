import { addDays, parseISO, format } from "date-fns"
import type { DiaryEntry } from "@/lib/types"
import { todayISO } from "@/lib/dates"

/** Add an arbitrary number of days to an ISO date, returning yyyy-MM-dd. */
export function shiftISO(iso: string, days: number): string {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd")
}

/** Look up the diary entry for a given ISO date. */
export function entryFor(entries: DiaryEntry[], iso: string): DiaryEntry | null {
  return entries.find((e) => e.entry_date === iso) ?? null
}

export interface BookSpread {
  leftIso: string
  rightIso: string
  hasPrev: boolean
  hasNext: boolean
}

/**
 * The open-book spread around a selected day.
 *
 * Navigation is bounded by the diary's earliest entry (backwards) and by today
 * or the latest entry, whichever is later (forwards), so users cannot flip
 * forever into the past or the future. The right page is always the next day,
 * which matches a one-entry-per-day journal.
 *
 * `now` lets callers pin the "today" used for bounds (deterministic tests).
 */
export function bookSpread(
  selectedIso: string,
  entries: DiaryEntry[],
  now: string = todayISO(),
): BookSpread {
  if (!selectedIso) {
    return { leftIso: now, rightIso: shiftISO(now, 1), hasPrev: false, hasNext: false }
  }
  const dates = entries.map((e) => e.entry_date).sort()
  const earliest = dates[0] ?? now
  const latest = dates[dates.length - 1] ?? now
  const furthest = latest > now ? latest : now
  const hasPrev = selectedIso > earliest
  const hasNext = selectedIso < furthest
  return { leftIso: selectedIso, rightIso: shiftISO(selectedIso, 1), hasPrev, hasNext }
}