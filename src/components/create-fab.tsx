"use client"

import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function CreateFab({
  onClick,
  label,
  className,
}: {
  onClick: () => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "fixed right-4 bottom-24 z-40 grid size-14 place-items-center rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-lg transition-all touch-manipulation hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95 md:hidden",
        "bottom-[calc(6rem+env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <Plus className="size-6" />
    </button>
  )
}