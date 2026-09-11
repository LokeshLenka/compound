"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, ListChecks, Repeat, BookOpen, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useGlobalSearch } from "./use-global-search"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

const KIND_ICONS = {
  habit: Repeat,
  task: ListChecks,
  note: FileText,
  diary: BookOpen,
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const router = useRouter()
  const { data, isFetching } = useGlobalSearch(open ? q : "")

  const openSearch = () => setOpen(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const total = data?.reduce((n, g) => n + g.results.length, 0) ?? 0

  return (
    <>
      <Button
        variant="outline"
        className="text-muted-foreground"
        aria-label="Search (Ctrl+K)"
        onClick={openSearch}
      >
        <Search className="size-4" />
        <span className="hidden lg:inline">Search&hellip;</span>
        <kbd className="ml-auto hidden rounded border px-1.5 text-[10px] md:inline">Ctrl&nbsp;K</kbd>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setQ("")
        }}
      >
        <DialogContent className="top-[15%] max-w-xl gap-0 p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="border-b p-3">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search habits, tasks, notes, diary&hellip;"
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {q.trim().length < 2 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Type at least 2 characters
              </p>
            ) : isFetching ? (
              <div className="flex justify-center p-6">
                <Spinner />
              </div>
            ) : total === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No results for &ldquo;{q.trim()}&rdquo;
              </p>
            ) : (
              data?.map((group) => (
                <div key={group.kind} className="mb-2">
                  <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  {group.results.map((r) => {
                    const Icon = KIND_ICONS[r.kind]
                    return (
                      <Link
                        key={`${r.kind}-${r.id}`}
                        href={r.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "my-0.5 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{r.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
            <kbd className="rounded border px-1">Enter</kbd>
            <span>opens result&nbsp;&middot;&nbsp;</span>
            <kbd className="rounded border px-1">Esc</kbd>
            <span>closes</span>
            <div className="ml-auto">
              <button
                className="hidden hover:text-foreground md:inline"
                onClick={() => router.push("/dashboard")}
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}