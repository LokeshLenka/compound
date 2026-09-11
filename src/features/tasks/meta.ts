import type { TaskPriority, TaskStatus } from "@/lib/types"

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; classes: string }
> = {
  low: {
    label: "Low",
    classes:
      "bg-muted text-muted-foreground",
  },
  medium: {
    label: "Medium",
    classes:
      "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  high: {
    label: "High",
    classes:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  urgent: {
    label: "Urgent",
    classes:
      "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
}

export const STATUS_META: Record<TaskStatus, { label: string; classes: string }> = {
  todo: {
    label: "Todo",
    classes: "bg-muted text-muted-foreground",
  },
  in_progress: {
    label: "In progress",
    classes: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  done: {
    label: "Done",
    classes: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  },
  archived: {
    label: "Archived",
    classes: "bg-muted text-muted-foreground line-through",
  },
}

export const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done", "archived"]

export function isOverdue(task: { due_date: string | null; status: TaskStatus }): boolean {
  if (!task.due_date || task.status === "done" || task.status === "archived") return false
  return task.due_date.slice(0, 10) < new Date().toISOString().slice(0, 10)
}

export function isDueToday(task: { due_date: string | null; status: TaskStatus }): boolean {
  if (!task.due_date || task.status === "done") return false
  return task.due_date.slice(0, 10) === new Date().toISOString().slice(0, 10)
}