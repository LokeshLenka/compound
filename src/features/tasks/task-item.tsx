"use client";

import {
  CalendarDays,
  Pencil,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useRef, useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import type { Task, TaskStatus } from "@/lib/types";
import { humanDate } from "@/lib/dates";
import { useSetTaskStatus, useDeleteTask } from "@/features/tasks/use-tasks";
import {
  PRIORITY_META,
  STATUS_META,
  isOverdue,
  isDueToday,
} from "@/features/tasks/meta";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

function DueBadge({ task }: { task: Task }) {
  if (!task.due_date || task.status === "done") return null;
  const overdue = isOverdue(task);
  const today = isDueToday(task);
  return (
    <Badge
      variant={overdue ? "destructive" : today ? "default" : "outline"}
      className="gap-1 text-xs"
    >
      <CalendarDays className="size-3" />
      {overdue ? "Overdue · " : ""}
      {humanDate(task.due_date)}
    </Badge>
  );
}

function MobileDueLabel({ task }: { task: Task }) {
  if (!task.due_date || task.status === "done") return null;
  const overdue = isOverdue(task);
  const today = isDueToday(task);
  return (
    <span
      className={cn(
        "text-[10px] leading-none",
        overdue
          ? "text-destructive"
          : today
            ? "text-primary"
            : "text-muted-foreground",
      )}
    >
      {overdue ? "Overdue" : humanDate(task.due_date)}
    </span>
  );
}

const STATUS_ICONS: Record<TaskStatus, typeof Circle> = {
  todo: Circle,
  in_progress: ArrowUpRight,
  done: CheckCircle2,
  archived: CheckCircle2,
};

export function TaskRow({
  task,
  onEdit,
  compact,
  highlighted,
  rowId,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  compact?: boolean;
  highlighted?: boolean;
  rowId?: string;
}) {
  const setStatus = useSetTaskStatus();
  const deleteTask = useDeleteTask();
  const [sheetOpen, setSheetOpen] = useState(false);
  const done = task.status === "done";
  const StatusIcon = STATUS_ICONS[task.status];

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: "in_progress",
    in_progress: "done",
    done: "todo",
    archived: "done",
  };

  return (
    <div
      id={rowId}
      draggable={compact}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group rounded-3xl border border-border/60 bg-card transition-colors hover:border-border card-shadow",
        done && "opacity-60",
        highlighted && "ring-2 ring-primary",
      )}
    >
      {/* Mobile layout */}
      <div className="flex items-center gap-2.5 p-3 md:hidden">
        {done ? (
          <motion.div
            key="done"
            onClick={() => setStatus.mutate({ id: task.id, status: "todo" })}
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="sm:ml-1 cursor-pointer shrink-0 size-10 rounded-full border-2 border-primary bg-primary flex items-center justify-center transition-colors hover:border-primary"
          >
            <CheckCircle2 className="size-4.5" />
          </motion.div>
        ) : (
          <motion.button
            key="check"
            type="button"
            onClick={() => setStatus.mutate({ id: task.id, status: "done" })}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="sm:ml-1 cursor-pointer shrink-0 size-10 rounded-full border-2 border-primary/30 bg-transparent flex items-center justify-center transition-colors hover:bg-primary/5 hover:border-primary"
            aria-label={`Mark ${task.title} as done`}
          >
            <CheckCircle2 className="size-4.5 text-primary" />
          </motion.button>
        )}
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="min-w-0 flex-1 text-left"
        >
          <p
            className={cn(
              "truncate text-sm font-medium",
              done && "line-through",
            )}
          >
            {task.title}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                "inline-block size-1.5 rounded-full",
                PRIORITY_META[task.priority].classes.includes("red")
                  ? "bg-red-500"
                  : PRIORITY_META[task.priority].classes.includes("amber")
                    ? "bg-amber-500"
                    : PRIORITY_META[task.priority].classes.includes("sky")
                      ? "bg-sky-500"
                      : "bg-muted-foreground/40",
              )}
            />
            <MobileDueLabel task={task} />
          </div>
        </button>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={`Actions for ${task.title}`}
              >
                <MoreVertical className="size-4" />
              </Button>
            }
          />
          <SheetContent side="bottom" className="p-0">
            <div className="px-4 py-2 space-y-2">
              <motion.button
                onClick={() => {
                  onEdit(task);
                  setSheetOpen(false);
                }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-medium hover:bg-accent transition-colors"
              >
                <Pencil className="size-5 text-muted-foreground" />
                Edit
              </motion.button>
              <motion.button
                onClick={() => {
                  setStatus.mutate({
                    id: task.id,
                    status: nextStatus[task.status],
                  });
                  setSheetOpen(false);
                }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-medium hover:bg-accent transition-colors"
              >
                <StatusIcon className="size-5 text-muted-foreground" />
                {STATUS_META[nextStatus[task.status]].label}
              </motion.button>
              <motion.button
                onClick={() => {
                  deleteTask.mutate(task.id);
                  setSheetOpen(false);
                }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="size-5" />
                Delete
              </motion.button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop layout */}
      <div className="hidden items-center gap-3 p-3 md:flex">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              onClick={() => setStatus.mutate({ id: task.id, status: "todo" })}
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 45, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="ml-1 cursor-pointer shrink-0 size-10 rounded-full border-2 border-primary/50 bg-primary/60 flex items-center justify-center transition-colors hover:border-primary hover:bg-primary"
            >
              <CheckCircle2 className="size-4.5" />
            </motion.div>
          ) : (
            <motion.button
              key="check"
              type="button"
              onClick={() => setStatus.mutate({ id: task.id, status: "done" })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="ml-1 cursor-pointer shrink-0 size-10 rounded-full border-2 border-primary/30 bg-transparent flex items-center justify-center transition-colors hover:bg-primary/5 hover:border-primary"
              aria-label={`Mark ${task.title} as done`}
            >
              <CheckCircle2 className="size-4.5 text-primary" />
            </motion.button>
          )}
        </AnimatePresence>
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
            <Badge
              className={cn("text-xs", PRIORITY_META[task.priority].classes)}
            >
              {PRIORITY_META[task.priority].label}
            </Badge>
            <Badge className={cn("text-xs", STATUS_META[task.status].classes)}>
              {STATUS_META[task.status].label}
            </Badge>
            <DueBadge task={task} />
            {task.tags.map((t) => (
              <span key={t} className="text-xs text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition group-focus-within:opacity-100 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Edit ${task.title}`}
            onClick={() => onEdit(task)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Delete ${task.title}`}
            onClick={() => deleteTask.mutate(task.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
