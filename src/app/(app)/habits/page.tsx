"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search, ListFilter, BarChart3 } from "lucide-react"
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { useHabits, useHabitLogs, useDeleteHabit, useMoveHabit } from "@/features/habits/use-habits"
import { HabitCard } from "@/features/habits/habit-card"
import { SortableHabitCard } from "@/features/habits/sortable-habit-card"
import { HabitFormDialog } from "@/features/habits/habit-form"
import { currentStreak } from "@/lib/habits"
import type { Habit } from "@/lib/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateFab } from "@/components/create-fab"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

type HabitSort = "custom" | "name" | "streak" | "newest"

const SORTS: { value: HabitSort; label: string }[] = [
  { value: "custom", label: "Custom" },
  { value: "name", label: "Name A–Z" },
  { value: "streak", label: "Streak" },
  { value: "newest", label: "Newest" },
]

export default function HabitsPage() {
  const { data: habits = [], isLoading } = useHabits()
  const { data: allLogs = [] } = useHabitLogs()
  const deleteHabit = useDeleteHabit()
  const moveHabit = useMoveHabit()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [deleting, setDeleting] = useState<Habit | null>(null)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<HabitSort>("custom")

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("create")) {
      /* eslint-disable react-hooks/set-state-in-effect */ // open create dialog from /?create=1
      setEditing(null)
      setFormOpen(true)
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [])

  const logsByHabit = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const l of allLogs) {
      const arr = map.get(l.habit_id) ?? []
      arr.push(l.log_date)
      map.set(l.habit_id, arr)
    }
    return map
  }, [allLogs])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? habits.filter(
          (h) =>
            h.name.toLowerCase().includes(q) ||
            h.emoji.toLowerCase().includes(q),
        )
      : [...habits]
    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sort === "streak") {
      list.sort((a, b) => {
        const sa = currentStreak(a, logsByHabit.get(a.id) ?? [])
        const sb = currentStreak(b, logsByHabit.get(b.id) ?? [])
        return sb - sa
      })
    } else if (sort === "newest") {
      list.sort((a, b) => b.created_at.localeCompare(a.created_at))
    }
    return list
  }, [habits, query, sort, logsByHabit])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = visible.map((h) => h.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    moveHabit.mutate({ ids: arrayMove(ids, oldIndex, newIndex) })
  }

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  const edit = (habit: Habit) => {
    setEditing(habit)
    setFormOpen(true)
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Habits</h1>
          <p className="text-sm text-muted-foreground">
            Build streaks one day at a time.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/habits/stats"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 px-3 text-sm font-medium")}
          >
            <BarChart3 className="mr-1 size-4" /> Analytics
          </Link>
          <Button onClick={openNew}>
            <Plus className="mr-1 size-4" /> New habit
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search habits…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as HabitSort)}>
          <SelectTrigger
            id="habit-sort"
            aria-label="Sort habits"
            title="Sort habits — Custom lets you drag cards to reorder"
            className="h-8 shrink-0 gap-1.5"
          >
            <ListFilter className="size-3.5 shrink-0 text-muted-foreground" />
            <SelectValue className="min-w-0" />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : visible.length ? (
        sort === "custom" ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visible.map((h) => h.id)}>
              <div className="grid gap-4 md:grid-cols-2">
                {visible.map((h) => (
                  <SortableHabitCard
                    key={h.id}
                    habit={h}
                    logs={allLogs}
                    onEdit={edit}
                    onDelete={setDeleting}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                logs={allLogs}
                onEdit={edit}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="mb-2 text-3xl">🌱</p>
            <p>
              {query
                ? "No habits match your search."
                : "No habits yet. Create your first one to start a streak."}
            </p>
          </CardContent>
        </Card>
      )}

      <HabitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        habit={editing}
      />

      <CreateFab onClick={openNew} label="New habit" />

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