"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Plus,
  Search,
  NotebookPen,
  BookOpen,
  CalendarDays,
  TrendingUp,
  X,
} from "lucide-react"
import { useJournalEntries } from "@/features/journaling/use-journaling"
import { JournalFormDialog } from "@/features/journaling/journal-form"
import { MOODS, moodEmoji } from "@/features/diary/moods"
import { CreateFab } from "@/components/create-fab"
import type { JournalEntry } from "@/lib/types"
import { format, isAfter, subDays, startOfWeek, eachDayOfInterval } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function JournalPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <JournalPageContent />
    </Suspense>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            accent ?? "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function JournalPageContent() {
  const searchParams = useSearchParams()
  const { data: entries, isLoading } = useJournalEntries()

  const [query, setQuery] = useState("")
  const [moodFilter, setMoodFilter] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<JournalEntry | null>(null)

  useEffect(() => {
    if (searchParams.get("create")) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setEditing(null)
      setFormOpen(true)
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [searchParams])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of entries ?? []) {
      if (e.category) counts.set(e.category, (counts.get(e.category) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [entries])
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const visible = useMemo(() => {
    let list = entries ?? []
    if (moodFilter !== null) list = list.filter((e) => e.mood === moodFilter)
    if (categoryFilter) list = list.filter((e) => e.category === categoryFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (e) =>
          (e.title ?? "").toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.tags.some((t) => t.includes(q)),
      )
    }
    return list
  }, [entries, query, moodFilter, categoryFilter])

  const stats = useMemo(() => {
    const all = entries ?? []
    const now = new Date()
    const weekAgo = subDays(now, 7)
    const thisWeek = all.filter((e) => isAfter(new Date(e.created_at), weekAgo)).length

    const moodCounts = new Map<number, number>()
    for (const e of all) {
      if (e.mood != null) moodCounts.set(e.mood, (moodCounts.get(e.mood) ?? 0) + 1)
    }
    const topMood =
      [...moodCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null

    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const daysWithEntries = new Set(
      all
        .filter((e) => isAfter(new Date(e.created_at), weekStart))
        .map((e) => format(new Date(e.created_at), "yyyy-MM-dd")),
    )
    const streak = eachDayOfInterval({ start: weekStart, end: now }).filter((d) =>
      daysWithEntries.has(format(d, "yyyy-MM-dd")),
    ).length

    return { total: all.length, thisWeek, topMood, streak }
  }, [entries])

  const hasActiveFilters = query.trim() || moodFilter !== null || categoryFilter

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function clearFilters() {
    setQuery("")
    setMoodFilter(null)
    setCategoryFilter(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Journal
            </h1>
            <p className="text-sm text-muted-foreground">
              Capture your thoughts, moods, and moments
            </p>
          </div>
          <Button className="hidden md:inline-flex" onClick={openNew}>
            <Plus className="mr-1 size-4" /> New entry
          </Button>
        </div>
        <div aria-hidden className="hall-divider w-full opacity-90" />
      </header>

      {/* Stats */}
      {!isLoading && entries && entries.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={BookOpen}
            label="Total entries"
            value={stats.total}
          />
          <StatCard
            icon={CalendarDays}
            label="This week"
            value={stats.thisWeek}
            accent="bg-chart-2/15 text-chart-2"
          />
          <StatCard
            icon={TrendingUp}
            label="Days logged this week"
            value={`${stats.streak}/7`}
            accent="bg-chart-4/15 text-chart-4"
          />
        </div>
      )}

      {/* Search + Mood filter */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entries…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div
          className="flex shrink-0 items-center gap-1"
          role="group"
          aria-label="Filter by mood"
        >
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-label={`Filter by ${m.label}`}
              aria-pressed={moodFilter === m.value}
              onClick={() =>
                setMoodFilter(moodFilter === m.value ? null : m.value)
              }
              className={cn(
                "grid size-9 place-items-center rounded-full text-base transition active:scale-95",
                moodFilter === m.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 hover:bg-muted",
              )}
            >
              <span aria-hidden>{m.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() =>
                setCategoryFilter(categoryFilter === cat ? null : cat)
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                categoryFilter === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              {cat} <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {visible.length} of {entries?.length ?? 0} entries
          </span>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium transition hover:bg-muted/80"
          >
            <X className="size-3" /> Clear filters
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted/50">
              <NotebookPen className="size-7 text-muted-foreground/60" />
            </div>
            <p className="text-base font-medium text-foreground/80">
              {entries?.length
                ? "No entries match these filters"
                : "Your journal is empty"}
            </p>
            <p className="mt-1 text-sm">
              {entries?.length
                ? "Try adjusting your search or filters"
                : "Start writing to capture your thoughts and track your moods"}
            </p>
            {(!entries?.length || !hasActiveFilters) && (
              <Button className="mt-5 gap-1.5" onClick={openNew}>
                <Plus className="size-4" /> Write your first entry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((e) => (
            <Card
              key={e.id}
              className="group relative cursor-pointer overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-md"
              onClick={() => {
                setEditing(e)
                setFormOpen(true)
              }}
            >
              {/* Mood accent stripe */}
              {e.mood != null && (
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-1",
                    MOODS.find((m) => m.value === e.mood)?.bg.replace(
                      "dark:",
                      "",
                    ),
                  )}
                />
              )}
              <CardContent className="space-y-2.5 p-4 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 font-semibold leading-snug">
                    {e.title || format(new Date(e.created_at), "EEEE, MMM d")}
                  </h3>
                  {e.mood != null && (
                    <span
                      className="shrink-0 text-lg"
                      aria-label={MOODS.find((m) => m.value === e.mood)?.label}
                    >
                      {moodEmoji(e.mood)}
                    </span>
                  )}
                </div>
                {e.content && (
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {e.content}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {e.category && (
                      <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
                        {e.category}
                      </span>
                    )}
                    {e.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-primary/80">
                        #{t}
                      </span>
                    ))}
                    {e.tags.length > 3 && (
                      <span className="text-muted-foreground/60">
                        +{e.tags.length - 3}
                      </span>
                    )}
                  </div>
                  <span
                    suppressHydrationWarning
                    className="shrink-0 tabular-nums"
                  >
                    {format(new Date(e.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <JournalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        entry={editing}
      />

      <CreateFab label="New journal entry" onClick={openNew} />
    </div>
  )
}
