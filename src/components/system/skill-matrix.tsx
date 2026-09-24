"use client"
import { cn } from "@/lib/utils"

export function SkillMatrix({
  items,
}: {
  items: { label: string; value: number; max: number; sub?: string }[]
}) {
  return (
    <div className="space-y-2">
      {items.map((it) => {
        const pct = Math.max(2, Math.min(100, (it.value / it.max) * 100))
        return (
          <div key={it.label} className="hud-frame flex items-center gap-2 border border-primary/15 bg-card/30 px-2 py-1.5">
            <span className="w-24 shrink-0 font-mono text-[0.62rem] font-bold tracking-widest text-violet-300">{it.label.toUpperCase()}</span>
            <div className="relative flex-1 h-3 border border-primary/20 bg-muted/20">
              <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${pct}%`, clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)" }} />
              <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(168,85,247,0.08) 8px, rgba(168,85,247,0.08) 9px)" }} />
            </div>
            <span className="w-16 text-right font-mono text-xs font-bold tabular-nums text-primary">{it.value}/{it.max}</span>
            {it.sub && <span className="hidden sm:inline font-mono text-[0.58rem] tracking-wide text-muted-foreground">{it.sub}</span>}
          </div>
        )
      })}
    </div>
  )
}

export function PotionGrid({
  items,
}: {
  items: { icon: string; label: string; value: string; tint: string }[]
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {items.map((p) => (
        <div key={p.label} className={cn("hud-frame flex flex-col items-center gap-1 border p-2 text-center", p.tint)}>
          <span className="text-lg">{p.icon}</span>
          <span className="font-mono text-[0.58rem] font-bold tracking-widest">{p.label}</span>
          <span className="font-mono text-xs font-bold tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  )
}
