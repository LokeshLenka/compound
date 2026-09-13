"use client"

import { motion } from "motion/react"
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
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className={cn(
        "fixed right-4 bottom-24 z-40 grid size-14 place-items-center rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-lg touch-manipulation md:hidden",
        "bottom-[calc(6rem+env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <Plus className="size-6" />
    </motion.button>
  )
}