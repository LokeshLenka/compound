import { cn } from "@/lib/utils"
import { formatAmount, remainingMl } from "@/lib/water"
import type { WaterUnit } from "@/lib/types"

export function WaterProgressRing({
  totalMl,
  goalMl,
  unit,
  className,
}: {
  totalMl: number
  goalMl: number
  unit: WaterUnit
  className?: string
}) {
  const pct = goalMl > 0 ? Math.min(100, (totalMl / goalMl) * 100) : 0
  const radius = 72
  const circumference = 2 * Math.PI * radius
  const dash = (pct / 100) * circumference
  const done = totalMl >= goalMl
  const rest = remainingMl(totalMl, goalMl)

  return (
    <div className={cn("relative grid place-items-center", className)}>
      <svg viewBox="0 0 160 160" className="size-40 -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-muted/70"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          data-testid="water-ring-arc"
          className={cn(
            "transition-[stroke-dasharray] duration-500 ease-out",
            done ? "text-chart-2" : "text-chart-water",
          )}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {formatAmount(totalMl, unit)}
          </p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {done ? "Goal reached" : `${formatAmount(rest, unit)} to go`}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/80">
            of {formatAmount(goalMl, unit)} daily
          </p>
        </div>
      </div>
    </div>
  )
}