export type Rank = "E" | "D" | "C" | "B" | "A" | "S" | "SS" | "SSS" | "MONARCH"

export interface RankDef {
  rank: Rank
  label: string
  title: string
  minScore: number
  maxScore: number
  color: string
  glow: string
  bg: string
}

export const RANK_TABLE: RankDef[] = [
  { rank: "E", label: "E-RANK", title: "Novice Hunter", minScore: 0, maxScore: 17.99, color: "text-zinc-400", glow: "rgba(161,161,170,0.35)", bg: "bg-zinc-500/10" },
  { rank: "D", label: "D-RANK", title: "Apprentice", minScore: 18, maxScore: 31.99, color: "text-emerald-400", glow: "rgba(52,211,153,0.45)", bg: "bg-emerald-500/10" },
  { rank: "C", label: "C-RANK", title: "Adept", minScore: 32, maxScore: 47.99, color: "text-cyan-400", glow: "rgba(6,182,212,0.5)", bg: "bg-cyan-500/10" },
  { rank: "B", label: "B-RANK", title: "Veteran", minScore: 48, maxScore: 61.99, color: "text-sky-400", glow: "rgba(56,189,248,0.55)", bg: "bg-sky-500/10" },
  { rank: "A", label: "A-RANK", title: "Elite", minScore: 62, maxScore: 74.99, color: "text-violet-400", glow: "rgba(139,92,246,0.6)", bg: "bg-violet-500/10" },
  { rank: "S", label: "S-RANK", title: "Master", minScore: 75, maxScore: 84.99, color: "text-amber-400", glow: "rgba(245,158,11,0.65)", bg: "bg-amber-500/10" },
  { rank: "SS", label: "SS-RANK", title: "Grandmaster", minScore: 85, maxScore: 91.99, color: "text-pink-400", glow: "rgba(244,114,182,0.7)", bg: "bg-pink-500/10" },
  { rank: "SSS", label: "SSS-RANK", title: "Monarch Candidate", minScore: 92, maxScore: 96.99, color: "text-rose-400", glow: "rgba(251,113,133,0.75)", bg: "bg-rose-500/10" },
  { rank: "MONARCH", label: "MONARCH", title: "Shadow Monarch", minScore: 97, maxScore: 100, color: "text-white", glow: "rgba(255,215,0,0.9)", bg: "bg-yellow-500/15" },
]

export function getRankDef(rank: Rank): RankDef {
  return RANK_TABLE.find((r) => r.rank === rank) ?? RANK_TABLE[0]
}

export function getRankFromScore(score: number): Rank {
  const s = Math.max(0, Math.min(100, score))
  for (let i = RANK_TABLE.length - 1; i >= 0; i--) {
    if (s >= RANK_TABLE[i].minScore) return RANK_TABLE[i].rank
  }
  return "E"
}

export function getNextRankDef(rank: Rank): RankDef | null {
  const idx = RANK_TABLE.findIndex((r) => r.rank === rank)
  if (idx === -1 || idx === RANK_TABLE.length - 1) return null
  return RANK_TABLE[idx + 1]
}

export interface GlobalMetrics {
  habitScore: number // 0-100
  taskScore: number
  waterScore: number
  diaryScore: number
  journalScore: number
  vaultScore: number
  debtScore: number
}

export interface GlobalScore {
  score: number // 0-100
  rank: Rank
  rankDef: RankDef
  nextRank: RankDef | null
  progressToNext: number // 0-100 within current rank
  breakdown: GlobalMetrics & { weighted: number }
  gates: { passed: boolean; reason?: string }[]
}

const WEIGHTS: Record<keyof GlobalMetrics, number> = {
  habitScore: 0.25,
  taskScore: 0.20,
  waterScore: 0.15,
  diaryScore: 0.10,
  journalScore: 0.05,
  vaultScore: 0.15,
  debtScore: 0.10,
}

