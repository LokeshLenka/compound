import * as React from "react";
import { cn } from "@/lib/utils";

export function SystemWindow({
  title,
  subtitle,
  icon,
  children,
  className,
  headerActions,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  variant?: "default" | "alert" | "success";
}) {
  return (
    <div
      className={cn(
        "hud-frame scanlines rounded-lg overflow-hidden animate-enter",
        variant === "alert" && "border-destructive/40",
        variant === "success" && "border-emerald-400/30",
        className,
      )}
      {...props}
    >
      <div className="hud-corners" aria-hidden />
      {/* Header bar */}
      <div
        className={cn(
          "relative flex items-center gap-3 px-4 py-2.5 border-b backdrop-blur",
          variant === "alert"
            ? "bg-destructive/10 border-destructive/20"
            : variant === "success"
              ? "bg-emerald-500/10 border-emerald-400/20"
              : "bg-primary/10 border-primary/20",
        )}
      >
        {/* scanline subtle bar */}
        <div className="absolute inset-0 opacity-30 scanlines pointer-events-none" aria-hidden />
        {icon && (
          <span
            className={cn(
              "grid size-7 place-items-center rounded border text-xs",
              variant === "alert"
                ? "bg-destructive/20 border-destructive/30 text-destructive"
                : variant === "success"
                  ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-400"
                  : "bg-primary/15 border-primary/30 text-primary",
            )}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="system-header leading-none text-glow-soft">{title}</h2>
          {subtitle && (
            <p className="text-[0.68rem] font-mono tracking-wide text-muted-foreground tabular-nums">
              {subtitle}
            </p>
          )}
        </div>
        {headerActions && <div className="flex items-center gap-1.5">{headerActions}</div>}
        {/* top glow line */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>

      <div className="p-4 bg-card/40">{children}</div>
    </div>
  );
}

export function SystemStatusRow({
  label,
  value,
  subvalue,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  subvalue?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-primary/10 bg-primary/[0.04] px-3 py-2">
      <span className="flex items-center gap-2 text-[0.68rem] font-mono font-semibold tracking-widest text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right">
        <span className="text-sm font-bold tabular-nums text-foreground text-glow-soft">{value}</span>
        {subvalue && <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">/ {subvalue}</span>}
      </span>
    </div>
  );
}
