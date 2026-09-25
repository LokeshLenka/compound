"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Crown, Trophy, ArrowRight, Shield, Zap, Sparkles, Target, Activity } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RankBadge } from "@/components/system/rank-badge";
import { useGlobalRank } from "@/features/ranking/use-global-rank";
import { RANK_TABLE, RANK_REQUIREMENTS, RANK_WEIGHTS, ranksCount, getRankDef } from "@/lib/ranking";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RanksClient() {
  const { rank: currentRank, score, level, nextRank, progressToNext, gates, metrics } = useGlobalRank();
  const total = ranksCount();
  const currentDef = getRankDef(currentRank);
  const blocked = gates[0] && !gates[0].passed ? gates[0].reason : null;

  return (
    <div className="space-y-8 pb-6">
      <PageHeader
        title="Hunter Ranks"
        subtitle={`All ${total} ranks — from Novice to Shadow Monarch`}
        actions={
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:inline-flex")}>
            Back to Dossier <ArrowRight className="size-4" />
          </Link>
        }
      />

      {/* HERO — current rank, big and readable */}
      <Card className="overflow-hidden border-primary/20 bg-card">
        <div className="bg-gradient-to-r from-primary/15 via-violet-500/10 to-transparent px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-14 place-items-center rounded-xl border border-primary/20 bg-primary/10 sm:size-16">
                <Crown className="size-7 text-primary sm:size-8" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Your Rank</p>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {currentDef.label} — {currentDef.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Level {String(level).padStart(2, "0")} · Score {score.toFixed(1)} / 100 {nextRank ? `· ${ (nextRank.minScore - score).toFixed(1)} to ${nextRank.label}` : "· MAX"}
                </p>
              </div>
            </div>
            <RankBadge rank={currentRank} size="lg" />
          </div>
        </div>
        <CardContent className="space-y-3 pt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {currentDef.label} · {currentDef.minScore} pts
            </span>
            <span>{nextRank ? `${nextRank.label} · ${nextRank.minScore} pts` : "MONARCH · 98 pts"}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full border border-primary/20 bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className={cn("text-center text-sm font-medium", blocked ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
            {blocked ? `Locked: ${blocked}` : `Progress ${progressToNext.toFixed(0)}% to ${nextRank?.label ?? "Monarch"} · Keep grinding, Hunter`}
          </p>
        </CardContent>
      </Card>

      {/* HOW IT WORKS — plain language, readable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-5 text-primary" /> How ranking works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-foreground">
          <p className="text-muted-foreground">
            Your rank updates <span className="font-semibold text-foreground">instantly</span> whenever you log a habit, finish a task, drink water, write, or manage your vault. New hunters always start at{" "}
            <span className="font-semibold text-foreground">E-Rank · Level 1</span> — no free points.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {RANK_WEIGHTS.map((w) => (
              <div key={w.key} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-3">
                <span className="text-sm font-medium text-foreground">{w.label.toLowerCase().replace("(habits)", "").replace("(gates)", "").trim()}</span>
                <span className="rounded bg-background px-2 py-1 text-sm font-bold tabular-nums">{Math.round(w.weight * 100)}%</span>
              </div>
            ))}
          </div>
          <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
            <span className="font-semibold text-primary">Formula:</span> Score is the weighted average of your 7 scores (last 30 days). Above 70, progress slows a little to keep Monarch truly hard. No vault logs = 0, no debts until you have 3+ total logs = 0 (then 100 when you stay debt-free).
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{total} ranks</span>
            <span className="rounded-full border px-3 py-1 text-xs font-medium">Level 1 → 100</span>
            <span className="rounded-full border px-3 py-1 text-xs font-medium">30-day window</span>
            <span className="rounded-full border px-3 py-1 text-xs font-medium">Gates block skips</span>
          </div>
        </CardContent>
      </Card>

      {/* YOUR CURRENT DISCIPLINE — larger bars labels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-5 text-primary" /> Your discipline right now
          </CardTitle>
          <p className="text-sm text-muted-foreground">Each bar is 0–100 from the last 30 days. Improve these to rank up.</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Habits</span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">{metrics.habitScore}/100</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${metrics.habitScore}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Tasks</span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">{metrics.taskScore}/100</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${metrics.taskScore}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Hydration</span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">{metrics.waterScore}/100</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${metrics.waterScore}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Vault (savings)</span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">{metrics.vaultScore}/100</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${metrics.vaultScore}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Diary</span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">{metrics.diaryScore}/100</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${metrics.diaryScore}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Journal</span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">{metrics.journalScore}/100</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${metrics.journalScore}%` }} />
            </div>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Debt discipline</span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">{metrics.debtScore}/100</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", metrics.debtScore < 50 ? "bg-red-500" : "bg-emerald-500")}
                style={{ width: `${metrics.debtScore}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ALL 9 RANKS — clean, spacious, readable */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Shield className="size-5 text-primary" /> All {total} Ranks
        </h2>
        <p className="text-sm text-muted-foreground">Tap your current rank to see extra detail. Every rank needs points <span className="font-semibold text-foreground">and</span> discipline — you can&apos;t skip ahead.</p>

        <div className="grid gap-4">
          {RANK_TABLE.map((r, idx) => {
            const isActive = r.rank === currentRank;
            const isPast = score >= r.minScore;
            const isNext = nextRank?.rank === r.rank;
            const req = RANK_REQUIREMENTS[r.rank];
            return (
              <motion.div
                key={r.rank}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.28 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden transition-all",
                    isActive ? "border-primary shadow-md ring-1 ring-primary/20" : isPast ? "border-primary/20" : "opacity-90",
                  )}
                >
                  <div className="flex">
                    <div className={cn("w-1.5 shrink-0", r.rank === "E" ? "bg-zinc-400" : r.rank === "D" ? "bg-emerald-400" : r.rank === "C" ? "bg-cyan-400" : r.rank === "B" ? "bg-sky-400" : r.rank === "A" ? "bg-violet-500" : r.rank === "S" ? "bg-amber-400" : r.rank === "SS" ? "bg-pink-400" : r.rank === "SSS" ? "bg-rose-400" : "bg-yellow-500")} />
                    <div className="flex-1 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="hidden sm:grid size-9 place-items-center rounded-lg border bg-muted text-sm font-bold tabular-nums text-muted-foreground">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <RankBadge rank={r.rank} size="md" />
                          <div>
                            <p className="text-base font-bold leading-none text-foreground">{r.label}</p>
                            <p className="text-sm text-muted-foreground">{r.title}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium tabular-nums">
                            {r.minScore} – {r.maxScore} pts
                          </span>
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{r.levelRange}</span>
                          {isActive && <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">You are here</span>}
                          {isNext && !isActive && <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300">Next</span>}
                          {!isPast && !isActive && <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">Locked</span>}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Zap className="size-3.5" /> Requirements
                        </p>
                        <ul className="grid gap-1.5 sm:grid-cols-2">
                          {req.map((q) => (
                            <li key={q} className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm leading-snug text-foreground">
                              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {(isActive || isNext) && (
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                          <div className={cn("h-full rounded-full transition-all", isActive ? "bg-primary" : "bg-primary/40")} style={{ width: isActive ? `${Math.max(10, progressToNext)}%` : "4%" }} />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* FOOTER CTA */}
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="size-4 text-primary" /> Ready to climb? Complete habits, water, and vault tasks to ascend.
          </span>
          <div className="flex gap-2">
            <Link href="/habits" className={cn(buttonVariants({ variant: "default" }))}>
              Daily Quests
            </Link>
            <Link href="/analytics" className={cn(buttonVariants({ variant: "outline" }))}>
              <Trophy className="size-4" /> System Stats
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
