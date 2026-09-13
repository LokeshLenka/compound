"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Search, List, Columns3, ListChecks } from "lucide-react"
import {
  useTasks,
  useProjects,
  useSetTaskStatus,
} from "@/features/tasks/use-tasks"
import { TaskRow } from "@/features/tasks/task-item"
import { TaskFormDialog } from "@/features/tasks/task-form"
import { STATUS_ORDER, STATUS_META } from "@/features/tasks/meta"
import { CreateFab } from "@/components/create-fab"
import type { Project, Task, TaskStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Filter = "all" | TaskStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "Doing" },
  { value: "done", label: "Done" },
]

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>}>
      <TasksPageContent />
    </Suspense>
  )
}

function TasksPageContent() {
  const searchParams = useSearchParams()
  const { data: tasks, isLoading } = useTasks()
  const { data: projects } = useProjects()
  const setStatus = useSetTaskStatus()

  const [view, setView] = useState<"list" | "board">("list")
  const [filter, setFilter] = useState<Filter>("all")
  const [priority, setPriority] = useState<string>("all")
  const [projectId, setProjectId] = useState<string>("all")
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null)

  useEffect(() => {
    const q = searchParams.get("q")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setQuery(q)
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get("create")) {
      /* eslint-disable react-hooks/set-state-in-effect */ // open create dialog from ?create=1
      setEditing(null)
      setFormOpen(true)
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [searchParams])

  const projectNames = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of projects ?? []) m.set(p.id, p.name)
    return m
  }, [projects])

  const visible = useMemo(() => {
    let list = tasks ?? []
    if (filter !== "all") list = list.filter((t) => t.status === filter)
    if (priority !== "all") list = list.filter((t) => t.priority === priority)
    if (projectId !== "all") list = list.filter((t) => t.project_id === projectId)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes ?? "").toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q)),
      )
    }
    return list.sort(
      (a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
        Number(Boolean(a.due_date)) - Number(Boolean(b.due_date)),
    )
  }, [tasks, filter, priority, projectId, query])

  const grouped = useMemo(() => {
    const g = new Map<TaskStatus, Task[]>()
    for (const s of STATUS_ORDER) g.set(s, [])
    for (const t of visible) {
      if (t.status === "archived") continue
      g.get(t.status)?.push(t)
    }
    return g
  }, [visible])

  const firstMatchId = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    return visible.find((t) => t.title.toLowerCase().includes(q))?.id ?? null
  }, [visible, query])

  useEffect(() => {
    if (!firstMatchId) return
    const id = firstMatchId
    requestAnimationFrame(() => {
      document
        .getElementById(`task-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }, [firstMatchId])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tasks"
        actions={
          <Button
            className="hidden md:inline-flex"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="mr-1 size-4" /> New task
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-full border p-1">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "secondary" : "ghost"}
              size="sm"
              className="h-9 rounded-full md:h-7"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="relative min-w-44 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={priority} onValueChange={(v) => setPriority(v ?? "all")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "all")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            <SelectItem value="none">No project</SelectItem>
            {projects?.map((p: Project) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-1 rounded-full border p-1">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-9 rounded-full md:h-7"
            onClick={() => setView("list")}
          >
            <List className="mr-1 size-3.5" /> List
          </Button>
          <Button
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            className="h-9 rounded-full md:h-7"
            onClick={() => setView("board")}
          >
            <Columns3 className="mr-1 size-3.5" /> Board
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="mb-3 flex justify-center">
              <span className="grid size-14 place-items-center rounded-full bg-chart-2/12 text-chart-2">
                <ListChecks className="size-6" aria-hidden />
              </span>
            </p>
            <p className="text-sm">No tasks match{filter === "all" ? " yet" : ""} — add one or adjust filters.</p>
            <Button
              className="mt-4 gap-1.5"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" /> Create a task
            </Button>
          </CardContent>
        </Card>
      ) : view === "list" ? (
        <div className="space-y-2">
          <p className="px-2 text-xs font-medium text-muted-foreground">
            {visible.length} tasks · {filter}
          </p>
          {visible.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              rowId={`task-${t.id}`}
              highlighted={t.id === firstMatchId}
              projectName={(id) => (id ? projectNames.get(id) : undefined)}
              onEdit={(task) => {
                setEditing(task)
                setFormOpen(true)
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {(["todo", "in_progress", "done"] as TaskStatus[]).map((status) => (
            <Card
              key={status}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
                setDragOver(status)
              }}
              onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(null)
                const id = e.dataTransfer.getData("text/plain")
                if (!id) return
                const current = tasks?.find((t) => t.id === id)?.status
                if (current && current !== status) setStatus.mutate({ id, status })
              }}
              className={cn(
                "transition",
                dragOver === status ? "bg-accent ring-2 ring-primary" : "bg-accent/40",
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span className={cn("size-2 rounded-full", STATUS_META[status].classes.split(" ")[0])} />
                  {STATUS_META[status].label}
                  <span className="ml-auto text-muted-foreground">
                    {grouped.get(status)?.length ?? 0}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {grouped.get(status)?.length ? (
                  grouped.get(status)?.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      compact
                      rowId={`task-${t.id}`}
                      highlighted={t.id === firstMatchId}
                      projectName={(id) => (id ? projectNames.get(id) : undefined)}
                      onEdit={(task) => {
                        setEditing(task)
                        setFormOpen(true)
                      }}
                    />
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                    Drop cards here
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {view === "board" && (
        <p className="text-xs text-muted-foreground">
          Tip: drag cards between columns to change their status.
        </p>
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editing}
        defaultStatus={filter === "all" || filter === "done" ? "todo" : filter}
      />

      <CreateFab
        label="New task"
        onClick={() => {
          setEditing(null)
          setFormOpen(true)
        }}
      />
    </div>
  )
}