// Hard gates — must pass to claim that rank, otherwise stay at previous
function checkGates(score: number, metrics: GlobalMetrics, bestStreak: number, vaultScore: number): { rank: Rank; reason?: string } {
  const base = getRankFromScore(score)
  // Order to enforce: if base is high but gates fail, downgrade
  if (base === "MONARCH") {
    if (bestStreak < 30) return { rank: "SSS", reason: "Need 30-day streak for MONARCH" }
    if (metrics.habitScore < 92) return { rank: "SSS", reason: "Habit ≥92 for MONARCH" }
    if (metrics.waterScore < 90) return { rank: "SSS", reason: "Vitals ≥90 for MONARCH" }
    if (vaultScore < 85) return { rank: "SSS", reason: "Vault ≥85 for MONARCH" }
    if (metrics.debtScore < 95) return { rank: "SSS", reason: "Debt discipline ≥95" }
  }
  if (["MONARCH", "SSS"].includes(base)) {
    if (base === "SSS" && bestStreak < 30) return { rank: "SS", reason: "Need 30-day streak for SSS" }
    if (metrics.habitScore < 85) return { rank: "SS", reason: "Habit ≥85 for SSS" }
  }
  if (["MONARCH", "SSS", "SS"].includes(base)) {
    if (bestStreak < 21) return { rank: "S", reason: "Need 21-day streak for SS" }
    if (metrics.habitScore < 75) return { rank: "S", reason: "Habit ≥75 for SS" }
  }
  if (["MONARCH", "SSS", "SS", "S"].includes(base)) {
    if (bestStreak < 14) return { rank: "A", reason: "Need 14-day streak for S" }
    if (metrics.habitScore < 60) return { rank: "A", reason: "Habit ≥60 for S" }
    if (metrics.waterScore < 55) return { rank: "A", reason: "Vitals ≥55 for S" }
  }
  if (["MONARCH", "SSS", "SS", "S", "A"].includes(base)) {
    if (bestStreak < 7) return { rank: "B", reason: "Need 7-day streak for A" }
    if (metrics.habitScore < 45) return { rank: "B", reason: "Habit ≥45 for A" }
  }
  if (["MONARCH", "SSS", "SS", "S", "A", "B"].includes(base)) {
    if (bestStreak < 3) return { rank: "C", reason: "Need 3-day streak for B" }
  }
  if (base === "MONARCH" || base === "SSS" || base === "SS" || base === "S" || base === "A" || base === "B") {
    if (metrics.habitScore < 25) return { rank: "D", reason: "Habit ≥25 for C" }
  }
  return { rank: base }
}

export function computeGlobalScore(params: {
  habitScore: number
  taskScore: number
  waterScore: number
  diaryScore: number
  journalScore: number
  vaultScore: number
  debtScore: number
  bestStreak: number
}): GlobalScore {
  const metrics: GlobalMetrics = {
    habitScore: clamp(params.habitScore),
    taskScore: clamp(params.taskScore),
    waterScore: clamp(params.waterScore),
    diaryScore: clamp(params.diaryScore),
    journalScore: clamp(params.journalScore),
    vaultScore: clamp(params.vaultScore),
    debtScore: clamp(params.debtScore),
  }

  const weighted =
    metrics.habitScore * WEIGHTS.habitScore +
    metrics.taskScore * WEIGHTS.taskScore +
    metrics.waterScore * WEIGHTS.waterScore +
    metrics.diaryScore * WEIGHTS.diaryScore +
    metrics.journalScore * WEIGHTS.journalScore +
    metrics.vaultScore * WEIGHTS.vaultScore +
    metrics.debtScore * WEIGHTS.debtScore

  // Exponential hardness: apply curve to make top hard
  // scoreCurve = 100 * (1 - exp(-k * weighted/100)) / (1 - exp(-k)) with k=1.8
  const k = 1.8
  const normalized = weighted / 100
  const curved = 100 * (1 - Math.exp(-k * normalized)) / (1 - Math.exp(-k))
  // Blend 70% curved + 30% raw to keep linearity at bottom but hardness at top
  const score = Math.round((curved * 0.7 + weighted * 0.3) * 10) / 10

  const gated = checkGates(score, metrics, params.bestStreak, metrics.vaultScore)
  const finalRank = gated.rank
  const rankDef = getRankDef(finalRank)
  const nextRank = getNextRankDef(finalRank)

  let progressToNext = 100
  if (nextRank) {
    const range = nextRank.minScore - rankDef.minScore
    const prog = range > 0 ? ((score - rankDef.minScore) / range) * 100 : 100
    progressToNext = Math.max(0, Math.min(100, prog))
  }

  const gates = gated.reason ? [{ passed: false, reason: gated.reason }] : [{ passed: true }]

  return {
    score,
    rank: finalRank,
    rankDef,
    nextRank,
    progressToNext,
    breakdown: { ...metrics, weighted: Math.round(weighted * 10) / 10 },
    gates,
  }
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0))
}

export function levelFromScore(score: number): number {
  // Level 1-100, hard curve: level = floor(score * 1) but Monarch is 100
  return Math.max(1, Math.min(100, Math.floor(score) + 1))
}

export function xpToNextLevel(score: number): number {
  const lvl = levelFromScore(score)
  if (lvl >= 100) return 0
  const nextThreshold = RANK_TABLE.find((r) => score < r.minScore)?.minScore ?? 100
  return Math.max(0, Math.round((nextThreshold - score) * 10) / 10)
}
