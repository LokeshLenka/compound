"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function StatBar({
  label,
  value,
  max = 100,
  color = "primary",
  showValue = true,
  size = "md",
}: {
  label: string;
  value: number;
  max?: number;
  color?: "primary" | "violet" | "emerald" | "amber" | "red" | "water";
  showValue?: boolean;
  size?: "sm" | "md";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const colorMap = {
    primary: "bg-primary shadow-[0_0_8px_rgba(168,85,247,0.6)]",
    violet: "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]",
    emerald: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    amber: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
    red: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    water: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]",
  };

  return (
    <div className={cn("space-y-1", size === "sm" && "space-y-0.5")}>
      <div className="flex items-center justify-between">
        <span className={cn("font-mono font-bold tracking-widest text-muted-foreground", size === "sm" ? "text-[0.62rem]" : "text-[0.68rem]")}>
          {label}
        </span>
        {showValue && (
          <span className={cn("font-mono tabular-nums text-primary text-glow-soft", size === "sm" ? "text-xs" : "text-xs")}>
            {value}
            <span className="text-muted-foreground"> / {max}</span>
          </span>
        )}
      </div>
      <div className={cn("relative overflow-hidden rounded-full bg-muted/60 border border-primary/10", size === "sm" ? "h-1.5" : "h-2")}>
        <motion.div
          className={cn("absolute inset-y-0 left-0 rounded-full", colorMap[color])}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 20, delay: 0.15 }}
        />
        {/* scanline shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40" />
      </div>
    </div>
  );
}

export function HoloDivider({ className }: { className?: string }) {
  return (
    <div className={cn("h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent", className)} />
  );
}
