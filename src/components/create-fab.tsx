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
        "fixed right-4 bottom-20 z-40 grid size-14 place-items-center rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/80 active:translate-y-px md:hidden",
        className,
      )}
    >
      <Plus className="size-6" />
    </button>
  )
}