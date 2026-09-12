"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import {
  Repeat,
  CheckCircle2,
  Flame,
  Target,
  ArrowLeft,
} from "lucide-react"
import { useHabits, useHabitLogs } from "@/features/habits/use-habits"
import { HabitCompletionsChart } from "@/features/habits/habit-chart"
import {
  currentStreak,
  bestStreak,
  completionRate,
  weekCount,
  isDueOnDate,
} from "@/lib/habits"
import { lastNDates, monthKey, monthLabel, lastMonthsISO, todayISO, humanDate } from "@/lib/dates"
import { colorSwatch } from "@/lib/colors"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Habit } from "@/lib/types"

export default function HabitStatsPage() {
  const { data: habits = [] } = useHabits()
  const { data: allLogs = [] } = useHabitLogs()

  const logsByHabit = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const l of allLogs) {
      const arr = map.get(l.habit_id) ?? []
      arr.push(l.log_date)
      map.set(l.habit_id, arr)
    }
    return map
  }, [allLogs])

  const monthly = useMemo(() => {
    const counts = new Map<string, number>()
    for (const l of allLogs) {
      const k = monthKey(l.log_date)
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    return lastMonthsISO(6).map((k) => ({
      label: monthLabel(k).split(" ")[0],
      checkins: counts.get(k) ?? 0,
    }))
  }, [allLogs])

  const total30 = useMemo(() => {
    const set = new Set(lastNDates(30))
    return allLogs.filter((l) => set.has(l.log_date)).length
  }, [allLogs])

  const avgRate = useMemo(() => {
    const rates = habits.map((h) => completionRate(h, logsByHabit.get(h.id) ?? []))
    if (rates.length === 0) return 0
    return Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100)
  }, [habits, logsByHabit])

  const bestCurrent = habits.reduce(
    (max, h) => Math.max(max, currentStreak(h, logsByHabit.get(h.id) ?? [])),
    0,
  )

  const ranked = useMemo(
    () =>
      [...habits]
        .map((h) => ({
          habit: h,
          dates: logsByHabit.get(h.id) ?? [],
          current: currentStreak(h, logsByHabit.get(h.id) ?? []),
          best: bestStreak(h, logsByHabit.get(h.id) ?? []),
          rate30: completionRate(h, logsByHabit.get(h.id) ?? [], 30),
          rate90: completionRate(h, logsByHabit.get(h.id) ?? [], 90),
          week: weekCount(h, logsByHabit.get(h.id) ?? []),
        }))
        .sort((a, b) => b.rate30 - a.rate30),
    [habits, logsByHabit],
  )

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/habits"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 h-8")}
        >
          <ArrowLeft className="size-3.5" /> Habits
        </Link>
        <h1 className="text-2xl font-bold">Habit analytics</h1>
        <p className="text-sm text-muted-foreground">
          Trends, streaks and consistency for all your habits.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Repeat className="size-4" />}
          label="Active habits"
          value={String(habits.length)}
        />
        <StatCard
          icon={<CheckCircle2 className="size-4" />}
          label="Check-ins · last 30 days"
          value={String(total30)}
        />
        <StatCard
          icon={<Target className="size-4" />}
          label="Avg completion · 30d"
          value={`${avgRate}%`}
        />
        <StatCard
          icon={<Flame className="size-4" />}
          label="Best current streak"
          value={String(bestCurrent)}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <MonthlyChart data={monthly} />
        <HabitCompletionsChart logs={allLogs} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Consistency leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ranked.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No habits yet — create one to start tracking.
            </p>
          ) : (
            ranked.map((r, i) => (
              <div key={r.habit.id} className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
                  <span
                    className={cn("grid size-8 place-items-center rounded-lg text-base", colorSwatch(r.habit.color))}
                    aria-hidden
                  >
                    {r.habit.emoji}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {r.habit.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                    <Flame className="size-3.5" /> {r.current}
                  </span>
                  <span className="w-12 text-right text-xs text-muted-foreground">
                    {Math.round(r.rate30 * 100)}%
                  </span>
                </div>
                <Progress value={r.rate30 * 100} className="ml-7" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <DetailGrid ranked={ranked} habits={habits} logsByHabit={logsByHabit} />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </span>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function MonthlyChart({ data }: { data: { label: string; checkins: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Check-ins · last 6 months</CardTitle>
      </CardHeader>
      <CardContent className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-20" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: "currentColor", opacity: 0.6 }} interval={0} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={40} tick={{ fill: "currentColor", opacity: 0.6 }} />
            <Tooltip
              cursor={{ fill: "currentColor", opacity: 0.06 }}
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="checkins" name="Check-ins" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function DetailGrid({
  ranked,
  habits,
  logsByHabit,
}: {
  ranked: {
    habit: Habit
    dates: string[]
    current: number
    best: number
    rate30: number
    rate90: number
    week: number
  }[]
  habits: Habit[]
  logsByHabit: Map<string, string[]>
}) {
  if (habits.length === 0) return null
  const days = lastNDates(28)
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Per-habit detail</h2>
      <div className="grid gap-4">
        {ranked.map((r) => (
          <Card key={r.habit.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn("grid size-10 place-items-center rounded-xl text-xl", colorSwatch(r.habit.color))}
                    aria-hidden
                  >
                    {r.habit.emoji}
                  </span>
                  <div>
                    <h3 className="font-semibold">{r.habit.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {r.habit.frequency_type === "weekly"
                        ? `Weekly target · ${r.habit.frequency_value.times ?? 3}/wk · ${r.week} done`
                        : `${r.dates.length} total check-ins`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-center">
                  <Metric label="Current" value={String(r.current)} accent />
                  <Metric label="Best streak" value={String(r.best)} accent />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {([7, 30, 90] as const).map((d) => {
                  const rate = d === 7
                    ? completionRate(r.habit, r.dates, 7)
                    : d === 30
                      ? r.rate30
                      : r.rate90
                  return (
                    <div key={d} className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{d}d</span>
                        <span className="font-medium">{Math.round(rate * 100)}%</span>
                      </div>
                      <Progress value={rate * 100} />
                    </div>
                  )
                })}
              </div>

              <HeatmapRow habit={r.habit} days={days} dates={new Set(r.dates)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
      <p className={cn("text-lg font-bold leading-none", accent && "text-orange-600 dark:text-orange-400")}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function HeatmapRow({
  habit,
  days,
  dates,
}: {
  habit: Habit
  days: string[]
  dates: Set<string>
}) {
  const today = todayISO()
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[560px] gap-1">
        {days.map((d) => {
          const done = dates.has(d)
          const due = isDueOnDate(habit, d)
          return (
            <span
              key={d}
              title={`${humanDate(d)}${done ? " · done" : ""}`}
              className={cn(
                "size-3 shrink-0 rounded-[4px]",
                done
                  ? "bg-primary"
                  : due
                    ? "bg-muted ring-1 ring-inset ring-border"
                    : "bg-transparent ring-1 ring-inset ring-border/40",
                d === today && "ring-2 ring-foreground/40",
              )}
            />
          )
        })}
      </div>
    </div>
  )
}