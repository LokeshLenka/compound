/**
 * Hunter Ranking — scalable realtime system
 *
 * Principles
 * - New user (no data) → E-RANK score ~0-2 LV.01. No free points.
 * - 0-100 score is weighted mean of 7 discipline vectors (30d window).
 * - Realtime: pure compute, no DB rank column. Called from useGlobalRank which
 *   memoizes on TanStack Query data. O(n), ~1ms. Optional Supabase Realtime
 *   can invalidate queries for live updates without extra infra.
 * - Scalable: no migrations, stateless, deterministic. Can later be moved to
 *   Postgres view or Edge Function without contract change.
 * - Gates: activity + streak gates prevent rank inflation. You must earn
 *   each rank with habit/vitals/vault discipline.
 */

export type Rank = "E" | "D" | "C" | "B" | "A" | "S" | "SS" | "SSS" | "MONARCH";

export interface RankDef {
  rank: Rank;
  label: string;
  title: string;
  minScore: number;
  maxScore: number;
  color: string;
  glow: string;
  bg: string;
  levelRange: string; // display helper e.g. LV.01-17
}

export const RANK_TABLE: RankDef[] = [
  { rank: "E", label: "E-RANK", title: "Novice Hunter", minScore: 0, maxScore: 14.99, color: "text-zinc-400", glow: "rgba(161,161,170,0.35)", bg: "bg-zinc-500/10", levelRange: "LV.01–15" },
  { rank: "D", label: "D-RANK", title: "Apprentice", minScore: 15, maxScore: 29.99, color: "text-emerald-400", glow: "rgba(52,211,153,0.45)", bg: "bg-emerald-500/10", levelRange: "LV.16–30" },
  { rank: "C", label: "C-RANK", title: "Adept", minScore: 30, maxScore: 44.99, color: "text-cyan-400", glow: "rgba(6,182,212,0.5)", bg: "bg-cyan-500/10", levelRange: "LV.31–45" },
  { rank: "B", label: "B-RANK", title: "Veteran", minScore: 45, maxScore: 59.99, color: "text-sky-400", glow: "rgba(56,189,248,0.55)", bg: "bg-sky-500/10", levelRange: "LV.46–60" },
  { rank: "A", label: "A-RANK", title: "Elite", minScore: 60, maxScore: 74.99, color: "text-violet-400", glow: "rgba(139,92,246,0.6)", bg: "bg-violet-500/10", levelRange: "LV.61–75" },
  { rank: "S", label: "S-RANK", title: "Master", minScore: 75, maxScore: 84.99, color: "text-amber-400", glow: "rgba(245,158,11,0.65)", bg: "bg-amber-500/10", levelRange: "LV.76–85" },
  { rank: "SS", label: "SS-RANK", title: "Grandmaster", minScore: 85, maxScore: 91.99, color: "text-pink-400", glow: "rgba(244,114,182,0.7)", bg: "bg-pink-500/10", levelRange: "LV.86–92" },
  { rank: "SSS", label: "SSS-RANK", title: "Monarch Candidate", minScore: 92, maxScore: 97.99, color: "text-rose-400", glow: "rgba(251,113,133,0.75)", bg: "bg-rose-500/10", levelRange: "LV.93–98" },
  { rank: "MONARCH", label: "MONARCH", title: "Shadow Monarch", minScore: 98, maxScore: 100, color: "text-white", glow: "rgba(255,215,0,0.9)", bg: "bg-yellow-500/15", levelRange: "LV.99–100" },
];

export function getRankDef(rank: Rank): RankDef {
  return RANK_TABLE.find((r) => r.rank === rank) ?? RANK_TABLE[0];
}

export function getRankFromScore(score: number): Rank {
  const s = Math.max(0, Math.min(100, score));
  for (let i = RANK_TABLE.length - 1; i >= 0; i--) {
    if (s >= RANK_TABLE[i].minScore) return RANK_TABLE[i].rank;
  }
  return "E";
}

export function getNextRankDef(rank: Rank): RankDef | null {
  const idx = RANK_TABLE.findIndex((r) => r.rank === rank);
  if (idx === -1 || idx === RANK_TABLE.length - 1) return null;
  return RANK_TABLE[idx + 1];
}

export interface GlobalMetrics {
  habitScore: number; // 0-100
  taskScore: number;
  waterScore: number;
  diaryScore: number;
  journalScore: number;
  vaultScore: number;
  debtScore: number;
}

export interface GlobalScore {
  score: number; // 0-100
  rank: Rank;
  rankDef: RankDef;
  nextRank: RankDef | null;
  progressToNext: number; // 0-100 within current rank
  breakdown: GlobalMetrics & { weighted: number };
  gates: { passed: boolean; reason?: string }[];
  level: number; // 1-100
}

