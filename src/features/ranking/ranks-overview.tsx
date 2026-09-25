"use client";

import { RANK_TABLE, ranksCount } from "@/lib/ranking";
import { RankBadge } from "@/components/system/rank-badge";
import { useGlobalRank } from "./use-global-rank";
import { cn } from "@/lib/utils";

export function RanksOverview({ compact = false }: { compact?: boolean }) {
  const { rank: currentRank, score } = useGlobalRank();
  const total = ranksCount();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[0.62rem] tracking-[0.16em] text-primary">
          RANK CODEX — {total} RANKS REGISTERED
        </h3>
        <span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[0.62rem] tracking-widest text-primary">
          {currentRank} · {score.toFixed(1)}
        </span>
      </div>

      {!compact && (
        <p className="font-mono text-[0.62rem] leading-relaxed tracking-wide text-muted-foreground">
          Ascend from <span className="text-foreground">E-RANK Novice</span> to{" "}
          <span className="text-yellow-400">MONARCH</span>. New hunters start at LV.01. Gates block rank skips — you must earn discipline before power.
        </p>
      )}

      <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3")}>
        {RANK_TABLE.map((r) => {
          const isActive = r.rank === currentRank;
          const isPast = score >= r.minScore;
          const isLocked = !isPast && !isActive;
          return (
            <div
              key={r.rank}
              className={cn(
                "relative flex flex-col gap-1.5 rounded border px-2.5 py-2.5 text-left transition-all",
                isActive
                  ? "border-primary/40 bg-primary/10 shadow-[0_0_14px_rgba(168,85,247,0.22)] scale-[1.02]"
                  : isPast
                    ? "border-primary/15 bg-card/40 hover:border-primary/25"
                    : "border-muted/20 bg-muted/5 opacity-60",
              )}
            >
              {isActive && <span className="absolute -top-1.5 right-2 rounded bg-primary px-1 py-0.5 font-mono text-[0.54rem] font-bold tracking-widest text-primary-foreground">CURRENT</span>}
              <div className="flex items-center gap-2">
                <RankBadge rank={r.rank} size={compact ? "sm" : "md"} />
                <div className="min-w-0">
                  <p className={cn("truncate font-mono text-[0.62rem] font-bold tracking-widest", isActive ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground")}>
                    {r.label}
                  </p>
                  <p className="truncate font-mono text-[0.58rem] tracking-wide text-muted-foreground">{r.title}</p>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between font-mono text-[0.58rem] tracking-widest">
                <span className={cn("tabular-nums", isActive ? "text-primary" : "text-muted-foreground")}>{r.minScore} PTS</span>
                <span className="text-muted-foreground/70">{r.levelRange}</span>
              </div>
              {/* mini bar */}
              <div className="h-1 overflow-hidden rounded-full bg-muted/30">
                <div
                  className={cn("h-full transition-all", isActive ? "bg-primary" : isPast ? "bg-primary/60" : "bg-muted/30")}
                  style={{ width: isActive ? "55%" : isPast ? "100%" : "0%" }}
                />
              </div>
              {isLocked && <span className="font-mono text-[0.54rem] tracking-widest text-muted-foreground/60">LOCKED</span>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5 font-mono text-[0.58rem] tracking-widest">
        <span className="rounded border border-zinc-500/20 bg-zinc-500/10 px-2 py-1 text-zinc-300">TOTAL {total}</span>
        <span className="rounded border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-violet-300">E → MONARCH</span>
        <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">REALTIME</span>
      </div>
    </div>
  );
}
