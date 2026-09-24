"use client"

import { useMemo } from "react"
import { useHabits, useHabitLogs } from "@/features/habits/use-habits"
import { useTasks } from "@/features/tasks/use-tasks"
import { useWaterLogs, useWaterSettings } from "@/features/water/use-water"
import { useTransactions } from "@/features/expenses/use-expenses"
import { useDebts } from "@/features/expenses/use-expenses"
import { useDiaryEntries } from "@/features/diary/use-diary"
import { useJournalEntries } from "@/features/journaling/use-journaling"
import { completionRate, currentStreak } from "@/lib/habits"
import { lastNDates } from "@/lib/dates"
import { computeGlobalScore, levelFromScore } from "@/lib/ranking"

export function useGlobalRank() {
  const { data: habits = [] } = useHabits()
  const { data: logs = [] } = useHabitLogs()
  const { data: tasks = [] } = useTasks()
  const { data: waterLogs = [] } = useWaterLogs()
  const { data: waterSettings } = useWaterSettings()
  const { data: txns = [] } = useTransactions()
  const { data: debts = [] } = useDebts()
  const { data: diary = [] } = useDiaryEntries()
  const { data: journal = [] } = useJournalEntries()

  return useMemo(() => {
    const days30 = lastNDates(30)

    // HABIT SCORE 0-100
    let habitScore = 0
    if (habits.length > 0) {
      const byId = new Map<string, string[]>()
      for (const l of logs) {
        const a = byId.get(l.habit_id) ?? []
        a.push(l.log_date)
        byId.set(l.habit_id, a)
      }
      const rates = habits.map((h) => completionRate(h, byId.get(h.id) ?? [], 30))
      habitScore = rates.length ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) : 0
    } else {
      habitScore = 0
    }

    // TASK SCORE
    const totalTasks = tasks.length
    const doneTasks = tasks.filter((t) => t.status === "done").length
    const openTasks = tasks.filter((t) => t.status !== "done" && t.status !== "archived").length
    const taskScore = totalTasks === 0 ? 50 : Math.max(0, Math.min(100, Math.round(((totalTasks - openTasks) / Math.max(1, totalTasks)) * 100 + doneTasks * 0.5)))

    // WATER SCORE — last 30 days only, no bonus
    const set30 = new Set(days30)
    const daysWithWater = new Set(waterLogs.filter((l) => set30.has(l.drank_at.slice(0, 10))).map((l) => l.drank_at.slice(0, 10))).size
    const waterScore = Math.min(100, Math.round((daysWithWater / 30) * 100))

    // DIARY SCORE
    const diarySet = new Set(diary.map((d) => d.entry_date))
    const diaryScore = Math.round((days30.filter((d) => diarySet.has(d)).length / 30) * 100)

    // JOURNAL SCORE
    const journalScore = Math.round((days30.filter((d) => journal.some((j) => j.created_at.slice(0, 10) === d)).length / 30) * 100)

    // VAULT SCORE — last 30 days only
    const recentTxns = txns.filter((t) => new Set(days30).has(t.date))
    const exp = recentTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0)
    const inc = recentTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0)
    let vaultScore = 50
    if (inc === 0 && exp === 0) vaultScore = 50
    else if (inc === 0) vaultScore = Math.max(5, Math.min(40, Math.round(20 - Math.min(15, exp / 5000))))
    else vaultScore = Math.max(5, Math.min(100, Math.round(((inc - exp) / inc) * 100 + 50)))

    // DEBT SCORE
    let debtScore = 100
    if (debts.length > 0) {
      const paid = debts.filter((d) => d.status === "paid").length
      const overdue = debts.filter((d) => d.status === "overdue").length
      const base = (paid / debts.length) * 100
      debtScore = Math.max(0, Math.round(base - overdue * 10))
    }

    // BEST STREAK
    const byId2 = new Map<string, string[]>()
    for (const l of logs) {
      const a = byId2.get(l.habit_id) ?? []
      a.push(l.log_date)
      byId2.set(l.habit_id, a)
    }
    const bestStreak = habits.reduce((m, h) => Math.max(m, currentStreak(h, byId2.get(h.id) ?? [])), 0)

    const result = computeGlobalScore({
      habitScore,
      taskScore,
      waterScore,
      diaryScore,
      journalScore,
      vaultScore,
      debtScore,
      bestStreak,
    })

    const level = levelFromScore(result.score)

    return {
      ...result,
      level,
      metrics: { habitScore, taskScore, waterScore, diaryScore, journalScore, vaultScore, debtScore, bestStreak },
    }
  }, [habits, logs, tasks, waterLogs, waterSettings, txns, debts, diary, journal])
}
