import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  actions,
  className,
  subtitle,
}: {
  title: React.ReactNode
  actions?: React.ReactNode
  className?: string
  subtitle?: string
}) {
  return (
    <header className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-balance font-rajdhani text-xl font-bold tracking-widest text-foreground sm:text-2xl text-glow-soft uppercase">
            {title}
          </h1>
          {subtitle && <p className="system-header mt-0.5 opacity-70">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div aria-hidden className="hall-divider w-full opacity-90" />
    </header>
  )
}
