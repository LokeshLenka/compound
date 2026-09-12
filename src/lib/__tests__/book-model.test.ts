import { describe, expect, it } from "vitest"
import { bookSpread, entryFor, shiftISO } from "@/features/diary/book-model"
import type { DiaryEntry } from "@/lib/types"

const NOW = "2026-09-12"

function entry(date: string): DiaryEntry {
  return {
    id: `e-${date}`,
    user_id: "u",
    entry_date: date,
    title: "Test",
    content: "Hello",
    mood: 3,
    weather: null,
    tags: [],
    created_at: `${date}T00:00:00.000Z`,
    updated_at: `${date}T00:00:00.000Z`,
  }
}

describe("book-model", () => {
  it("shiftISO moves across month boundaries", () => {
    expect(shiftISO("2026-01-31", 1)).toBe("2026-02-01")
    expect(shiftISO("2026-03-01", -1)).toBe("2026-02-28")
  })

  it("entryFor finds the matching day", () => {
    const entryA = entry("2026-09-01")
    expect(entryFor([entryA, entry("2026-09-02")], "2026-09-01")).toBe(entryA)
    expect(entryFor([entryA], "2026-09-03")).toBeNull()
  })

  it("builds a spread with left + next-day right", () => {
    const s = bookSpread("2026-09-05", [entry("2026-09-01"), entry("2026-09-05")], NOW)
    expect(s.leftIso).toBe("2026-09-05")
    expect(s.rightIso).toBe("2026-09-06")
  })

  it("cannot flip forward past today", () => {
    const atToday = bookSpread(NOW, [entry("2026-09-05"), entry("2026-09-06")], NOW)
    expect(atToday.hasNext).toBe(false)
    const beforeToday = bookSpread("2026-09-06", [entry("2026-09-05"), entry("2026-09-06")], NOW)
    expect(beforeToday.hasNext).toBe(true)
  })

  it("does not cap the book at the last entry when an entry is in the past", () => {
    const s = bookSpread("2026-09-06", [entry("2026-09-05"), entry("2026-09-06")], NOW)
    expect(s.hasNext).toBe(true)
  })

  it("cannot flip before the earliest entry", () => {
    const s = bookSpread("2026-09-05", [entry("2026-09-05"), entry("2026-09-09")], NOW)
    expect(s.hasPrev).toBe(false)
    expect(s.hasNext).toBe(true)
  })

  it("falls back to today when selectedDate is empty", () => {
    const s = bookSpread("", [], NOW)
    expect(s.leftIso).toBe(NOW)
    expect(s.rightIso).toBe("2026-09-13")
    expect(s.hasPrev).toBe(false)
    expect(s.hasNext).toBe(false)
  })
})