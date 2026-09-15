"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Plus, ListChecks, Repeat, Wallet } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

type QuickAddType = "task" | "habit" | "transaction"

const items: { type: QuickAddType; label: string; icon: typeof ListChecks }[] = [
  { type: "task", label: "New task", icon: ListChecks },
  { type: "habit", label: "New habit", icon: Repeat },
  { type: "transaction", label: "New transaction", icon: Wallet },
]

function DropdownItems({
  onSelect,
  onClose,
}: {
  onSelect: (type: QuickAddType) => void
  onClose: () => void
}) {
  return (
    <>
      {items.map((item) => (
        <DropdownMenuItem
          key={item.type}
          onClick={() => {
            onClose()
            onSelect(item.type)
          }}
          className="gap-2"
        >
          <item.icon className="size-4" />
          {item.label}
        </DropdownMenuItem>
      ))}
    </>
  )
}

export function DashboardQuickAddMobile({
  onSelect,
}: {
  onSelect: (type: QuickAddType) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <motion.button
            type="button"
            aria-label="Quick add"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="fixed right-4 z-40 grid size-14 place-items-center rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-lg touch-manipulation bottom-[calc(6rem+env(safe-area-inset-bottom))]"
          />
        }
      >
        <Plus className="size-6" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-48">
        <DropdownItems onSelect={onSelect} onClose={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardQuickAddDesktop({
  onSelect,
}: {
  onSelect: (type: QuickAddType) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5" />
        }
      >
        <Plus className="size-3.5" />
        Quick add
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownItems onSelect={onSelect} onClose={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
