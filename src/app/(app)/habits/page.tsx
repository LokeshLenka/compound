"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Flame, CheckCircle2, Repeat, ArrowUpDown, BarChart3 } from "lucide-react"
import { useHabits, useHabitLogs, useDeleteHabit, useMoveHabit } from "@/features/habits/use-habits"
import { HabitCard } from "@/features/habits/habit-card"
import { HabitFormDialog } from "@/features/habits/habit-form"
import { currentStreak, isDueToday } from "@/lib/habits"
import { todayISO } from "@/lib/dates"
import type { Habit } from "@/lib/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { CreateFab } from "@/components/create-fab"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { HabitCompletionsChart } from "@/features/habits/habit-chart"

export default function HabitsPage() {
  const { data: habits, isLoading } = useHabits()
  const { data: allLogs } = useHabitLogs()
  const deleteHabit = useDeleteHabit()
  const moveHabit = useMoveHabit()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [deleting, setDeleting] = useState<Habit | null>(null)
  const [reorderMode, setReorderMode] = useState(false)

  const today = todayISO()
  const doneToday = allLogs?.filter((l) => l.log_date === today).length ?? 0
  const bestStreak = habits?.reduce((max, h) => {
    const dates = (allLogs ?? [])
      .filter((l) => l.habit_id === h.id)
      .map((l) => l.log_date)
    const s = currentStreak(h, dates)
    return Math.max(max, s)
  }, 0)
  const dueToday = habits?.filter(isDueToday).length ?? 0

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function move(h: Habit, dir: "up" | "down") {
    moveHabit.mutate({ id: h.id, dir })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Habits</h1>
          <p className="text-sm text-muted-foreground">
            Build streaks one day at a time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/habits/stats"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
          >
            <BarChart3 className="size-3.5" /> Analytics
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setReorderMode((v) => !v)}
          >
            <ArrowUpDown className="size-3.5" /> {reorderMode ? "Done" : "Reorder"}
          </Button>
          <Button onClick={openNew}>
            <Plus className="mr-1 size-4" /> New habit
          </Button>
        </div>
      </header>

      {reorderMode && (
        <p className="rounded-xl border bg-card px-4 py-2 text-sm text-muted-foreground">
          Reorder mode is on — use the ↑ ↓ arrows on each habit to change its position.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<Repeat className="size-4" />}
          label="Active habits"
          value={habits?.length ?? 0}
        />
        <SummaryCard
          icon={<CheckCircle2 className="size-4" />}
          label="Check-ins today"
          value={doneToday}
        />
        <SummaryCard
          icon={<Flame className="size-4" />}
          label="Best current streak"
          value={bestStreak ?? 0}
          hint={dueToday > 0 ? `${dueToday} habits due today` : undefined}
        />
      </div>

      <HabitCompletionsChart logs={allLogs ?? []} />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : habits?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {habits.map((h, i) => (
            <HabitCard
              key={h.id}
              habit={h}
              logs={allLogs ?? []}
              onEdit={(habit) => {
                setEditing(habit)
                setFormOpen(true)
              }}
              onDelete={(habit) => setDeleting(habit)}
              moveUp={reorderMode ? () => move(h, "up") : undefined}
              moveDown={reorderMode ? () => move(h, "down") : undefined}
              canMoveUp={i > 0}
              canMoveDown={i < habits.length - 1}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-3xl mb-2">🌱</p>
            <p>No habits yet. Create your first one to start a streak.</p>
          </CardContent>
        </Card>
      )}

      <HabitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        habit={editing}
      />

      {!reorderMode && <CreateFab onClick={openNew} label="New habit" />}

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the habit and its full history. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) void deleteHabit.mutateAsync(deleting.id)
                setDeleting(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: number
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </span>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground">
            {label}
            {hint ? ` · ${hint}` : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}