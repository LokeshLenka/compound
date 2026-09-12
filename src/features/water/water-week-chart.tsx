import { cn } from "@/lib/utils"
import { dailyTotals, formatAmount, formatCompact } from "@/lib/water"
import type { WaterLog, WaterUnit } from "@/lib/types"

/**
 * Last-7-days water intake bars, each calendar day normalized against the
 * goal. Bars that hit the goal get the water tint; today is highlighted.
 * The chart stretches to fill its parent (items-stretch) with a sensible
 * minimum height so the card never looks squished.
 */
export function WaterWeekChart({
  logs,
  goalMl,
  unit,
  now = new Date(),
  className,
}: {
  logs: WaterLog[]
  goalMl: number
  unit: WaterUnit
  now?: Date
  className?: string
}) {
  const days = dailyTotals(logs, 7, now)
  const max = Math.max(goalMl, ...days.map((d) => d.totalMl), 1)

  return (
    <div className={cn("flex min-h-44 flex-1 items-stretch gap-1.5", className)}>
      {days.map((d) => {
        const pct = Math.round((d.totalMl / max) * 100)
        const met = d.totalMl >= goalMl
        const isToday = d.date === days[days.length - 1].date
        const firstWkday = new Date(d.date + "T12:00:00").toLocaleDateString([], { weekday: "short" }).charAt(0)
        return (
          <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${firstWkday} · ${formatAmount(d.totalMl, unit)}${met ? " · goal met" : ""}`}>
            <span
              aria-hidden
              className={cn(
                "text-[9px] font-semibold tabular-nums",
                d.totalMl > 0 ? "text-muted-foreground" : "text-transparent",
              )}
            >
              {d.totalMl > 0 ? formatCompact(d.totalMl, unit) : "–"}
            </span>
            <div className="flex min-h-28 w-full flex-1 items-end rounded-full bg-muted/50">
              <div
                data-testid="water-week-bar"
                data-met={met ? "true" : "false"}
                className={cn(
                  "w-full rounded-full transition-colors",
                  met ? "bg-chart-water" : "bg-chart-water/30",
                  isToday && met && "ring-1 ring-chart-water",
                )}
                style={{ height: `${Math.max(4, pct)}%` }}
              />
            </div>
            <span className={cn("text-[10px] font-medium", isToday ? "text-foreground" : "text-muted-foreground")}>
              {firstWkday}
            </span>
          </div>
        )
      })}
    </div>
  )
}
