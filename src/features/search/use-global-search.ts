"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export interface SearchResult {
  id: string
  kind: "habit" | "task" | "note" | "diary"
  title: string
  subtitle: string
  href: string
}

type Grouped = { kind: SearchResult["kind"]; label: string; results: SearchResult[] }

const KINDS: { kind: SearchResult["kind"]; label: string }[] = [
  { kind: "habit", label: "Habits" },
  { kind: "task", label: "Tasks" },
  { kind: "note", label: "Notes" },
  { kind: "diary", label: "Diary" },
]

/** Searches habits, tasks, notes and diary entries by name/title/content. */
export function useGlobalSearch(q: string) {
  const trimmed = q.trim()
  return useQuery({
    queryKey: ["global-search", trimmed],
    enabled: trimmed.length >= 2,
    queryFn: async (): Promise<Grouped[]> => {
      const supabase = getSupabaseBrowserClient()
      const like = `%${trimmed}%`
      const [habits, tasks, notes, diary] = await Promise.all([
        supabase
          .from("habits")
          .select("id, name, emoji")
          .ilike("name", like)
          .eq("archived", false)
          .order("sort_order")
          .limit(6),
        supabase
          .from("tasks")
          .select("id, title, status")
          .ilike("title", like)
          .neq("status", "archived")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("notes")
          .select("id, title, is_pinned")
          .ilike("title", like)
          .eq("archived", false)
          .order("updated_at", { ascending: false })
          .limit(6),
        supabase
          .from("diary_entries")
          .select("id, entry_date, content")
          .ilike("content", like)
          .order("entry_date", { ascending: false })
          .limit(4),
      ])

      const all: SearchResult[] = [
        ...(habits.data ?? []).map((h: { id: string; name: string; emoji: string | null }) => ({
          id: h.id,
          kind: "habit" as const,
          title: [h.emoji, h.name].filter(Boolean).join(" "),
          subtitle: "Habit",
          href: "/habits",
        })),
        ...(tasks.data ?? []).map((t: { id: string; title: string; status: string }) => ({
          id: t.id,
          kind: "task" as const,
          title: t.title,
          subtitle: t.status.replace("_", " "),
          href: "/tasks",
        })),
        ...(notes.data ?? []).map((n: { id: string; title: string; is_pinned: boolean }) => ({
          id: n.id,
          kind: "note" as const,
          title: n.title,
          subtitle: n.is_pinned ? "Pinned note" : "Note",
          href: "/notes",
        })),
        ...(diary.data ?? []).map((d: { id: string; entry_date: string; content: string | null }) => ({
          id: d.id,
          kind: "diary" as const,
          title: d.entry_date.slice(0, 10),
          subtitle: (d.content ?? "").slice(0, 60) || "Note",
          href: "/diary",
        })),
      ]

      return KINDS.map(({ kind, label }) => ({
        kind,
        label,
        results: all.filter((r) => r.kind === kind),
      })).filter((g) => g.results.length > 0)
    },
    placeholderData: (prev) => prev,
  })
}