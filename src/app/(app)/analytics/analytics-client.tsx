"use client"

import { useMemo } from "react"
import { PageHeader } from "@/components/page-header"
import { SystemRadar } from "@/components/system/system-radar"
import { GothicCalendar } from "@/components/system/gothic-calendar"
import { PotionGrid } from "@/components/system/skill-matrix"
import { HudCard, HudCardHeader } from "@/components/system/hud-card"
import { GlobalRankCard } from "@/features/ranking/global-rank-card"
import { useHabits, useHabitLogs } from "@/features/habits/use-habits"
import { useTasks } from "@/features/tasks/use-tasks"
import { useWaterLogs, useWaterSettings } from "@/features/water/use-water"
import { useTransactions } from "@/features/expenses/use-expenses"
import { useDiaryEntries } from "@/features/diary/use-diary"
import { useJournalEntries } from "@/features/journaling/use-journaling"
import { completionRate, currentStreak } from "@/lib/habits"
import { lastNDates } from "@/lib/dates"
import { Droplet, Wallet, BookOpen, NotebookPen } from "lucide-react"

export default function AnalyticsClient() {
  const { data: habits = [] } = useHabits()
  const { data: logs = [] } = useHabitLogs()
  const { data: tasks = [] } = useTasks()
  const { data: waterLogs = [] } = useWaterLogs()
  const { data: waterSettings } = useWaterSettings()
  const { data: txns = [] } = useTransactions()
  const { data: diary = [] } = useDiaryEntries()
  const { data: journal = [] } = useJournalEntries()

  const days30 = lastNDates(30)

  // HABITS DISCIPLINE 0-100
  const habitRate = useMemo(() => {
    if (habits.length === 0) return 0
    const byId = new Map<string, string[]>()
    for (const l of logs) {
      const a = byId.get(l.habit_id) ?? []
      a.push(l.log_date)
      byId.set(l.habit_id, a)
    }
    const rates = habits.map(h => completionRate(h, byId.get(h.id) ?? [], 30))
    return Math.round((rates.reduce((a,b)=>a+b,0)/Math.max(1,rates.length))*100)
  }, [habits, logs])

  // GATES FOCUS 0-100
  const gateFocus = useMemo(() => {
    const total = tasks.length || 6
    const done = tasks.filter(t => t.status === "done").length
    const open = tasks.filter(t => t.status !== "done" && t.status !== "archived").length
    return Math.max(0, Math.min(100, Math.round(((total - open)/total)*100 + done*2)))
  }, [tasks])

  // VITALS 0-100 — 30d hit rate, no bonus
  const vitals = useMemo(() => {
    const set30 = new Set(days30)
    const daysWith = new Set(waterLogs.filter(l => set30.has(l.drank_at.slice(0,10))).map(l => l.drank_at.slice(0,10))).size
    return Math.min(100, Math.round((daysWith/30)*100))
  }, [waterLogs, days30])

  // VAULT 0-100 — last 30 days only (not all-time), net savings +50 base
  const vault = useMemo(() => {
    const set30 = new Set(days30)
    const recent = txns.filter(t => set30.has(t.date))
    const exp = recent.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0)
    const inc = recent.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0)
    if (inc===0 && exp===0) return 50
    if (inc===0) return Math.max(5, Math.min(40, Math.round(20 - Math.min(15, exp/5000))))
    return Math.max(5, Math.min(100, Math.round(((inc-exp)/inc*100 + 50))))
  }, [txns, days30])

  // SHADOW (diary last 30)
  const shadow = useMemo(() => {
    const set = new Set(diary.map(d=>d.entry_date))
    const hit = days30.filter(d=>set.has(d)).length
    return Math.round((hit/30)*100)
  }, [diary, days30])

  // CHRONICLE (journal last 30)
  const chronicle = useMemo(() => {
    const hit = days30.filter(d=> journal.some(j=> j.created_at.slice(0,10)===d)).length
    return Math.round((hit/30)*100)
  }, [journal, days30])

  const axes = [
    { label: "Discipline", value: habitRate, color: "#a855f7" },
    { label: "Focus", value: gateFocus, color: "#c084fc" },
    { label: "Vitals", value: vitals, color: "#22d3ee" },
    { label: "Vault", value: vault, color: "#eab308" },
    { label: "Shadow", value: shadow, color: "#6366f1" },
    { label: "Chronicle", value: chronicle, color: "#f472b6" },
  ]

  const bestStreak = useMemo(() => {
    const byId = new Map<string,string[]>()
    for (const l of logs) {
      const a = byId.get(l.habit_id) ?? []
      a.push(l.log_date); byId.set(l.habit_id,a)
    }
    return habits.reduce((m,h)=> Math.max(m, currentStreak(h, byId.get(h.id)??[])),0)
  }, [habits, logs])

  const activeSet = new Set([...logs.map(l=>l.log_date), ...diary.map(d=>d.entry_date), ...journal.map(j=>j.created_at.slice(0,10))])

  return (
    <div className="space-y-5">
      <PageHeader title="SYSTEM CODEX" subtitle="UNIFIED ANALYTICS — GLOBAL HUNTER RANK" />

      <GlobalRankCard variant="full" />

      <div className="grid gap-4 lg:grid-cols-3">
        <HudCard className="lg:col-span-1">
          <HudCardHeader icon={<span className="font-mono text-xs">⬢</span>} title="HUNTER MATRIX" subtitle="6-AXIS SPIDER WEB" />
          <SystemRadar axes={axes} size={240} />
        </HudCard>

        <div className="lg:col-span-2">
          <GothicCalendar days={days30} activeSet={activeSet} title={new Date().toLocaleString('default',{month:'long'}).toUpperCase()} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HudCard>
          <HudCardHeader icon={<Wallet className="size-4" />} title="VAULT INVENTORY" subtitle="POTIONS & GOLD" />
          <PotionGrid items={[
            { icon: "🧪", label: "VAULT", value: `${txns.length}`, tint: "border-violet-400/20 bg-violet-500/5 text-violet-300" },
            { icon: "💧", label: "VIALS", value: `${waterLogs.length}`, tint: "border-cyan-400/20 bg-cyan-500/5 text-cyan-300" },
            { icon: "📓", label: "SHADOWS", value: `${diary.length}`, tint: "border-indigo-400/20 bg-indigo-500/5 text-indigo-300" },
            { icon: "📔", label: "CHRONICLE", value: `${journal.length}`, tint: "border-pink-400/20 bg-pink-500/5 text-pink-300" },
            { icon: "⚔️", label: "GATES", value: `${tasks.length}`, tint: "border-amber-400/20 bg-amber-500/5 text-amber-300" },
            { icon: "🔥", label: "STREAK", value: `${bestStreak}`, tint: "border-violet-400/20 bg-primary/10 text-primary" },
          ]} />
        </HudCard>

        <HudCard>
          <HudCardHeader icon={<Droplet className="size-4" />} title="RECENT SHADOWS" subtitle="LAST 5 ENTRIES" />
          <div className="space-y-2">
            {diary.slice(0,3).map(d=> (
              <div key={d.id} className="flex items-center gap-2 border border-primary/10 bg-primary/[0.03] px-2 py-1.5">
                <BookOpen className="size-3 text-primary" />
                <span className="truncate text-xs font-medium">{d.title || d.entry_date}</span>
                <span className="ml-auto font-mono text-[0.62rem] text-muted-foreground">{d.entry_date}</span>
              </div>
            ))}
            {journal.slice(0,2).map(j=> (
              <div key={j.id} className="flex items-center gap-2 border border-primary/10 bg-primary/[0.03] px-2 py-1.5">
                <NotebookPen className="size-3 text-violet-400" />
                <span className="truncate text-xs font-medium">{j.title || j.content.slice(0,20)}</span>
                <span className="ml-auto font-mono text-[0.62rem] text-muted-foreground">{j.created_at.slice(0,10)}</span>
              </div>
            ))}
            {diary.length===0 && journal.length===0 && <p className="py-4 text-center font-mono text-xs tracking-widest text-muted-foreground">◆ NO SHADOWS YET ◆</p>}
          </div>
        </HudCard>
      </div>
    </div>
  )
}
