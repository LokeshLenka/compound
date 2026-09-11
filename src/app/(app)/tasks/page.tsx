"use client"

import { useMemo, useState } from "react"
import { Plus, Search, List, Columns3 } from "lucide-react"
import {
  useTasks,
  useProjects,
} from "@/features/tasks/use-tasks"
import { TaskRow } from "@/features/tasks/task-item"
import { TaskFormDialog } from "@/features/tasks/task-form"
import { STATUS_ORDER, STATUS_META } from "@/features/tasks/meta"
import type { Project, Task, TaskStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  const { data: tasks, isLoading } = useTasks()
  const { data: projects } = useProjects()

  const [view, setView] = useState<"list" | "board">("list")
  const [filter, setFilter] = useState<Filter>("all")
  const [priority, setPriority] = useState<string>("all")
  const [projectId, setProjectId] = useState<string>("all")
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

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

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground">Stay on top of what matters.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-1 size-4" /> New task
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border p-1">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "secondary" : "ghost"}
              size="sm"
              className="h-7"
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

        <div className="ml-auto flex gap-1 rounded-lg border p-1">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-7"
            onClick={() => setView("list")}
          >
            <List className="mr-1 size-3.5" /> List
          </Button>
          <Button
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            className="h-7"
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
            <p className="mb-2 text-3xl">🗂️</p>
            <p>No tasks match. Add one or adjust filters.</p>
          </CardContent>
        </Card>
      ) : view === "list" ? (
        <div className="space-y-2">
          {visible.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              projectName={(id) => (id ? projectNames.get(id) : undefined)}
              onEdit={(task) => {
                setEditing(task)
                setFormOpen(true)
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {(["todo", "in_progress", "done"] as TaskStatus[]).map((status) => (
            <Card key={status} className="bg-accent/40">
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
                      projectName={(id) => (id ? projectNames.get(id) : undefined)}
                      onEdit={(task) => {
                        setEditing(task)
                        setFormOpen(true)
                      }}
                    />
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nothing here
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editing}
        defaultStatus={filter === "all" || filter === "done" ? "todo" : filter}
      />
    </div>
  )
}