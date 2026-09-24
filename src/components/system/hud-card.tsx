import * as React from "react";
import { cn } from "@/lib/utils";

export function HudCard({
  className,
  children,
  hover = true,
  ...props
}: React.ComponentProps<"div"> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "hud-frame scanlines rounded-lg p-4 card-shadow",
        hover && "hover-lift",
        className,
      )}
      {...props}
    >
      <div className="hud-corners" aria-hidden />
      {children}
    </div>
  );
}

export function HudCardHeader({
  icon,
  title,
  subtitle,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 mb-3", className)}>
      {icon && (
        <span className="grid size-8 place-items-center rounded border border-primary/25 bg-primary/10 text-primary text-sm">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
          {title}
        </h3>
        {subtitle && <p className="text-xs font-mono text-muted-foreground tracking-wide">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
