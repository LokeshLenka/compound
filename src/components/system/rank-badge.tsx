import { cn } from "@/lib/utils";
import type { Rank } from "@/lib/ranking";
import { getRankDef } from "@/lib/ranking";

const RANK_META: Record<Rank, { label: string; color: string; glow: string }> = {
  E: { label: "E-RANK", color: "text-zinc-400", glow: "rgba(161,161,170,0.35)" },
  D: { label: "D-RANK", color: "text-emerald-400", glow: "rgba(52,211,153,0.4)" },
  C: { label: "C-RANK", color: "text-cyan-400", glow: "rgba(6,182,212,0.5)" },
  B: { label: "B-RANK", color: "text-sky-400", glow: "rgba(56,189,248,0.55)" },
  A: { label: "A-RANK", color: "text-violet-400", glow: "rgba(139,92,246,0.6)" },
  S: { label: "S-RANK", color: "text-amber-400", glow: "rgba(245,158,11,0.65)" },
  SS: { label: "SS-RANK", color: "text-pink-400", glow: "rgba(244,114,182,0.7)" },
  SSS: { label: "SSS-RANK", color: "text-rose-400", glow: "rgba(251,113,133,0.75)" },
  MONARCH: { label: "MONARCH", color: "text-white", glow: "rgba(255,215,0,0.9)" },
};

export function RankBadge({
  rank = "E",
  showLabel = true,
  size = "md",
  className,
}: {
  rank?: Rank;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = RANK_META[rank];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-bold tracking-widest border",
        size === "sm" && "text-[0.62rem] px-2 py-0.5 rounded",
        size === "md" && "text-xs px-2.5 py-1 rounded-md",
        size === "lg" && "text-sm px-3 py-1.5 rounded-lg",
        "border-current/30 bg-current/10",
        meta.color,
        className,
      )}
      style={{ boxShadow: `0 0 10px ${meta.glow}, 0 0 20px ${meta.glow}20` }}
    >
      <span className="size-1.5 rounded-full bg-current animate-pulse" aria-hidden />
      {showLabel ? meta.label : rank}
    </span>
  );
}

export function getRankFromLevel(level: number): Rank {
  if (level >= 50) return "S";
  if (level >= 30) return "A";
  if (level >= 20) return "B";
  if (level >= 10) return "C";
  if (level >= 5) return "D";
  return "E";
}

export function getRankFromStreak(streak: number): Rank {
  if (streak >= 30) return "S";
  if (streak >= 14) return "A";
  if (streak >= 7) return "B";
  if (streak >= 3) return "C";
  if (streak >= 1) return "D";
  return "E";
}
