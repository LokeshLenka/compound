import { describe, expect, it } from "vitest"
import { subDays } from "date-fns"
import {
  isDueOnDate,
  currentStreak,
  bestStreak,
  completionRate,
  weekCount,
} from "@/lib/habits"
import { toISODate } from "@/lib/dates"
import type { Habit } from "@/lib/types"

const todayIso = () => toISODate(new Date())
const daysAgo = (n: number) => toISODate(subDays(new Date(), n))

function habit(partial: Partial<Habit>): Habit {
  return {
    id: "h",
    user_id: "u",
    name: "test",
    emoji: "⭐",
    color: "slate",
    frequency_type: "daily",
    frequency_value: {},
    archived: false,
    archived_at: null,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...partial,
  }
}

const MON = "2026-09-07"
const TUE = "2026-09-08"
const WED = "2026-09-09"
const THU = "2026-09-10"
const FRI = "2026-09-11"

describe("isDueOnDate", () => {
  it("daily is due every day", () => {
    expect(isDueOnDate(habit({ frequency_type: "daily" }), MON)).toBe(true)
  })

  it("weekdays respects the selected days", () => {
    const weekdays = habit({
      frequency_type: "weekdays",
      frequency_value: { days: [1, 2, 3, 4, 5] },
    })
    expect(isDueOnDate(weekdays, MON)).toBe(true) // Monday
    expect(isDueOnDate(weekdays, FRI)).toBe(true) // Friday
    expect(isDueOnDate(weekdays, "2026-09-12")).toBe(false) // Saturday
  })

  it("every_n_days anchors on created_at", () => {
    const h = habit({
      frequency_type: "every_n_days",
      frequency_value: { every: 2 },
      created_at: "2026-09-01T00:00:00Z",
    })
    expect(isDueOnDate(h, "2026-09-01")).toBe(true)
    expect(isDueOnDate(h, "2026-09-03")).toBe(true)
    expect(isDueOnDate(h, "2026-09-02")).toBe(false)
  })

  it("weekly habits are due any day", () => {
    const h = habit({ frequency_type: "weekly", frequency_value: { times: 3 } })
    expect(isDueOnDate(h, MON)).toBe(true)
    expect(isDueOnDate(h, "2026-09-12")).toBe(true)
  })
})

describe("currentStreak", () => {
  it("counts consecutive logged due days", () => {
    const h = habit({ frequency_type: "daily" })
    expect(currentStreak(h, [THU, FRI], FRI)).toBe(2)
  })

  it("starts at zero with no logs", () => {
    expect(currentStreak(habit({}), [], FRI)).toBe(0)
  })

  it("is not broken by a due today not yet logged (in-progress)", () => {
    // Logged WED, THU; FRI(5th) due but not logged yet
    const h = habit({ frequency_type: "daily" })
    expect(currentStreak(h, [WED, THU], FRI)).toBe(2)
  })

  it("breaks on a missed due day", () => {
    const h = habit({ frequency_type: "daily" })
    // logged MON, skipped TUE, logged WED
    expect(currentStreak(h, [MON, WED], WED)).toBe(1)
  })

  it("skips non-due days without breaking", () => {
    const h = habit({
      frequency_type: "every_n_days",
      frequency_value: { every: 2 },
      created_at: "2026-09-01T00:00:00Z",
    })
    // due on 09-01, 09-03, 09-05... logged 03 and 05
    expect(currentStreak(h, ["2026-09-03", "2026-09-05"], "2026-09-05")).toBe(2)
  })

  it("counts a streak up to today including today's log", () => {
    const h = habit({ frequency_type: "daily" })
    expect(currentStreak(h, [THU, FRI], FRI)).toBe(2)
  })
})

describe("bestStreak", () => {
  it("returns the longest run", () => {
    const h = habit({ frequency_type: "daily" })
    const logs = [MON, TUE, WED, FRI] // 3-day run, gap, 1
    expect(bestStreak(h, logs, FRI)).toBe(3)
  })

  it("returns 0 when there are no logs", () => {
    expect(bestStreak(habit({}), [], FRI)).toBe(0)
  })
})

describe("completionRate", () => {
  it("is 1 when every due day is logged", () => {
    const h = habit({ frequency_type: "daily" })
    const logs = [daysAgo(1), daysAgo(0)]
    expect(completionRate(h, logs, 2)).toBe(1)
  })

  it("is 0.5 when half logged", () => {
    const h = habit({ frequency_type: "daily" })
    const logs = [daysAgo(1)]
    expect(completionRate(h, logs, 2)).toBe(0.5)
  })

  it("is 0 when nothing due", () => {
    const h = habit({ frequency_type: "every_n_days", frequency_value: { every: 99 }, created_at: "2026-08-01T00:00:00Z" })
    expect(completionRate(h, [], 5)).toBe(0)
  })
})

describe("weekCount", () => {
  it("counts logs in the current ISO week", () => {
    const h = habit({ frequency_type: "weekly", frequency_value: { times: 3 } })
    // 2026-09-07 (Mon) is the start of the week containing FRI 2026-09-11
    const logs = [MON, TUE, WED]
    expect(weekCount(h, logs, FRI)).toBe(3)
  })

  it("returns 0 for non-weekly habits", () => {
    expect(weekCount(habit({ frequency_type: "daily" }), [], FRI)).toBe(0)
  })
})

describe("toISODate helper", () => {
  it("formats local dates as yyyy-MM-dd", () => {
    expect(toISODate(new Date(2026, 8, 7))).toBe("2026-09-07")
  })
})