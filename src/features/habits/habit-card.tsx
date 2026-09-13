"use client"

import { Flame, Pencil, Trash2, CheckCircle2, Circle } from "lucide-react"
import { lastNDates, toISODate, humanDate } from "@/lib/dates"
import {
  currentStreak,
  weekCount,
  isDueOnDate,
  completionRate,
} from "@/lib/habits"
import { colorSoft } from "@/lib/colors"
import type { Habit, HabitLog } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useToggleLog } from "@/features/habits/use-habits"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const FREQ_LABELS: Record<string, string> = {
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Per week",
  every_n_days: "Every N days",
}

export function HabitCard({
  habit,
  logs,
  onEdit,
  onDelete,
  dragHandle,
}: {
  habit: Habit
  logs: HabitLog[]
  onEdit: (habit: Habit) => void
  onDelete: (habit: Habit) => void
  dragHandle?: React.ReactNode
}) {
  const toggleLog = useToggleLog()

  const logDates = logs
    .filter((l) => l.habit_id === habit.id)
    .map((l) => l.log_date)
  const logSet = new Set(logDates)

  const streak = currentStreak(habit, logDates)
  const rate = completionRate(habit, logDates, 30)
  const week = weekCount(habit, logDates)
  const weeklyTarget =
    habit.frequency_type === "weekly" ? (habit.frequency_value.times ?? 3) : null

  const strip = lastNDates(7)
  const today = toISODate(new Date())

  return (
    <Card className="h-fit">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl text-lg shadow-sm",
              colorSoft(habit.color),
            )}
            aria-hidden
          >
            {habit.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold tracking-tight">{habit.name}</h3>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  streak > 0
                    ? "bg-chart-1/12 text-chart-1"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Flame className="size-2.5" />
                {streak}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {habit.frequency_type === "every_n_days"
                ? `Every ${habit.frequency_value.every ?? 2} days`
                : FREQ_LABELS[habit.frequency_type]}
              {weeklyTarget !== null && ` · ${week}/${weeklyTarget} this week`}
            </p>
          </div>
          <div className="flex shrink-0 items-center">
            {dragHandle}
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={`Edit ${habit.name}`}
              onClick={() => onEdit(habit)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={`Delete ${habit.name}`}
              onClick={() => onDelete(habit)}
            >
              <Trash2 className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="flex justify-between gap-0.5">
          {strip.map((iso) => {
            const done = logSet.has(iso)
            const due = isDueOnDate(habit, iso)
            const isToday = iso === today
            const isFuture = iso > today
            return (
              <button
                key={iso}
                type="button"
                disabled={isFuture}
                onClick={() => toggleLog.mutate({ habit_id: habit.id, log_date: iso })}
                title={`${humanDate(iso)} — ${due ? "due" : "extra"}`}
                data-checkin-today={isToday ? "true" : undefined}
                data-checkin-date={iso}
                aria-label={`Toggle ${humanDate(iso)} check-in`}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 transition",
                  isFuture && "opacity-40",
                  !isFuture && "hover:bg-accent/60",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full transition",
                    done ? "bg-chart-1" : due ? "bg-muted" : "bg-border",
                  )}
                />
                {done ? (
                  <CheckCircle2 className="size-4 text-chart-1" />
                ) : (
                  <Circle
                    className={cn(
                      "size-4",
                      isToday ? "text-primary" : "text-muted-foreground/60",
                    )}
                  />
                )}
                <span className="text-[9px] leading-none text-muted-foreground">
                  {humanDate(iso, "EEE").slice(0, 2)}
                </span>
              </button>
            )
          })}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>30-day completion</span>
            <span>{Math.round(rate * 100)}%</span>
          </div>
          <Progress value={rate * 100} />
        </div>
      </CardContent>
    </Card>
  )
}