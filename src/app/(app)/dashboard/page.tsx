"use client"

import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Flame,
  Repeat,
} from "lucide-react"
import { useHabits, useHabitLogs, useToggleLog } from "@/features/habits/use-habits"
import { useTasks, useSetTaskStatus } from "@/features/tasks/use-tasks"
import { useNotes } from "@/features/notes/use-notes"
import { useDiaryEntries } from "@/features/diary/use-diary"
import { isDueToday } from "@/lib/habits"
import { todayISO, humanDate } from "@/lib/dates"
import { STATUS_META } from "@/features/tasks/meta"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

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

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {humanDate(today, "EEEE, MMMM d")} — here’s your day at a glance.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Repeat className="size-4" />}
          label="Habit check-ins"
          value={`${checkinsToday}/${dueHabits.length}`}
          href="/habits"
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" />}
          label="Tasks completed today"
          value={String(doneToday)}
          href="/tasks"
        />
        <StatCard
          icon={<FileText className="size-4" />}
          label="Notes"
          value={String(notes?.length ?? 0)}
          href="/notes"
        />
        <StatCard
          icon={<BookOpen className="size-4" />}
          label={todayDiary ? "Diary written" : "Diary pending"}
          value={todayDiary ? "Done" : "—"}
          href="/diary"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Today’s habits</CardTitle>
            <Link
              href="/habits"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7")}
            >
              All habits <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {dueHabits.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing due today. Enjoy it!
              </p>
            ) : (
              dueHabits.map((h) => {
                const done = todayLogs.has(h.id)
                return (
                  <div
                    key={h.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={done}
                      onCheckedChange={() =>
                        toggleLog.mutate({ habit_id: h.id, log_date: today })
                      }
                      aria-label={`${h.name} today`}
                    />
                    <span className="text-lg" aria-hidden>{h.emoji}</span>
                    <span className={cn("flex-1 text-sm font-medium", done && "text-muted-foreground line-through")}>
                      {h.name}
                    </span>
                    {done && <Badge className="text-xs">Done</Badge>}
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
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7")}
            >
              All tasks <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {dueTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                All clear — no open tasks.
              </p>
            ) : (
              dueTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={(c) =>
                      setStatus.mutate({ id: t.id, status: c ? "done" : "todo" })
                    }
                    aria-label={t.title}
                  />
                  <span className="flex-1 truncate text-sm font-medium">{t.title}</span>
                  {t.due_date && (
                    <span className="text-xs text-muted-foreground">
                      {t.due_date.slice(0, 10) === today
                        ? "today"
                        : t.due_date.slice(0, 10) < today
                          ? "overdue"
                          : null}
                    </span>
                  )}
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {STATUS_META[t.status].label}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Diary</CardTitle>
            <Link
              href="/diary"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7")}
            >
              Open diary <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {todayDiary ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {todayDiary.title || "Today’s entry"}
                </p>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {todayDiary.content.replace(/[#>*`\[\]()!~\-]/g, " ").replace(/\s+/g, " ").slice(0, 220)}
                </p>
              </div>
            ) : (
              <Link
                href="/diary"
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                Write today’s entry
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Recent notes</CardTitle>
            <Link
              href="/notes"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7")}
            >
              All notes <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentNotes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No notes yet.
              </p>
            ) : (
              recentNotes.map((n) => (
                <Link
                  key={n.id}
                  href="/notes"
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50"
                >
                  <Flame className="size-3.5 text-muted-foreground" aria-hidden />
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
}: {
  icon: React.ReactNode
  label: string
  value: string
  href: string
}) {
  return (
    <Link href={href}>
      <Card className="transition hover:border-primary/50">
        <CardContent className="flex items-center gap-3 p-4">
          <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
            {icon}
          </span>
          <div>
            <p className="text-xl font-bold leading-none">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}