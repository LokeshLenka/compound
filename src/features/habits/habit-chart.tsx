"use client"

import { useMemo } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { lastNDates } from "@/lib/dates"
import type { HabitLog } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function HabitCompletionsChart({ logs }: { logs: HabitLog[] }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>()
    for (const l of logs) counts.set(l.log_date, (counts.get(l.log_date) ?? 0) + 1)
    return lastNDates(30).map((d) => ({
      date: d,
      label: d.slice(8),
      completions: counts.get(d) ?? 0,
    }))
  }, [logs])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Check-ins · last 30 days</CardTitle>
      </CardHeader>
      <CardContent className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-20" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={4}
              fontSize={11}
              tick={{ fill: "currentColor", opacity: 0.6 }}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={40} tick={{ fill: "currentColor", opacity: 0.6 }} />
            <Tooltip
              cursor={{ fill: "currentColor", opacity: 0.06 }}
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="completions" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}