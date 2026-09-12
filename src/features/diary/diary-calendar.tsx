"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { monthGrid, monthLabel, todayISO } from "@/lib/dates"
import { moodEmoji } from "@/features/diary/moods"
import type { DiaryEntry } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

export function DiaryCalendar({
  entries,
  selectedDate,
  onSelect,
}: {
  entries: DiaryEntry[]
  selectedDate: string
  onSelect: (date: string) => void
}) {
  const today = todayISO()
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })

  const byDate = new Map(entries.map((e) => [e.entry_date, e]))
  const grid = monthGrid(cursor.year, cursor.month)
  const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`

  function shift(delta: number) {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3 card-shadow">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="size-8" aria-label="Previous month" onClick={() => shift(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-sm font-semibold" data-testid="diary-month-label">
          {monthLabel(key)}
        </p>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Next month" onClick={() => shift(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_LABELS.map((d) => (
          <span key={d} className="py-1 text-[10px] font-medium uppercase text-muted-foreground">
            {d}
          </span>
        ))}
        {grid.map((iso, i) =>
          iso === null ? (
            <span key={`blank-${i}`} />
          ) : (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-full text-xs transition",
                iso === selectedDate && "bg-primary text-primary-foreground font-semibold shadow-sm",
                iso === today && "ring-1 ring-primary",
                iso !== selectedDate && "hover:bg-accent",
                iso > today && "opacity-40",
              )}
            >
              <span>{Number(iso.slice(8))}</span>
              <span className="text-sm leading-none" aria-hidden>
                {moodEmoji(byDate.get(iso)?.mood)}
              </span>
            </button>
          ),
        )}
      </div>
    </div>
  )
}