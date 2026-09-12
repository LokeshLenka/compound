"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Pin, Search } from "lucide-react"
import { useNotes, useTogglePin } from "@/features/notes/use-notes"
import { NoteFormDialog } from "@/features/notes/note-form"
import type { Note } from "@/lib/types"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function excerpt(content: string, len = 160): string {
  return content
    .replace(/[#>*`\[\]()!~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, len)
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>}>
      <NotesPageContent />
    </Suspense>
  )
}

function NotesPageContent() {
  const searchParams = useSearchParams()
  const { data: notes, isLoading } = useNotes()
  const togglePin = useTogglePin()

  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)

  useEffect(() => {
    const q = searchParams.get("q")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setQuery(q)
  }, [searchParams])

  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of notes ?? []) for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [notes])

  const visible = useMemo(() => {
    let list = notes ?? []
    if (tagFilter) list = list.filter((n) => n.tags.includes(tagFilter))
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.includes(q)),
      )
    }
    return list
  }, [notes, query, tagFilter])

  const firstMatchId = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    return visible.find((n) => n.title.toLowerCase().includes(q))?.id ?? null
  }, [visible, query])

  useEffect(() => {
    if (!firstMatchId) return
    const id = firstMatchId
    requestAnimationFrame(() => {
      document
        .getElementById(`note-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }, [firstMatchId])

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-sm text-muted-foreground">
            Markdown notes, pinned, tagged and searchable.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-1 size-4" /> New note
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  tagFilter === tag
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-accent",
                )}
              >
                #{tag} <span className="opacity-60">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="mb-2 text-3xl">📝</p>
            <p>No notes yet. Capture your first thought.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((n) => (
            <Card
              key={n.id}
              id={`note-${n.id}`}
              className={cn(
                "group h-fit cursor-pointer transition hover:border-primary/50",
                n.id === firstMatchId && "ring-2 ring-primary",
              )}
            >
              <CardContent className="space-y-2 p-4" onClick={() => setEditing(n)}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-semibold">
                    {n.title || "Untitled"}
                  </h3>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={n.is_pinned ? "Unpin" : "Pin"}
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePin.mutate({ id: n.id, pinned: !n.is_pinned })
                      }}
                    >
                      <Pin
                        className={cn("size-3.5", n.is_pinned && "fill-current")}
                      />
                    </Button>
                  </div>
                </div>
                {n.content && (
                  <p className="line-clamp-4 text-sm text-muted-foreground">
                    {excerpt(n.content)}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-1">
                    {n.tags.map((t) => (
                      <span key={t} className="text-primary">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <span suppressHydrationWarning>
                    {format(new Date(n.updated_at), "MMM d")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NoteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        note={editing}
      />
    </div>
  )
}