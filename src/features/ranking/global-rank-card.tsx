"use client";

import { useState } from "react";
import { Trophy, ChevronDown } from "lucide-react";
import { SystemWindow } from "@/components/system/system-window";
import { RankBadge } from "@/components/system/rank-badge";
import { HudCard, HudCardHeader } from "@/components/system/hud-card";
import { StatBar } from "@/components/system/stat-bar";
import { useGlobalRank } from "./use-global-rank";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function RankDetailsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { score, rank, rankDef, nextRank, progressToNext, level, metrics } =
    useGlobalRank();
  const weighted =
    metrics.habitScore * 0.25 +
    metrics.taskScore * 0.2 +
    metrics.waterScore * 0.15 +
    metrics.diaryScore * 0.1 +
    metrics.journalScore * 0.05 +
    metrics.vaultScore * 0.15 +
    metrics.debtScore * 0.1;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-xs tracking-[0.16em] text-primary">
            RANK BREAKDOWN — {rankDef.title.toUpperCase()}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center font-mono text-[0.62rem] tracking-widest">
            <span className="flex flex-col items-center justify-center border border-primary/15 bg-primary/10 py-2 text-primary">
              LV.{String(level).padStart(2, "0")}
              <span className="text-[0.58rem] text-muted-foreground">
                LEVEL
              </span>
            </span>
            <span className="flex flex-col items-center justify-center border border-violet-400/20 bg-violet-500/10 py-2 text-violet-300">
              {score.toFixed(1)}
              <span className="text-[0.58rem] text-muted-foreground">
                SCORE /100
              </span>
            </span>
            <span className="flex flex-col items-center justify-center border border-amber-400/20 bg-amber-500/10 py-2 text-amber-300">
              {nextRank ? (
                <>
                  {Math.max(0, nextRank.minScore - score).toFixed(1)}
                  <span className="text-[0.58rem] text-muted-foreground">
                    {score >= nextRank.minScore ? "READY" : `TO ${nextRank.rank}`}
                  </span>
                </>
              ) : (
                "MAX"
              )}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[0.62rem] tracking-widest text-muted-foreground">
              <span>
                {rankDef.label} · {rankDef.minScore} PTS
              </span>
              <span>
                {nextRank
                  ? `${nextRank.label} · ${nextRank.minScore} PTS`
                  : "MONARCH"}
              </span>
            </div>
            <div className="h-2 border border-primary/20 bg-muted/30">
              <div
                className="h-full bg-primary shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <p className="text-center font-mono text-[0.62rem] tracking-widest text-primary">
              {progressToNext.toFixed(0)}% · {score.toFixed(1)}/100
            </p>
          </div>

          <HudCard>
            <HudCardHeader
              title="RANK MATRIX"
              subtitle="7 PARAMETERS · WEIGHTED"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <StatBar
                label="DISCIPLINE (HABITS)"
                value={metrics.habitScore}
                max={100}
                color="primary"
              />
              <StatBar
                label="FOCUS (GATES)"
                value={metrics.taskScore}
                max={100}
                color="violet"
              />
              <StatBar
                label="VITALS (WATER)"
                value={metrics.waterScore}
                max={100}
                color="water"
              />
              <StatBar
                label="SHADOW (DIARY)"
                value={metrics.diaryScore}
                max={100}
                color="violet"
              />
              <StatBar
                label="CHRONICLE (JOURNAL)"
                value={metrics.journalScore}
                max={100}
                color="primary"
              />
              <StatBar
                label="VAULT (GOLD)"
                value={metrics.vaultScore}
                max={100}
                color="amber"
              />
              <StatBar
                label="DEBT DISCIPLINE"
                value={metrics.debtScore}
                max={100}
                color={metrics.debtScore < 50 ? "red" : "emerald"}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[0.62rem] tracking-widest">
              <span className="border border-primary/20 bg-primary/10 px-2 py-1 text-primary">
                WEIGHTED {weighted.toFixed(1)}
              </span>
              <span className="border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-violet-300">
                CURVED {score.toFixed(1)}
              </span>
              <span className="border border-zinc-400/20 bg-zinc-500/10 px-2 py-1 text-zinc-300">
                STREAK {metrics.bestStreak}
              </span>
            </div>
          </HudCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GlobalRankCard({
  variant = "full",
}: {
  variant?: "full" | "compact";
}) {
  const { score, rank, rankDef, nextRank, progressToNext, level, gates } =
    useGlobalRank();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const blocked = gates[0] && !gates[0].passed ? gates[0].reason : null;

  const subtitle = `LV.${String(level).padStart(2, "0")} · ${score.toFixed(1)}/100`;
  const showSheet = () => setDetailsOpen(true);

  if (variant === "compact") {
    return (
      <>
        <SystemWindow
          title={` ${rankDef.title.toUpperCase()}`}
          subtitle={subtitle}
          icon={<Trophy className="size-3" />}
          headerActions={<RankBadge rank={rank} size="md" />}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between font-mono text-[0.62rem] tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                {blocked ? (
                  <span className="text-amber-400">BLOCKED</span>
                ) : (
                  <span className="text-emerald-400">ASCENDING</span>
                )}
              </span>
              <span>
                {rankDef.label} → {nextRank?.label ?? "MAX"}
              </span>
            </div>

            <div className="h-2 border border-primary/20 bg-muted/30">
              <div
                className="h-full bg-primary shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all"
                style={{ width: `${progressToNext}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.62rem] tracking-widest text-muted-foreground">
                {blocked
                  ? `◆ ${blocked}`
                  : `◆ ${progressToNext.toFixed(0)}% to ${nextRank?.rank ?? "MONARCH"}`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 font-mono text-[0.62rem] tracking-widest"
                onClick={showSheet}
              >
                Details <ChevronDown className="size-3" />
              </Button>
            </div>
          </div>
        </SystemWindow>
        <RankDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} />
      </>
    );
  }

  return (
    <>
      <SystemWindow
        title={`HUNTER RANK — ${rankDef.title.toUpperCase()}`}
        subtitle={subtitle}
        icon={<Trophy className="size-3" />}
        headerActions={<RankBadge rank={rank} size="lg" />}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-[0.62rem] tracking-widest text-muted-foreground">
            <span>{rankDef.label}</span>
            <span>{nextRank?.label ?? "MONARCH"}</span>
          </div>
          <div className="h-2.5 border border-primary/20 bg-muted/30">
            <div
              className="h-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.6)] transition-all duration-500"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.62rem] tracking-widest text-muted-foreground">
              {blocked
                ? `◆ ${blocked}`
                : `◆ ${progressToNext.toFixed(0)}% to ${nextRank?.rank ?? "MONARCH"}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 font-mono text-xs tracking-widest"
              onClick={showSheet}
            >
              View breakdown <ChevronDown className="size-3" />
            </Button>
          </div>
        </div>
      </SystemWindow>
      <RankDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} />
    </>
  );
}
