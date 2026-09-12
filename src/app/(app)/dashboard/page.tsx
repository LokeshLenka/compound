"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Droplet,
  FileText,
  ListChecks,
  PenLine,
  Repeat,
} from "lucide-react"
import { useHabits, useHabitLogs, useToggleLog } from "@/features/habits/use-habits"
import { useTasks, useSetTaskStatus } from "@/features/tasks/use-tasks"
import { useNotes } from "@/features/notes/use-notes"
import { useDiaryEntries } from "@/features/diary/use-diary"
import { useWaterLogs, useWaterSettings, useAddWater } from "@/features/water/use-water"
import { isDueToday } from "@/lib/habits"
import { todayISO, humanDate } from "@/lib/dates"
import { totalMl, formatAmount } from "@/lib/water"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { QuickAdd } from "@/components/quick-add"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 5) return "Up late"
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: habits } = useHabits()
  const { data: allLogs } = useHabitLogs()
  const { data: tasks } = useTasks()
  const { data: notes } = useNotes()
  const { data: diary } = useDiaryEntries()
  const { data: waterLogs } = useWaterLogs()
  const { data: waterSettings } = useWaterSettings()
  const toggleLog = useToggleLog()
  const setStatus = useSetTaskStatus()
  const addWater = useAddWater()

  const today = todayISO()

  const dueHabits = (habits ?? []).filter(isDueToday)
  const todayLogs = new Set(
    allLogs?.filter((l) => l.log_date === today).map((l) => l.habit_id) ?? [],
  )
  const openHabits = dueHabits.filter((h) => !todayLogs.has(h.id))

  const dueTasks = (tasks ?? [])
    .filter((t) => t.status !== "done" && t.status !== "archived")
    .sort((a, b) => {
      const da = a.due_date ?? "9999-12-31"
      const db = b.due_date ?? "9999-12-31"
      return da < db ? -1 : da > db ? 1 : 0
    })

  const todayDiary = diary?.find((e) => e.entry_date === today)
  const recentNotes = (notes ?? []).slice(0, 3)

  const waterUnit = waterSettings?.water_unit ?? "ml"
  const waterGoal = waterSettings?.water_goal_ml ?? 2500
  const waterPresets = (waterSettings?.water_quick_amounts ?? [200, 400, 800]).slice(0, 3)
  const now = new Date()
  const waterToday = totalMl(
    (waterLogs ?? []).filter((l) => {
      const d = new Date(l.drank_at)
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      )
    }),
  )
  const waterDone = waterToday >= waterGoal

  const openCount = openHabits.length + dueTasks.length + (todayDiary ? 0 : 1) + (waterDone ? 0 : 1)

  // Installed-app badge: today's open items (best-effort, no-op unsupported)
  useEffect(() => {
    try {
      const nav = navigator as Navigator & {
        setAppBadge?: (n: number) => Promise<void>
        clearAppBadge?: () => Promise<void>
      }
      if (openCount > 0) void nav.setAppBadge?.(openCount)
      else void nav.clearAppBadge?.()
    } catch {
      /* badge unsupported — ignore */
    }
  }, [openCount])

  const createActions = [
    { icon: Repeat, label: "New habit", href: "/habits?create=1", tint: "bg-chart-1/12 text-chart-1" },
    { icon: ListChecks, label: "New task", href: "/tasks?create=1", tint: "bg-chart-2/12 text-chart-2" },
    { icon: FileText, label: "New note", href: "/notes?create=1", tint: "bg-chart-3/12 text-chart-3" },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" actions={<QuickAdd />} />

      <p className="text-balance text-sm leading-relaxed text-muted-foreground">
        {greeting(now)}, {humanDate(today, "EEEE, MMMM d")} —{" "}
        {openCount === 0 ? (
          <>everything is done. Enjoy your day.</>
        ) : (
          <>
            {openCount} thing{openCount === 1 ? "" : "s"} open today. Start at the top.
          </>
        )}
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {createActions.map((a) => (
          <button
            key={a.href}
            type="button"
            onClick={() => router.push(a.href)}
            className="group flex items-center gap-3 rounded-3xl border border-border/50 bg-card p-4 text-left card-shadow transition-colors hover:border-primary/50 active:scale-[0.98]"
          >
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", a.tint)}>
              <a.icon className="size-4" aria-hidden />
            </span>
            <span className="text-sm font-semibold">{a.label}</span>
            <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
          </button>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Habits to check off</CardTitle>
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
            <CardTitle className="text-base">Tasks to clear</CardTitle>
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
              dueTasks.slice(0, 6).map((t) => (
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
            <CardTitle className="text-base">Water right now</CardTitle>
            <Link
              href="/water"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 rounded-full")}
            >
              Details <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">
                {formatAmount(waterToday, waterUnit)}
              </span>{" "}
              of {formatAmount(waterGoal, waterUnit)} today
            </p>
            <div className="grid grid-cols-3 gap-2">
              {waterPresets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={addWater.isPending}
                  onClick={() => addWater.mutate({ amount_ml: amt })}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-chart-water/15 text-sm font-semibold text-chart-water transition-colors hover:bg-chart-water/25 active:scale-95 disabled:opacity-50"
                >
                  <Droplet className="size-3.5" aria-hidden />+{formatAmount(amt, waterUnit)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Diary</CardTitle>
            <Link
              href="/diary"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 rounded-full")}
            >
              {todayDiary ? "Read entry" : "Open diary"}{" "}
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

        <Card className="lg:col-span-2">
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
