"use client"

import { CalendarDays, CheckCircle2, Pencil, Trash2 } from "lucide-react"
import type { Task } from "@/lib/types"
import { humanDate } from "@/lib/dates"
import { useSetTaskStatus, useDeleteTask } from "@/features/tasks/use-tasks"
import { PRIORITY_META, STATUS_META, isOverdue, isDueToday } from "@/features/tasks/meta"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

function DueBadge({ task }: { task: Task }) {
  if (!task.due_date || task.status === "done") return null
  const overdue = isOverdue(task)
  const today = isDueToday(task)
  return (
    <Badge
      variant={overdue ? "destructive" : today ? "default" : "outline"}
      className="gap-1 text-xs"
    >
      <CalendarDays className="size-3" />
      {overdue ? "Overdue · " : ""}
      {humanDate(task.due_date)}
    </Badge>
  )
}

export function TaskRow({
  task,
  projectName,
  onEdit,
  compact,
  highlighted,
  rowId,
}: {
  task: Task
  projectName: (id: string | null) => string | undefined
  onEdit: (task: Task) => void
  compact?: boolean
  highlighted?: boolean
  rowId?: string
}) {
  const setStatus = useSetTaskStatus()
  const deleteTask = useDeleteTask()
  const done = task.status === "done"

  return (
    <div
      id={rowId}
      draggable={compact}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id)
        e.dataTransfer.effectAllowed = "move"
      }}
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-3",
        done && "opacity-60",
        highlighted && "ring-2 ring-primary",
      )}
    >
      <Checkbox
        checked={done}
        onCheckedChange={(checked) =>
          setStatus.mutate({ id: task.id, status: checked ? "done" : "todo" })
        }
        aria-label={`Mark ${task.title} as done`}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className={cn(
            "block text-left font-medium hover:underline",
            done && "line-through",
          )}
        >
          {task.title}
        </button>
        {!compact && task.notes && (
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
            {task.notes}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge className={cn("text-xs", PRIORITY_META[task.priority].classes)}>
            {PRIORITY_META[task.priority].label}
          </Badge>
          <Badge className={cn("text-xs", STATUS_META[task.status].classes)}>
            {STATUS_META[task.status].label}
          </Badge>
          <DueBadge task={task} />
          {projectName(task.project_id) && (
            <Badge variant="outline" className="text-xs">
              {projectName(task.project_id)}
            </Badge>
          )}
          {task.tags.map((t) => (
            <span key={t} className="text-xs text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={`Edit ${task.title}`}
          onClick={() => onEdit(task)}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={`Delete ${task.title}`}
          onClick={() => deleteTask.mutate(task.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      <CheckCircle2 className="hidden" />
    </div>
  )
}