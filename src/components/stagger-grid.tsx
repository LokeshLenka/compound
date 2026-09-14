"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

/** Staggered grid container — children animate in one after another. */
export function StaggerGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  )
}

/** Item inside a StaggerGrid — fades + rises with a spring. */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={cn("min-w-0 w-full", className)}
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 380, damping: 30 },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
