"use client"

import { useMemo } from "react"
import { useHabits, useHabitLogs } from "@/features/habits/use-habits"
import { useTasks } from "@/features/tasks/use-tasks"
import { useWaterLogs } from "@/features/water/use-water"
import { useTransactions } from "@/features/expenses/use-expenses"
import { useDebts } from "@/features/expenses/use-expenses"
import { useDiaryEntries } from "@/features/diary/use-diary"
import { useJournalEntries } from "@/features/journaling/use-journaling"
import { completionRate, currentStreak } from "@/lib/habits"
import { lastNDates } from "@/lib/dates"
import { computeGlobalScore } from "@/lib/ranking"

export function useGlobalRank() {
  const { data: habits = [] } = useHabits()
  const { data: logs = [] } = useHabitLogs()
  const { data: tasks = [] } = useTasks()
  const { data: waterLogs = [] } = useWaterLogs()
  const { data: txns = [] } = useTransactions()
  const { data: debts = [] } = useDebts()
  const { data: diary = [] } = useDiaryEntries()
  const { data: journal = [] } = useJournalEntries()

  return useMemo(() => {
    const days30 = lastNDates(30)
    const set30 = new Set(days30)

    // HABIT SCORE 0-100 — empty => 0 (not free points)
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
    }

    // TASK SCORE — 0 when no tasks. Otherwise done/total *100. No bonus inflation.
    let taskScore = 0
    if (tasks.length > 0) {
      const done = tasks.filter((t) => t.status === "done").length
      taskScore = Math.round((done / tasks.length) * 100)
    }

    // WATER SCORE — days with logs in last 30 confers
    const daysWithWater = new Set(waterLogs.filter((l) => set30.has(l.drank_at.slice(0, 10))).map((l) => l.drank_at.slice(0, 10))).size
    const waterScore = Math.min(100, Math.round((daysWithWater / 30) * 100))

    // DIARY SCORE — entries in window
    const diarySet = new Set(diary.map((d) => d.entry_date))
    const diaryScore = Math.round((days30.filter((d) => diarySet.has(d)).length / 30) * 100)

    // JOURNAL SCORE — created_at in window
    const journalScore = Math.round((days30.filter((d) => journal.some((j) => j.created_at.slice(0, 10) === d)).length / 30) * 100)

    // VAULT SCORE — empty => 0 (was 50 inflated). If has data: savings rate.
    let vaultScore = 0
    const recentTxns = txns.filter((t) => set30.has(t.date))
    if (recentTxns.length > 0) {
      const exp = recentTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0)
      const inc = recentTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0)
      if (inc === 0 && exp === 0) vaultScore = 0
      else if (inc === 0) vaultScore = 0 // spending without income is not vault mastery
      else vaultScore = Math.max(0, Math.min(100, Math.round(((inc - exp) / inc) * 100)))
    }

    // BEST STREAK — current streak across habits
    const byId2 = new Map<string, string[]>()
    for (const l of logs) {
      const a = byId2.get(l.habit_id) ?? []
      a.push(l.log_date)
      byId2.set(l.habit_id, a)
    }
    const bestStreak = habits.reduce((m, h) => Math.max(m, currentStreak(h, byId2.get(h.id) ?? [])), 0)

    const txCount = recentTxns.length
    const totalLogs = logs.length + recentTxns.length + diary.length + journal.length + waterLogs.filter((l) => set30.has(l.drank_at.slice(0, 10))).length

    // DEBT SCORE — empty => 0 for brand new users (no data), but 100 for active users with no debts (discipline reward)
    let debtScore = 0
    if (debts.length === 0) {
      debtScore = totalLogs > 3 ? 100 : 0
    } else {
      const paid = debts.filter((d) => d.status === "paid").length
      const overdue = debts.filter((d) => d.status === "overdue").length
      const base = (paid / debts.length) * 100
      debtScore = Math.max(0, Math.round(base - overdue * 12))
    }

    const result = computeGlobalScore({
      habitScore,
      taskScore,
      waterScore,
      diaryScore,
      journalScore,
      vaultScore,
      debtScore,
      bestStreak,
      txCount,
      totalLogs,
    })

    return {
      ...result,
      metrics: { habitScore, taskScore, waterScore, diaryScore, journalScore, vaultScore, debtScore, bestStreak, txCount, totalLogs },
    }
  }, [habits, logs, tasks, waterLogs, txns, debts, diary, journal])
}
