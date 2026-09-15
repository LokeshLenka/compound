"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Save,
  Trash2,
  Volume2,
  VolumeX,
  X,
  PenLine,
  SlidersHorizontal,
} from "lucide-react";
import {
  useDiaryEntries,
  useSaveDiaryEntry,
  useDeleteDiaryEntry,
} from "@/features/diary/use-diary";
import { DiaryCalendar } from "@/features/diary/diary-calendar";
import { MarkdownEditor } from "@/features/notes/markdown-editor";
import { MOODS, moodEmoji } from "@/features/diary/moods";
import { todayISO, humanDate } from "@/lib/dates";
import { splitTags } from "@/lib/schemas";
import type { DiaryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreateFab } from "@/components/create-fab";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Component as VintageKeyboard } from "@/components/ui/vintage-keyboard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const AUTO_SAVE_DELAY = 2000;

export default function DiaryPage() {
  const { data: entries, isLoading } = useDiaryEntries();
  const saveEntry = useSaveDiaryEntry();
  const deleteEntry = useDeleteDiaryEntry();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const byDate = useMemo(
    () => new Map((entries ?? []).map((e) => [e.entry_date, e])),
    [entries],
  );
  const entry: DiaryEntry | undefined = byDate.get(selectedDate);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [weather, setWeather] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [dirty, setDirty] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [editing, setEditing] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setTitle(entry?.title ?? "");
    setContent(entry?.content ?? "");
    setMood(entry?.mood ?? null);
    setWeather(entry?.weather ?? "");
    setTagsInput(entry?.tags?.join(", ") ?? "");
    setDirty(false);
  }, [entry, selectedDate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const snapshot = useMemo(
    () => JSON.stringify({ title, content, mood, weather, tagsInput }),
    [title, content, mood, weather, tagsInput],
  );

  const doSave = useCallback(async () => {
    const payload = {
      entry_date: selectedDate,
      values: {
        title,
        content,
        mood,
        weather: weather || null,
        tags: splitTags(tagsInput || ""),
      },
    };
    await saveEntry.mutateAsync(payload);
    lastSavedRef.current = snapshot;
    setDirty(false);
  }, [
    selectedDate,
    title,
    content,
    mood,
    weather,
    tagsInput,
    snapshot,
    saveEntry,
  ]);

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

  function noteDirty() {
    setDirty(true);
  }

  function openEditor(date?: string) {
    if (date) setSelectedDate(date);
    setEditing(true);
    setTimeout(() => document.getElementById("diary-title")?.focus(), 50);
  }

  function closeEditor() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (dirty && snapshot !== lastSavedRef.current) {
      void doSave();
    }
    setEditing(false);
  }

  if (editing) {
    const sidebarContent = (
      <div className="space-y-5 px-4 sm:px-0">
        {/* Calendar */}
        <div className={isLoading ? "animate-pulse" : ""}>
          <DiaryCalendar
            entries={entries ?? []}
            selectedDate={selectedDate}
            onSelect={(d) => {
              setSelectedDate(d);
              setMobileSettingsOpen(false);
            }}
          />
        </div>

        {/* Mood */}
        <div className="space-y-2.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Mood
          </Label>
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Mood"
          >
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                aria-label={m.label}
                aria-pressed={mood === m.value}
                onClick={() => {
                  setMood(mood === m.value ? null : m.value);
                  noteDirty();
                }}
                className={cn(
                  "grid size-9 place-items-center rounded-full text-lg transition active:scale-95",
                  mood === m.value
                    ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
                    : "bg-muted/60 hover:bg-muted",
                )}
              >
                <span aria-hidden>{m.emoji}</span>
              </button>
            ))}
            {mood !== null && mood !== undefined && (
              <button
                type="button"
                onClick={() => {
                  setMood(null);
                  noteDirty();
                }}
                className="ml-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Weather */}
        <div className="space-y-2.5">
          <Label
            htmlFor="diary-weather"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Weather
          </Label>
          <Input
            id="diary-weather"
            placeholder="e.g. sunny, 21°"
            value={weather}
            onChange={(e) => {
              setWeather(e.target.value);
              noteDirty();
            }}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2.5">
          <Label
            htmlFor="diary-tags"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Tags
          </Label>
          <Input
            id="diary-tags"
            placeholder="work, hike, food"
            value={tagsInput}
            onChange={(e) => {
              setTagsInput(e.target.value);
              noteDirty();
            }}
          />
        </div>

        {/* Sound toggle */}
        <div className="space-y-2.5">
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
          <h2 className="text-sm font-medium text-muted-foreground">
            <span className="hidden lg:block">
              {humanDate(selectedDate, "EEEE, MMMM d, yyyy")}
            </span>
            <span className="block lg:hidden">
              {humanDate(selectedDate, "EEE, MMM d")}
            </span>
            {dirty && (
              <span className="ml-2 text-xs text-orange-500">Unsaved</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {/* Mobile: settings toggle */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileSettingsOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
            </Button>
            {entry && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => void deleteEntry.mutate(entry.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveEntry.isPending}
            >
              <Save className="mr-1 size-3" />
              Save
            </Button>
          </div>
        </header>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {/* Writing area */}
            <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
              <Input
                id="diary-title"
                placeholder="A short title for today…"
                className="text-xl font-semibold border-0 px-0 shadow-none focus-visible:ring-0 h-auto py-1"
                autoFocus
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  noteDirty();
                }}
              />
              <div className="mt-2 flex-1 min-h-[50vh] lg:min-h-0">
                <MarkdownEditor
                  key={selectedDate}
                  content={content}
                  onChange={(md) => {
                    setContent(md);
                    noteDirty();
                  }}
                  placeholder="Write your day…"
                />
              </div>
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden shrink-0 border-l p-4 sm:p-5 lg:block lg:w-72 lg:overflow-y-auto">
              {sidebarContent}
            </aside>
          </div>

          {/* Keyboard: desktop only */}
          <div className="hidden max-h-[45vh] overflow-hidden border-t lg:block">
            <div className="[&>.kb-viewport]:!min-h-0 [&>.kb-viewport]:h-full">
              <VintageKeyboard muted={!soundEnabled} />
            </div>
          </div>
        </div>

        {/* Mobile settings sheet */}
        <Sheet open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[80vh] overflow-y-auto"
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

  async function handleSave() {
    await saveEntry.mutateAsync({
      entry_date: selectedDate,
      values: {
        title,
        content,
        mood,
        weather: weather || null,
        tags: splitTags(tagsInput || ""),
      },
    });
    lastSavedRef.current = snapshot;
    setDirty(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Diary"
        actions={
          <Button
            onClick={() => openEditor()}
            className="hidden gap-1.5 md:inline-flex"
          >
            <PenLine className="size-4" /> Write entry
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
        <div
          className={`order-2 lg:order-1 ${isLoading ? "animate-pulse" : ""}`}
        >
          <DiaryCalendar
            entries={entries ?? []}
            selectedDate={selectedDate}
            onSelect={(d) => openEditor(d)}
          />
        </div>

        <div className="order-1 h-fit lg:order-2">
          <button
            type="button"
            onClick={() => openEditor()}
            className="w-full rounded-xl border border-dashed p-6 text-left text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <PenLine className="size-4" />
              <span className="text-sm font-medium">
                {entry
                  ? "Edit entry for " + humanDate(selectedDate, "MMM d")
                  : "Write for " + humanDate(selectedDate, "MMM d")}
              </span>
            </div>
            {entry && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span aria-hidden>{moodEmoji(entry.mood)}</span>
                <span className="truncate">
                  {entry.title || entry.content.slice(0, 60)}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      <CreateFab label="Write today's entry" onClick={() => openEditor()} />
    </div>
  );
}