const WEIGHTS: Record<keyof GlobalMetrics, number> = {
  habitScore: 0.25,
  taskScore: 0.2,
  waterScore: 0.15,
  diaryScore: 0.1,
  journalScore: 0.05,
  vaultScore: 0.15,
  debtScore: 0.1,
};

// Declarative gates — ordered high→low. First failing gate downgrades.
type GateRule = { rank: Rank; test: (m: GlobalMetrics, streak: number, txCount: number, totalLogs: number) => string | null };
const GATES: GateRule[] = [
  {
    rank: "MONARCH",
    test: (m, streak, txCount) => {
      if (streak < 30) return "Need 30-day streak for MONARCH";
      if (m.habitScore < 92) return "Habit ≥92 for MONARCH";
      if (m.waterScore < 88) return "Vitals ≥88 for MONARCH";
      if (m.vaultScore < 80) return "Vault ≥80 for MONARCH";
      if (m.debtScore < 85) return "Debt discipline ≥85";
      if (txCount < 15) return "Need 15+ vault records";
      return null;
    },
  },
  {
    rank: "SSS",
    test: (m, streak, _txCount) => {
      void _txCount;
      if (streak < 30) return "Need 30-day streak for SSS";
      if (m.habitScore < 85) return "Habit ≥85 for SSS";
      if (m.waterScore < 70) return "Vitals ≥70 for SSS";
      return null;
    },
  },
  {
    rank: "SS",
    test: (m, streak) => {
      if (streak < 21) return "Need 21-day streak for SS";
      if (m.habitScore < 75) return "Habit ≥75 for SS";
      return null;
    },
  },
  {
    rank: "S",
    test: (m, streak) => {
      if (streak < 14) return "Need 14-day streak for S";
      if (m.habitScore < 60) return "Habit ≥60 for S";
      if (m.waterScore < 45) return "Vitals ≥45 for S";
      return null;
    },
  },
  {
    rank: "A",
    test: (m, streak) => {
      if (streak < 7) return "Need 7-day streak for A";
      if (m.habitScore < 45) return "Habit ≥45 for A";
      return null;
    },
  },
  {
    rank: "B",
    test: (m, streak) => {
      if (streak < 3) return "Need 3-day streak for B";
      if (m.habitScore < 28) return "Habit ≥28 for B";
      return null;
    },
  },
  {
    rank: "C",
    test: (m, _s, _c, totalLogs) => {
      if (totalLogs < 5) return "Need 5+ discipline logs for C";
      if (m.habitScore < 15) return "Habit ≥15 for C";
      return null;
    },
  },
  {
    rank: "D",
    test: (m, _s, _c, totalLogs) => {
      if (totalLogs < 2) return "Complete 2 actions to rank D";
      if (m.habitScore < 5 && m.taskScore < 10 && m.waterScore < 10) return "Need some activity for D";
      return null;
    },
  },
];

function checkGates(score: number, metrics: GlobalMetrics, bestStreak: number, txCount: number, totalLogs: number): { rank: Rank; reason?: string } {
  const base = getRankFromScore(score);
  const order: Rank[] = ["MONARCH", "SSS", "SS", "S", "A", "B", "C", "D", "E"];
  const baseIdx = order.indexOf(base);
  if (baseIdx === -1) return { rank: "E" };
  let firstReason: string | undefined;
  // Walk downwards from base toward E; first failing gate downgrades one step at a time
  for (let idx = baseIdx; idx < order.length; idx++) {
    const rank = order[idx] as Rank;
    if (rank === "E") return { rank: "E", reason: firstReason };
    const rule = GATES.find((g) => g.rank === rank);
    if (!rule) {
      // No gate for this rank — it's achievable
      return { rank, reason: firstReason };
    }
    const reason = rule.test(metrics, bestStreak, txCount, totalLogs);
    if (reason) {
      if (!firstReason) firstReason = reason; // keep blocker closest to base for UI
      continue; // try next lower rank
    }
    return { rank, reason: firstReason };
  }
  return { rank: "E", reason: firstReason };
}

