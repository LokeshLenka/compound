"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  journalSchema,
  splitTags,
  type JournalFormValues,
} from "@/lib/schemas";
import type { JournalEntry } from "@/lib/types";
import {
  useSaveJournalEntry,
  useDeleteJournalEntry,
} from "@/features/journaling/use-journaling";
import { MOODS } from "@/features/diary/moods";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/features/notes/markdown-editor";
import { cn } from "@/lib/utils";
import {
  Trash2,
  Volume2,
  VolumeX,
  X,
  Keyboard,
  SlidersHorizontal,
} from "lucide-react";
import { Component as VintageKeyboard } from "@/components/ui/vintage-keyboard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const AUTO_SAVE_DELAY = 2000;

export function JournalFormDialog({
  open,
  onOpenChange,
  entry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: JournalEntry | null;
}) {
  const saveEntry = useSaveJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const isEdit = Boolean(entry);

  const { register, reset, handleSubmit, setValue, watch, control, formState } =
    useForm<JournalFormValues>({
      resolver: zodResolver(journalSchema),
      defaultValues: {
        title: "",
        content: "",
        mood: null,
        tags: [],
        category: "",
      },
    });

  const allValues = useWatch({ control });
  const [tagsInput, setTagsInput] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [dirty, setDirty] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const entryIdRef = useRef<string | undefined>(entry?.id);

  const snapshot = useMemo(
    () => JSON.stringify({ ...allValues, tagsInput }),
    [allValues, tagsInput],
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      reset({
        title: entry?.title ?? "",
        content: entry?.content ?? "",
        mood: entry?.mood ?? null,
        tags: entry?.tags ?? [],
        category: entry?.category ?? "",
      });
      setTagsInput(entry?.tags?.join(", ") ?? "");
      setDirty(false);
      entryIdRef.current = entry?.id;
      setEditorKey((k) => k + 1);
      lastSavedRef.current = JSON.stringify({
        title: entry?.title ?? "",
        content: entry?.content ?? "",
        mood: entry?.mood ?? null,
        tags: entry?.tags ?? [],
        category: entry?.category ?? "",
        tagsInput: entry?.tags?.join(", ") ?? "",
      });
    }
  }, [open, entry, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!dirty || snapshot === lastSavedRef.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      void doSave();
    }, AUTO_SAVE_DELAY);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [dirty, snapshot]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  function closeEditor() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (dirty && snapshot !== lastSavedRef.current) {
      void doSave();
    }
    setDirty(false);
    onOpenChange(false);
  }

  const doSave = useCallback(async () => {
    const values = watch();
    const savedId = await saveEntry.mutateAsync({
      id: entryIdRef.current,
      values: { ...values, tags: splitTags(tagsInput || "") },
    });
    entryIdRef.current = savedId;
    lastSavedRef.current = JSON.stringify({ ...values, tagsInput });
    setDirty(false);
  }, [tagsInput, saveEntry, watch]);

  function markDirty() {
    setDirty(true);
  }

  async function onSubmit(values: JournalFormValues) {
    const savedId = await saveEntry.mutateAsync({
      id: entryIdRef.current,
      values: { ...values, tags: splitTags(tagsInput || "") },
    });
    entryIdRef.current = savedId;
    lastSavedRef.current = snapshot;
    setDirty(false);
    onOpenChange(false);
  }

  if (!open) return null;

  const sidebarContent = (
    <div className="space-y-5 px-4 sm:px-0">
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
              aria-pressed={allValues.mood === m.value}
              onClick={() => {
                setValue("mood", allValues.mood === m.value ? null : m.value, {
                  shouldDirty: true,
                });
                markDirty();
              }}
              className={cn(
                "grid size-9 place-items-center rounded-full text-lg transition active:scale-95",
                allValues.mood === m.value
                  ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
                  : "bg-muted/60 hover:bg-muted",
              )}
            >
              <span aria-hidden>{m.emoji}</span>
            </button>
          ))}
          {allValues.mood !== null && allValues.mood !== undefined && (
            <button
              type="button"
              onClick={() => {
                setValue("mood", null, { shouldDirty: true });
                markDirty();
              }}
              className="ml-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2.5">
        <Label
          htmlFor="journal-category"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Category
        </Label>
        <Input
          id="journal-category"
          placeholder="personal, work, travel…"
          {...register("category", { onChange: markDirty })}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2.5 pb-10">
        <Label
          htmlFor="journal-tags"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Tags
        </Label>
        <Input
          id="journal-tags"
          placeholder="morning, wins, ideas"
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
        <h2 className="text-sm font-medium text-muted-foreground">
          {isEdit ? "Edit entry" : "New journal entry"}
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
          {isEdit && entry && (
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
              if (entry) void deleteEntry.mutate(entry.id);
              onOpenChange(false);
            }}
          />
          <Button
            type="submit"
            form="journal-editor-form"
            size="sm"
            disabled={formState.isSubmitting || saveEntry.isPending}
          >
            Save
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Single form wrapping writing area + sidebar */}
        <form
          id="journal-editor-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col lg:flex-row"
        >
          {/* Writing area (title + content) */}
          <div className="flex flex-1 flex-col overflow-auto p-4 sm:p-6 lg:p-8">
            <Input
              id="journal-title"
              placeholder="Give it a title (optional)"
              className="text-xl font-semibold border-0 px-5 shadow-none focus-visible:ring-0 h-auto py-1"
              autoFocus
              {...register("title", { onChange: markDirty })}
            />
            <div className="mt-2 flex-1 min-h-[40vh] lg:min-h-0">
              <MarkdownEditor
                key={editorKey}
                content={watch("content") ?? ""}
                onChange={(md) => {
                  setValue("content", md, { shouldDirty: true });
                  markDirty();
                }}
                placeholder="What's on your mind? Write freely — no structure needed…"
              />
            </div>
          </div>

          {/* Sidebar: mood, category, tags — desktop only */}
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
        </form>

        {/* Keyboard: desktop only, constrained height */}
        {keyboardVisible && (
          <div className="hidden max-h-[40vh] overflow-hidden border-t lg:block">
            <div className="[&>.kb-viewport]:!min-h-0 [&>.kb-viewport]:h-full bottom-0 w-full lg:fixed">
              <VintageKeyboard muted={!soundEnabled} />
            </div>
          </div>
        )}
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
