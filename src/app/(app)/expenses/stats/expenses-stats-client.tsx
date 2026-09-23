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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  Percent,
  ArrowLeft,
  Target,
  BarChart3,
} from "lucide-react"
import {
  useTransactions,
  useCategories,
  useBudgets,
} from "@/features/expenses/use-expenses"
import { CategoryEmoji } from "@/features/expenses/expense-forms"
import { fmt } from "../expenses-client"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const PIE_COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#e879f9",
  "#2dd4bf",
  "#fb7185",
  "#a3e635",
]

function periodStart(
  period: "weekly" | "monthly" | "yearly",
  now = new Date(),
): Date {
  const d = new Date(now)
  if (period === "weekly") d.setDate(d.getDate() - 7)
  else if (period === "monthly") d.setDate(1)
  else d.setMonth(0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-")
  const d = new Date(Number(y), Number(m) - 1)
  return d.toLocaleString("default", { month: "short" })
}

export default function ExpenseStatsPage() {
  const { data: txns = [] } = useTransactions()
  const { data: categories = [] } = useCategories()
  const { data: budgets = [] } = useBudgets()

  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const expenses = useMemo(
    () => txns.filter((t) => t.type === "expense"),
    [txns],
  )
  const incomes = useMemo(
    () => txns.filter((t) => t.type === "income"),
    [txns],
  )

  // --- KPI: current month ---
  const now = useMemo(() => new Date(), [])
  const thisMonthKey = monthKey(now)

  const thisMonthExpenses = useMemo(
    () => expenses.filter((t) => t.date.slice(0, 7) === thisMonthKey),
    [expenses, thisMonthKey],
  )
  const thisMonthIncomes = useMemo(
    () => incomes.filter((t) => t.date.slice(0, 7) === thisMonthKey),
    [incomes, thisMonthKey],
  )

  const totalExpenses = useMemo(
    () => thisMonthExpenses.reduce((s, t) => s + Number(t.amount), 0),
    [thisMonthExpenses],
  )
  const totalIncome = useMemo(
    () => thisMonthIncomes.reduce((s, t) => s + Number(t.amount), 0),
    [thisMonthIncomes],
  )
  const netSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0

  // Daily burn rate (this month so far)
  const daysInMonth = now.getDate()
  const dailyBurn = daysInMonth > 0 ? totalExpenses / daysInMonth : 0

  // Top category this month
  const topCategory = useMemo(() => {
    const catTotals = new Map<string, number>()
    for (const t of thisMonthExpenses) {
      const key = t.category_id ?? "uncategorized"
      catTotals.set(key, (catTotals.get(key) ?? 0) + Number(t.amount))
    }
    let best = { id: "uncategorized", name: "Uncategorized", icon: "tag", color: "slate", total: 0 }
    for (const [id, total] of catTotals) {
      const cat = catById.get(id)
      if (total > best.total) {
        best = {
          id,
          name: cat?.name ?? "Uncategorized",
          icon: cat?.icon ?? "tag",
          color: cat?.color ?? "slate",
          total,
        }
      }
    }
    return best
  }, [thisMonthExpenses, catById])

  // --- Monthly bar chart (last 6 months) ---
  const monthlyData = useMemo(() => {
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(monthKey(d))
    }
    return months.map((key) => {
      const monthExpenses = expenses
        .filter((t) => t.date.slice(0, 7) === key)
        .reduce((s, t) => s + Number(t.amount), 0)
      const monthIncome = incomes
        .filter((t) => t.date.slice(0, 7) === key)
        .reduce((s, t) => s + Number(t.amount), 0)
      return {
        label: monthLabel(key),
        Expenses: Math.round(monthExpenses * 100) / 100,
        Income: Math.round(monthIncome * 100) / 100,
      }
    })
  }, [expenses, incomes, now])

  // --- Category donut (all-time expenses) ---
  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>()
    for (const t of expenses) {
      const key = t.category_id ?? "uncategorized"
      totals.set(key, (totals.get(key) ?? 0) + Number(t.amount))
    }
    const totalAll = Array.from(totals.values()).reduce((a, b) => a + b, 0)
    return Array.from(totals.entries())
      .map(([id, total]) => {
        const cat = catById.get(id)
        return {
          id,
          name: cat?.name ?? "Uncategorized",
          icon: cat?.icon ?? "tag",
          color: cat?.color ?? "slate",
          total,
          pct: totalAll > 0 ? Math.round((total / totalAll) * 100) : 0,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [expenses, catById])

  // --- Daily spending trend (last 30 days) ---
  const dailyTrend = useMemo(() => {
    const days: { date: string; label: string; total: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days.push({ date: key, label: d.toLocaleDateString("default", { month: "short", day: "numeric" }), total: 0 })
    }
    const dayMap = new Map(days.map((d) => [d.date, d]))
    for (const t of thisMonthExpenses) {
      const entry = dayMap.get(t.date)
      if (entry) entry.total += Number(t.amount)
    }
    return days.map((d) => ({
      ...d,
      total: Math.round(d.total * 100) / 100,
    }))
  }, [thisMonthExpenses, now])

  // --- Top 5 spending categories (this month) ---
  const topCategories = useMemo(() => {
    const totals = new Map<string, number>()
    for (const t of thisMonthExpenses) {
      const key = t.category_id ?? "uncategorized"
      totals.set(key, (totals.get(key) ?? 0) + Number(t.amount))
    }
    return Array.from(totals.entries())
      .map(([id, total]) => {
        const cat = catById.get(id)
        return {
          id,
          name: cat?.name ?? "Uncategorized",
          icon: cat?.icon ?? "tag",
          color: cat?.color ?? "slate",
          total,
        }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [thisMonthExpenses, catById])

  const maxCatTotal = topCategories.length > 0 ? topCategories[0].total : 1

  // --- Budget progress ---
  const budgetProgress = useMemo(() => {
    return budgets.map((b) => {
      const start = periodStart(b.period, now)
      const spend = expenses
        .filter(
          (t) =>
            t.category_id === b.category_id &&
            new Date(t.date) >= start,
        )
        .reduce((s, t) => s + Number(t.amount), 0)
      const cat = catById.get(b.category_id)
      return {
        budget: b,
        cat,
        spend,
        pct: Math.min(100, Math.round((spend / Number(b.amount)) * 100)),
      }
    })
  }, [budgets, expenses, catById, now])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/expenses"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 h-8 gap-1",
          )}
        >
          <ArrowLeft className="size-3.5" /> Expenses
        </Link>
      </div>

      <PageHeader title="Expense analytics" />

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingDown className="size-4" />}
          label="Spent · this month"
          value={`₹${fmt(totalExpenses)}`}
          tint="chart-3"
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Income · this month"
          value={`₹${fmt(totalIncome)}`}
          tint="chart-4"
        />
        <StatCard
          icon={<Scale className="size-4" />}
          label="Net savings"
          value={`${netSavings >= 0 ? "+" : ""}₹${fmt(Math.abs(netSavings))}`}
          tint={netSavings >= 0 ? "chart-2" : "chart-3"}
        />
        <StatCard
          icon={<Percent className="size-4" />}
          label="Savings rate"
          value={`${savingsRate}%`}
          tint="chart-1"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<DollarSign className="size-4" />}
          label="Daily burn rate"
          value={`₹${fmt(dailyBurn)}`}
          tint="chart-1"
        />
        <StatCard
          icon={<BarChart3 className="size-4" />}
          label="Top category"
          value={topCategory.name}
          sub={topCategory.total > 0 ? `₹${fmt(topCategory.total)}` : undefined}
          tint="chart-2"
        />
        <StatCard
          icon={<Target className="size-4" />}
          label="Transactions · this month"
          value={String(thisMonthExpenses.length)}
          tint="chart-4"
        />
      </div>

      {/* Monthly Income vs Expenses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly overview · last 6 months</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
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
                fontSize={11}
                tick={{ fill: "currentColor", opacity: 0.6 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={50}
                tickFormatter={(v) => `₹${v.toLocaleString()}`}
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
                formatter={(v) => [`₹${fmt(Number(v))}`, undefined]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
              />
              <Bar
                dataKey="Expenses"
                fill="var(--chart-3)"
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="Income"
                fill="var(--chart-2)"
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Category Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending by category · all time</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No expense data yet.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {categoryBreakdown.map((entry, i) => (
                          <Cell
                            key={entry.id}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(v) => [`₹${fmt(Number(v))}`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {categoryBreakdown.slice(0, 6).map((cat, i) => (
                    <div key={cat.id} className="flex items-center gap-2 text-sm">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <CategoryEmoji emoji={cat.icon} color={cat.color} />
                      <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {cat.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Spending Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily spending · last 30 days</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyTrend}
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
                  fontSize={9}
                  tick={{ fill: "currentColor", opacity: 0.6 }}
                  interval={4}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={50}
                  tickFormatter={(v) => `₹${v}`}
                  tick={{ fill: "currentColor", opacity: 0.6 }}
                />
                <Tooltip
                  cursor={{ stroke: "currentColor", opacity: 0.2 }}
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`₹${fmt(Number(v))}`, "Spent"]}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "var(--chart-3)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top categories · this month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topCategories.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No expenses this month.
            </p>
          ) : (
            topCategories.map((cat) => {
              const pct = maxCatTotal > 0 ? (cat.total / maxCatTotal) * 100 : 0
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CategoryEmoji emoji={cat.icon} color={cat.color} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {cat.name}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      ₹{fmt(cat.total)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-chart-3"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Budget Progress */}
      {budgetProgress.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Budget progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetProgress.map(({ budget, cat, spend, pct }) => {
              const over = spend > Number(budget.amount)
              return (
                <div key={budget.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                      <CategoryEmoji emoji={cat?.icon} color={cat?.color} />
                      <span className="truncate">{cat?.name ?? "Unknown"}</span>
                      <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium capitalize text-accent-foreground">
                        {budget.period}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      ₹{fmt(spend)} / ₹{fmt(Number(budget.amount))}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className={cn(
                      over && "[&_[data-slot=progress-indicator]]:bg-destructive",
                    )}
                  />
                  <p
                    className={cn(
                      "text-xs tabular-nums",
                      over
                        ? "font-medium text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {over
                      ? `₹${fmt(spend - Number(budget.amount))} over budget`
                      : `${pct}% used · ₹${fmt(Number(budget.amount) - spend)} left`}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
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
          {sub && (
            <p className="text-xs tabular-nums text-muted-foreground">{sub}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
