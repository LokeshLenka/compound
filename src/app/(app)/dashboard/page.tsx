"use client"

import { useEffect } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  PenLine,
  Repeat,
} from "lucide-react"
import { useHabits, useHabitLogs, useToggleLog } from "@/features/habits/use-habits"
import { useTasks, useSetTaskStatus } from "@/features/tasks/use-tasks"
import { useNotes } from "@/features/notes/use-notes"
import { useDiaryEntries } from "@/features/diary/use-diary"
import { isDueToday } from "@/lib/habits"
import { todayISO, humanDate } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { QuickAdd } from "@/components/quick-add"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

export default function DashboardPage() {
  const { data: habits } = useHabits()
  const { data: allLogs } = useHabitLogs()
  const { data: tasks } = useTasks()
  const { data: notes } = useNotes()
  const { data: diary } = useDiaryEntries()
  const toggleLog = useToggleLog()
  const setStatus = useSetTaskStatus()

  const today = todayISO()

  const dueHabits = (habits ?? []).filter(isDueToday)
  const todayLogs = new Set(
    allLogs?.filter((l) => l.log_date === today).map((l) => l.habit_id) ?? [],
  )

  const dueTasks = (tasks ?? [])
    .filter((t) => t.status !== "done" && t.status !== "archived")
    .sort((a, b) => {
      const da = a.due_date ?? "9999-12-31"
      const db = b.due_date ?? "9999-12-31"
      return da < db ? -1 : da > db ? 1 : 0
    })
    .slice(0, 6)

  const todayDiary = diary?.find((e) => e.entry_date === today)

  const doneToday = (tasks ?? []).filter(
    (t) => t.completed_at && t.completed_at.slice(0, 10) === today,
  ).length
  const checkinsToday = dueHabits.filter((h) => todayLogs.has(h.id)).length
  const recentNotes = (notes ?? []).slice(0, 3)

  // Installed-app badge: today's open items (best-effort, no-op unsupported)
  useEffect(() => {
    try {
      const nav = navigator as Navigator & {
        setAppBadge?: (n: number) => Promise<void>
        clearAppBadge?: () => Promise<void>
      }
      const open = dueHabits.length - checkinsToday + dueTasks.length
      if (open > 0) void nav.setAppBadge?.(open)
      else void nav.clearAppBadge?.()
    } catch {
      /* badge unsupported — ignore */
    }
  }, [dueHabits.length, checkinsToday, dueTasks.length])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        actions={<QuickAdd />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Repeat className="size-4" />}
          label="Habit check-ins"
          value={`${checkinsToday}/${dueHabits.length}`}
          href="/habits"
          tint="habits"
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" />}
          label="Tasks done today"
          value={String(doneToday)}
          href="/tasks"
          tint="tasks"
        />
        <StatCard
          icon={<FileText className="size-4" />}
          label="Notes"
          value={String(notes?.length ?? 0)}
          href="/notes"
          tint="notes"
        />
        <StatCard
          icon={<BookOpen className="size-4" />}
          label={todayDiary ? "Diary written" : "Diary pending"}
          value={todayDiary ? "Done" : "—"}
          href="/diary"
          tint="diary"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Today’s habits</CardTitle>
            <Link
              href="/habits"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 rounded-full")}
            >
              All habits <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {dueHabits.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing due today. Enjoy it!
              </p>
            ) : (
              dueHabits.slice(0, 6).map((h) => {
                const done = todayLogs.has(h.id)
                return (
                  <div
                    key={h.id}
                    className="flex items-center gap-2.5 rounded-2xl px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={done}
                      onCheckedChange={() =>
                        toggleLog.mutate({ habit_id: h.id, log_date: today })
                      }
                      aria-label={`${h.name} today`}
                    />
                    <span aria-hidden className="text-base leading-none">{h.emoji}</span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm font-medium",
                        done && "text-muted-foreground line-through",
                      )}
                    >
                      {h.name}
                    </span>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Due tasks</CardTitle>
            <Link
              href="/tasks"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 rounded-full")}
            >
              All tasks <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {dueTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                All clear. Add a task to stay ahead.
              </p>
            ) : (
              dueTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2.5 rounded-2xl px-2 py-2 transition-colors hover:bg-muted/60"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={(c) =>
                      setStatus.mutate({ id: t.id, status: c ? "done" : "todo" })
                    }
                    aria-label={t.title}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {t.title}
                  </span>
                  {t.due_date && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t.due_date.slice(0, 10) === today
                        ? "due today"
                        : t.due_date.slice(0, 10) < today
                          ? "overdue"
                          : t.due_date.slice(0, 10)}
                    </span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Diary</CardTitle>
            <Link
              href="/diary"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 rounded-full")}
            >
              {todayDiary ? "Read entry" : "Write entry"}{" "}
              <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {todayDiary ? (
              <div>
                <p className="truncate text-sm font-medium">
                  {todayDiary.title || "Today's entry"}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {todayDiary.content.replace(/[#>*`[\]()!~\-]/g, " ").replace(/\s+/g, " ").slice(0, 140)}
                </p>
              </div>
            ) : (
              <Link
                href="/diary"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                <PenLine className="size-4" /> Write today&apos;s entry
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Recent notes</CardTitle>
            <Link
              href="/notes"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 rounded-full")}
            >
              All notes <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentNotes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No notes yet — quiet notes live here.
              </p>
            ) : (
              recentNotes.map((n) => (
                <Link
                  key={n.id}
                  href="/notes"
                  className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-muted/60"
                >
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-chart-3" aria-hidden />
                  <span className="flex-1 truncate text-sm font-medium">
                    {n.title || "Untitled"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {humanDate(n.updated_at, "MMM d")}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  href,
  tint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href: string
  tint: "habits" | "tasks" | "notes" | "diary"
}) {
  const chips: Record<string, string> = {
    habits: "bg-chart-1/12 text-chart-1",
    tasks: "bg-chart-2/12 text-chart-2",
    notes: "bg-chart-3/12 text-chart-3",
    diary: "bg-chart-4/12 text-chart-4",
  }
  return (
    <Link
      href={href}
      className="group/card rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Card className="h-full rounded-3xl transition-colors duration-200 group-hover/card:border-primary/40">
        <CardContent className="flex items-center gap-3 p-4">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", chips[tint])}>
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{value}</p>
            <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