export function computeGlobalScore(params: {
  habitScore: number;
  taskScore: number;
  waterScore: number;
  diaryScore: number;
  journalScore: number;
  vaultScore: number;
  debtScore: number;
  bestStreak: number;
  txCount?: number;
  totalLogs?: number;
}): GlobalScore {
  const metrics: GlobalMetrics = {
    habitScore: clamp(params.habitScore),
    taskScore: clamp(params.taskScore),
    waterScore: clamp(params.waterScore),
    diaryScore: clamp(params.diaryScore),
    journalScore: clamp(params.journalScore),
    vaultScore: clamp(params.vaultScore),
    debtScore: clamp(params.debtScore),
  };

  const weighted =
    metrics.habitScore * WEIGHTS.habitScore +
    metrics.taskScore * WEIGHTS.taskScore +
    metrics.waterScore * WEIGHTS.waterScore +
    metrics.diaryScore * WEIGHTS.diaryScore +
    metrics.journalScore * WEIGHTS.journalScore +
    metrics.vaultScore * WEIGHTS.vaultScore +
    metrics.debtScore * WEIGHTS.debtScore;

  // No inflation curve — weighted is truth. Gentle top-hardening only above 70:
  // compress 70-100 into 70-100 with 0.85 factor so Monarch is earned, not gifted.
  let score = weighted;
  if (weighted > 70) {
    score = 70 + (weighted - 70) * 0.85;
  }
  score = Math.round(score * 10) / 10;

  const txCount = params.txCount ?? 0;
  const totalLogs = params.totalLogs ?? 0;

  const gated = checkGates(score, metrics, params.bestStreak, txCount, totalLogs);
  const finalRank = gated.rank;
  const rankDef = getRankDef(finalRank);
  const nextRank = getNextRankDef(finalRank);

  let progressToNext = 100;
  if (nextRank) {
    const range = nextRank.minScore - rankDef.minScore;
    const prog = range > 0 ? ((score - rankDef.minScore) / range) * 100 : 100;
    progressToNext = Math.max(0, Math.min(100, prog));
    // Gate-blocked ranks show progress capped at current score's headroom, not 100
    if (gated.reason) progressToNext = Math.min(progressToNext, 99);
  }

  const gates = gated.reason ? [{ passed: false, reason: gated.reason }] : [{ passed: true }];

  return {
    score,
    rank: finalRank,
    rankDef,
    nextRank,
    progressToNext,
    breakdown: { ...metrics, weighted: Math.round(weighted * 10) / 10 },
    gates,
    level: levelFromScore(score),
  };
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
}

export function levelFromScore(score: number): number {
  // Score 0 → LV.01, 100 → LV.100. No off-by-one inflation.
  const s = Math.max(0, Math.min(100, score));
  if (s === 0) return 1;
  return Math.max(1, Math.min(100, Math.floor(s) + 1));
}

export function xpToNextLevel(score: number): number {
  const lvl = levelFromScore(score);
  if (lvl >= 100) return 0;
  const nextRank = RANK_TABLE.find((r) => score < r.minScore);
  const threshold = nextRank?.minScore ?? 100;
  return Math.max(0, Math.round((threshold - score) * 10) / 10);
}

export function ranksCount(): number {
  return RANK_TABLE.length;
}

export const RANK_REQUIREMENTS: Record<Rank, string[]> = {
  E: ["All hunters start here", "LV.01 • 0 PTS"],
  D: ["Complete 2 actions", "Any habit/task/water activity"],
  C: ["5+ discipline logs (30d)", "Habit ≥15"],
  B: ["3-day streak", "Habit ≥28"],
  A: ["7-day streak", "Habit ≥45"],
  S: ["14-day streak", "Habit ≥60", "Vitals ≥45"],
  SS: ["21-day streak", "Habit ≥75"],
  SSS: ["30-day streak", "Habit ≥85", "Vitals ≥70"],
  MONARCH: ["30-day streak", "Habit ≥92", "Vitals ≥88", "Vault ≥80", "Debt ≥85", "15+ vault records"],
};

export function getRankRequirements(rank: Rank): string[] {
  return RANK_REQUIREMENTS[rank] ?? [];
}

export const RANK_WEIGHTS: { label: string; key: keyof GlobalMetrics; weight: number; color: string }[] = [
  { label: "DISCIPLINE (HABITS)", key: "habitScore", weight: 0.25, color: "primary" },
  { label: "FOCUS (GATES)", key: "taskScore", weight: 0.2, color: "violet" },
  { label: "VITALS (WATER)", key: "waterScore", weight: 0.15, color: "water" },
  { label: "VAULT (GOLD)", key: "vaultScore", weight: 0.15, color: "amber" },
  { label: "SHADOW (DIARY)", key: "diaryScore", weight: 0.1, color: "violet" },
  { label: "DEBT DISCIPLINE", key: "debtScore", weight: 0.1, color: "emerald" },
  { label: "CHRONICLE (JOURNAL)", key: "journalScore", weight: 0.05, color: "primary" },
];
