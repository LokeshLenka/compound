import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  actions,
  className,
}: {
  title: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div aria-hidden className="hall-divider w-full opacity-90" />
    </header>
  )
}
