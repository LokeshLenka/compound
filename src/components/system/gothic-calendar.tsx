"use client"
import { cn } from "@/lib/utils"

export function GothicCalendar({
  days,
  activeSet,
  title = "MARCH",
}: {
  days: string[] // YYYY-MM-DD
  activeSet: Set<string>
  title?: string
}) {
  // build weeks: 7 cols
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"]
  return (
    <div className="hud-frame border border-primary/20 bg-card/40 p-3">
      <div className="hud-corners" aria-hidden />
      <h3 className="text-center font-rajdhani text-sm font-bold tracking-[0.18em] text-primary text-glow-soft">{title}</h3>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center font-mono text-[0.62rem] font-bold tracking-widest text-violet-300">
        {weekdays.map((w) => (
          <span key={w} className="py-1 text-primary/60">{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const active = activeSet.has(d)
          const dayNum = Number(d.slice(8, 10))
          return (
            <div
              key={d}
              title={d}
              className={cn(
                "grid size-7 place-items-center border font-mono text-xs font-bold tabular-nums",
                active ? "border-primary/40 bg-primary text-primary-foreground shadow-[0_0_8px_rgba(168,85,247,0.35)]" : "border-primary/10 bg-muted/20 text-muted-foreground"
              )}
            >
              {dayNum}
            </div>
          )
        })}
      </div>
      {/* <div className="mt-2 h-1 w-full bg-muted/30">
        <div className="h-full bg-primary" style={{ width: `${Math.round((activeSet.size / Math.max(1, days.length)) * 100)}%` }} />
      </div> */}
    </div>
  )
}
