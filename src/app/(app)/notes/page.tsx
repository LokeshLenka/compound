"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Pin,
  Search,
  FileText,
  X,
  Save,
  Trash2,
  PenLine,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Keyboard,
} from "lucide-react";
import {
  useNotes,
  useSaveNote,
  useDeleteNote,
  useTogglePin,
} from "@/features/notes/use-notes";
import { MarkdownEditor } from "@/features/notes/markdown-editor";
import { splitTags } from "@/lib/schemas";
import { CreateFab } from "@/components/create-fab";
import type { Note } from "@/lib/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Component as VintageKeyboard } from "@/components/ui/vintage-keyboard";

const AUTO_SAVE_DELAY = 2000;

function excerpt(content: string, len = 160): string {
  return content
    .replace(/[#>*`\[\]()!~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, len);
}

export default function NotesPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      }
    >
      <NotesPageContent />
    </Suspense>
  );
}

function NotesPageContent() {
  const searchParams = useSearchParams();
  const { data: notes, isLoading } = useNotes();
  const saveNote = useSaveNote();
  const deleteNote = useDeleteNote();
  const togglePin = useTogglePin();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    const q = searchParams.get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("create")) {
      openEditor(null);
    }
  }, [searchParams]);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of notes ?? [])
      for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [notes]);

  const visible = useMemo(() => {
    let list = notes ?? [];
    if (tagFilter) list = list.filter((n) => n.tags.includes(tagFilter));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.includes(q)),
      );
    }
    return list;
  }, [notes, query, tagFilter]);

  const firstMatchId = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return visible.find((n) => n.title.toLowerCase().includes(q))?.id ?? null;
  }, [visible, query]);

  useEffect(() => {
    if (!firstMatchId) return;
    const id = firstMatchId;
    requestAnimationFrame(() => {
      document
        .getElementById(`note-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [firstMatchId]);

  /* ── editor helpers ── */

  const snapshot = useMemo(
    () => JSON.stringify({ title, content, tagsInput, isPinned }),
    [title, content, tagsInput, isPinned],
  );

  const doSave = useCallback(async () => {
    await saveNote.mutateAsync({
      id: activeNote?.id,
      values: {
        title: title || "Untitled",
        content,
        tags: splitTags(tagsInput || ""),
      },
    });
    lastSavedRef.current = snapshot;
    setDirty(false);
  }, [activeNote, title, content, tagsInput, snapshot, saveNote]);

  useEffect(() => {
    if (!dirty || snapshot === lastSavedRef.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      void doSave();
    }, AUTO_SAVE_DELAY);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [dirty, snapshot, doSave]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  function markDirty() {
    setDirty(true);
  }

  function openEditor(note: Note | null) {
    setActiveNote(note);
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setTagsInput(note?.tags?.join(", ") ?? "");
    setIsPinned(note?.is_pinned ?? false);
    setDirty(false);
    lastSavedRef.current = JSON.stringify({
      title: note?.title ?? "",
      content: note?.content ?? "",
      tagsInput: note?.tags?.join(", ") ?? "",
      isPinned: note?.is_pinned ?? false,
    });
    setEditing(true);
    setTimeout(() => document.getElementById("note-title")?.focus(), 50);
  }

  function closeEditor() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (dirty && snapshot !== lastSavedRef.current) {
      void doSave();
    }
    setEditing(false);
  }

  async function handleSave() {
    await saveNote.mutateAsync({
      id: activeNote?.id,
      values: {
        title: title || "Untitled",
        content,
        tags: splitTags(tagsInput || ""),
      },
    });
    lastSavedRef.current = snapshot;
    setDirty(false);
  }

  /* ── full-screen editor ── */

  if (editing) {
    const sidebarContent = (
      <div className="space-y-5">
        {/* Pin */}
        <div className="space-y-2.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pin
          </Label>
          <button
            type="button"
            onClick={() => {
              setIsPinned((p) => !p);
              markDirty();
            }}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
              isPinned
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Pin className={cn("size-4", isPinned && "fill-current")} />
            {isPinned ? "Pinned" : "Pin this note"}
          </button>
        </div>

        {/* Tags */}
        <div className="space-y-2.5 pb-10">
          <Label
            htmlFor="note-tags"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Tags
          </Label>
          <Input
            id="note-tags"
            placeholder="ideas, work, journal"
            value={tagsInput}
            onChange={(e) => {
              setTagsInput(e.target.value);
              markDirty();
            }}
          />
        </div>
      </div>
    );

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={closeEditor}
            className="gap-1.5"
          >
            <X className="size-4" />
            Close
          </Button>
          <h2 className="text-sm font-medium text-muted-foreground truncate">
            {activeNote?.title || "New note"}
            {dirty && (
              <span className="ml-2 text-xs text-orange-500">Unsaved</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileSettingsOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
            </Button>
            {activeNote && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
            <ConfirmDeleteDialog
              open={confirmDeleteOpen}
              onOpenChange={setConfirmDeleteOpen}
              onConfirm={() => {
                if (activeNote) void deleteNote.mutate(activeNote.id);
                setEditing(false);
              }}
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveNote.isPending}
            >
              <Save className="mr-1 size-3" />
              Save
            </Button>
          </div>
        </header>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Writing area */}
          <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Input
              id="note-title"
              placeholder="Give your note a title…"
              className="text-xl font-semibold border-0 px-0 shadow-none focus-visible:ring-0 h-auto py-1"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                markDirty();
              }}
            />
            <div className="mt-2 flex-1 min-h-[50vh] lg:min-h-0">
              <MarkdownEditor
                key={activeNote?.id ?? "new"}
                content={activeNote?.content ?? ""}
                onChange={(md) => {
                  setContent(md);
                  markDirty();
                }}
                placeholder="Write your note…"
              />
            </div>
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden shrink-0 border-l p-4 sm:p-5 lg:block lg:w-72 lg:overflow-y-auto">
            {sidebarContent}

            {/* Keyboard toggle — desktop only */}
            <div className="mt-5 space-y-2.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Keyboard
              </Label>
              <button
                type="button"
                onClick={() => setKeyboardVisible((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  keyboardVisible
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Keyboard className="size-4" />
                {keyboardVisible ? "Visible" : "Hidden"}
              </button>
            </div>

            {/* Sound toggle — desktop only, only when keyboard is visible */}
            {keyboardVisible && (
              <div className="mt-5 space-y-2.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sound
                </Label>
                <button
                  type="button"
                  onClick={() => setSoundEnabled((s) => !s)}
                  className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {soundEnabled ? (
                    <Volume2 className="size-4" />
                  ) : (
                    <VolumeX className="size-4" />
                  )}
                  {soundEnabled ? "On" : "Off"}
                </button>
              </div>
            )}
          </aside>
        </div>

        {/* Keyboard: desktop only */}
        {keyboardVisible && (
          <div className="hidden max-h-[45vh] overflow-hidden border-t lg:block">
            <div className="[&>.kb-viewport]:!min-h-0 [&>.kb-viewport]:h-full">
              <VintageKeyboard muted={!soundEnabled} />
            </div>
          </div>
        )}

        {/* Mobile settings sheet */}
        <Sheet open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[80vh] overflow-y-auto px-4"
            showCloseButton={false}
          >
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  /* ── overview ── */

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notes"
        actions={
          <Button
            className="hidden md:inline-flex"
            onClick={() => openEditor(null)}
          >
            <Plus className="mr-1 size-4" /> New note
          </Button>
        }
      />

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
            <p className="mb-3 flex justify-center">
              <span className="grid size-14 place-items-center rounded-full bg-chart-3/12 text-chart-3">
                <FileText className="size-6" aria-hidden />
              </span>
            </p>
            <p className="text-sm">
              No notes yet{query || tagFilter ? " match these filters" : ""}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((n) => (
            <Card
              key={n.id}
              id={`note-${n.id}`}
              className={cn(
                "group h-fit cursor-pointer transition hover:border-primary/50 hover:card-shadow",
                n.id === firstMatchId && "ring-2 ring-primary",
              )}
            >
              <CardContent
                className="space-y-2 p-4"
                onClick={() => openEditor(n)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-semibold">
                    {n.title || "Untitled"}
                  </h3>
                  <div
                    className={cn(
                      "flex shrink-0 items-center gap-1 transition",
                      n.is_pinned
                        ? "opacity-100"
                        : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label={n.is_pinned ? "Unpin" : "Pin"}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin.mutate({ id: n.id, pinned: !n.is_pinned });
                      }}
                    >
                      <Pin
                        className={cn(
                          "size-3.5",
                          n.is_pinned && "fill-current",
                        )}
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

      <CreateFab label="New note" onClick={() => openEditor(null)} />
    </div>
  );
}
