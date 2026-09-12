"use client"

import { Plus } from "lucide-react"

export function CreateFab({
  onClick,
  label,
}: {
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed right-4 bottom-20 z-40 grid size-14 place-items-center rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/80 active:translate-y-px md:hidden"
    >
      <Plus className="size-6" />
    </button>
  )
}