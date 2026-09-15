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
  ReferenceLine,
} from "recharts"
import {
  Droplet,
  TrendingUp,
  Flame,
  Target,
  ArrowLeft,
  Clock,
  CalendarDays,
  Trophy,
  Zap,
} from "lucide-react"
import { useWaterLogs, useWaterSettings } from "@/features/water/use-water"
import {
  dailyTotals,
  dailyAverage,
  currentStreak,
  bestDayMl,
  weekTotalMl,
  formatAmount,
  formatCompact,
} from "@/lib/water"
import { getDay, getHours } from "date-fns"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function WaterStatsPage() {
  const { data: logs = [] } = useWaterLogs()
  const { data: settings } = useWaterSettings()

  const goalMl = settings?.water_goal_ml ?? 2500
  const unit = settings?.water_unit ?? "ml"
  const now = useMemo(() => new Date(), [])

  const days30 = useMemo(() => dailyTotals(logs, 30, now), [logs, now])
  const days90 = useMemo(() => dailyTotals(logs, 90, now), [logs, now])

  const total30 = useMemo(() => days30.reduce((s, d) => s + d.totalMl, 0), [days30])
  const avg30 = useMemo(() => dailyAverage(logs, 30, now), [logs, now])
  const streak = useMemo(() => currentStreak(logs, goalMl, now), [logs, goalMl, now])

  const goalHitDays = useMemo(
    () => days30.filter((d) => d.totalMl >= goalMl).length,
    [days30, goalMl],
  )
  const goalHitRate = Math.round((goalHitDays / 30) * 100)

  const bestDay = useMemo(() => bestDayMl(days30), [days30])
  const weekTotals = useMemo(() => {
    const weeks: { label: string; total: number }[] = []
    for (let i = 0; i < 4; i++) {
      const slice = days30.slice(i * 7, (i + 1) * 7)
      weeks.push({
        label: `Week ${4 - i}`,
        total: weekTotalMl(slice),
      })
    }
    return weeks.reverse()
  }, [days30])

  // Hourly distribution (0-23)
  const hourlyDist = useMemo(() => {
    const counts = new Array(24).fill(0)
    for (const l of logs) {
      const h = getHours(new Date(l.drank_at))
      counts[h] += l.amount_ml
    }
    return counts.map((ml, h) => ({
      hour: h,
      label: `${h.toString().padStart(2, "0")}:00`,
      totalMl: ml,
    }))
  }, [logs])
  const maxHourly = useMemo(
    () => Math.max(...hourlyDist.map((h) => h.totalMl), 1),
    [hourlyDist],
  )

  // Day-of-week pattern (0=Sun .. 6=Sat)
  const dayOfWeek = useMemo(() => {
    const totals = new Array(7).fill(0)
    const counts = new Array(7).fill(0)
    for (const l of logs) {
      const d = getDay(new Date(l.drank_at))
      totals[d] += l.amount_ml
      counts[d] += 1
    }
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return labels.map((label, i) => ({
      label,
      avgMl: counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
    }))
  }, [logs])
  const maxDowAvg = useMemo(
    () => Math.max(...dayOfWeek.map((d) => d.avgMl), 1),
    [dayOfWeek],
  )

  // Biggest single entry
  const biggestEntry = useMemo(
    () => logs.reduce((max, l) => Math.max(max, l.amount_ml), 0),
    [logs],
  )

  // Best streak ever (scan all 90 days)
  const bestStreakEver = useMemo(() => {
    let best = 0
    let current = 0
    for (const d of days90) {
      if (d.totalMl >= goalMl) {
        current++
        best = Math.max(best, current)
      } else {
        current = 0
      }
    }
    return best
  }, [days90, goalMl])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/water"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 h-8 gap-1",
          )}
        >
          <ArrowLeft className="size-3.5" /> Water
        </Link>
      </div>

      <PageHeader title="Water analytics" />

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Droplet className="size-4" />}
          label="Total · 30 days"
          value={formatAmount(total30, unit)}
          tint="chart-1"
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Daily average"
          value={formatAmount(avg30, unit)}
          tint="chart-2"
        />
        <StatCard
          icon={<Target className="size-4" />}
          label="Goal hit rate · 30d"
          value={`${goalHitRate}%`}
          tint="chart-4"
        />
        <StatCard
          icon={<Flame className="size-4" />}
          label="Current streak"
          value={`${streak} days`}
          tint="chart-1"
        />
      </div>

      {/* 30-day bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daily intake · last 30 days</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={days30.map((d) => ({
                label: d.date.slice(5),
                totalMl: d.totalMl,
              }))}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="opacity-20"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={10}
                tick={{ fill: "currentColor", opacity: 0.6 }}
                interval={2}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={40}
                tickFormatter={(v) => formatCompact(v, unit)}
                tick={{ fill: "currentColor", opacity: 0.6 }}
              />
              <Tooltip
                cursor={{ fill: "currentColor", opacity: 0.06 }}
                contentStyle={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [formatAmount(Number(v), unit), "Intake"]}
              />
              <ReferenceLine
                y={goalMl}
                stroke="var(--chart-4)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: "Goal",
                  position: "right",
                  fontSize: 10,
                  fill: "var(--chart-4)",
                }}
              />
              <Bar
                dataKey="totalMl"
                name="Intake"
                fill="var(--chart-1)"
                radius={[3, 3, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Hourly distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-muted-foreground" />
              Hourly pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-1">
              {hourlyDist.map((h) => {
                const intensity = maxHourly > 0 ? h.totalMl / maxHourly : 0
                return (
                  <div key={h.hour} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-full rounded-sm transition-colors",
                        intensity > 0 ? "bg-chart-1" : "bg-muted/40",
                      )}
                      style={{
                        height: 20,
                        opacity: intensity > 0 ? 0.2 + intensity * 0.8 : 0.3,
                      }}
                      title={`${h.label}: ${formatAmount(h.totalMl, unit)}`}
                    />
                    {h.hour % 3 === 0 && (
                      <span className="text-[9px] text-muted-foreground">
                        {h.hour}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:00</span>
            </div>
          </CardContent>
        </Card>

        {/* Day of week pattern */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-muted-foreground" />
              Day of week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dayOfWeek.map((d) => {
              const pct = maxDowAvg > 0 ? (d.avgMl / maxDowAvg) * 100 : 0
              const met = d.avgMl >= goalMl
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-medium text-muted-foreground">
                    {d.label}
                  </span>
                  <div className="flex-1">
                    <div className="h-5 rounded-full bg-muted/40">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          met ? "bg-chart-4" : "bg-chart-1/70",
                        )}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
                    {d.avgMl > 0 ? formatAmount(d.avgMl, unit) : "—"}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Weekly totals + Records */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Weekly totals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weekTotals.map((w) => {
              const pct = total30 > 0 ? (w.total / total30) * 100 : 0
              return (
                <div key={w.label} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{w.label}</span>
                    <span className="font-medium tabular-nums">
                      {formatAmount(w.total, unit)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-chart-2"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Personal records */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-muted-foreground" />
              Personal records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <RecordItem
                icon={<Trophy className="size-5 text-chart-4" />}
                label="Best day"
                value={formatAmount(bestDay, unit)}
              />
              <RecordItem
                icon={<Flame className="size-5 text-chart-1" />}
                label="Best streak"
                value={`${bestStreakEver} days`}
              />
              <RecordItem
                icon={<Zap className="size-5 text-chart-2" />}
                label="Biggest entry"
                value={formatAmount(biggestEntry, unit)}
              />
              <RecordItem
                icon={<Target className="size-5 text-chart-3" />}
                label="Goal rate · 30d"
                value={`${goalHitDays}/30 days`}
              />
            </div>
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
  tint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tint: "chart-1" | "chart-2" | "chart-3" | "chart-4"
}) {
  const chip = {
    "chart-1": "bg-chart-1/12 text-chart-1",
    "chart-2": "bg-chart-2/12 text-chart-2",
    "chart-3": "bg-chart-3/12 text-chart-3",
    "chart-4": "bg-chart-4/12 text-chart-4",
  }[tint]
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            chip,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">
            {value}
          </p>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function RecordItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3">
      {icon}
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
