"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  const { register, reset, handleSubmit, setValue, watch, formState } =
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

  const mood = watch("mood");
  const [tagsInput, setTagsInput] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

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
    }
  }, [open, entry, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function onSubmit(values: JournalFormValues) {
    await saveEntry.mutateAsync({
      id: entry?.id,
      values: { ...values, tags: splitTags(tagsInput || "") },
    });
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
              aria-pressed={mood === m.value}
              onClick={() =>
                setValue("mood", mood === m.value ? null : m.value, {
                  shouldDirty: true,
                })
              }
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
              onClick={() => setValue("mood", null, { shouldDirty: true })}
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
          {...register("category")}
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
          onChange={(e) => setTagsInput(e.target.value)}
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
          onClick={() => onOpenChange(false)}
          className="gap-1.5"
        >
          <X className="size-4" />
          Cancel
        </Button>
        <h2 className="text-sm font-medium text-muted-foreground">
          {isEdit ? "Edit entry" : "New journal entry"}
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
              onClick={() => {
                void deleteEntry.mutate(entry.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
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
              {...register("title")}
            />
            <Textarea
              id="journal-content"
              placeholder="What's on your mind? Write freely — no structure needed…"
              className="mt-2 flex-1 max-h-[40vh] resize-none border-0 px-5 shadow-none focus-visible:ring-0 lg:min-h-0 radius-none"
              {...register("content")}
            />
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
