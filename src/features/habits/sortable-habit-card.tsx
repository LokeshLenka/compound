"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import type { Habit, HabitLog } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { HabitCard } from "@/features/habits/habit-card"

export function SortableHabitCard({
  habit,
  logs,
  onEdit,
  onDelete,
}: {
  habit: Habit
  logs: HabitLog[]
  onEdit: (habit: Habit) => void
  onDelete: (habit: Habit) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "z-10 opacity-50")}
    >
      <HabitCard
        habit={habit}
        logs={logs}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandle={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Drag ${habit.name}`}
            className="cursor-grab touch-none active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4 text-muted-foreground" />
          </Button>
        }
      />
    </div>
  )
}