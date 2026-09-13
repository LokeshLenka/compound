"use client"

import { useEffect, useMemo, useState } from "react"
import { PenLine, Save, Trash2 } from "lucide-react"
import { useDiaryEntries, useSaveDiaryEntry, useDeleteDiaryEntry } from "@/features/diary/use-diary"
import { DiaryCalendar } from "@/features/diary/diary-calendar"
import { DiaryBook } from "@/features/diary/diary-book"
import { MarkdownEditor } from "@/features/notes/markdown-editor"
import { MOODS, moodEmoji } from "@/features/diary/moods"
import { todayISO, humanDate } from "@/lib/dates"
import { splitTags } from "@/lib/schemas"
import type { DiaryEntry } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CreateFab } from "@/components/create-fab"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DiaryPage() {
  const { data: entries, isLoading } = useDiaryEntries()
  const saveEntry = useSaveDiaryEntry()
  const deleteEntry = useDeleteDiaryEntry()

  const [selectedDate, setSelectedDate] = useState(todayISO())
  const byDate = useMemo(
    () => new Map((entries ?? []).map((e) => [e.entry_date, e])),
    [entries],
  )
  const entry: DiaryEntry | undefined = byDate.get(selectedDate)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [mood, setMood] = useState<number | null>(null)
  const [weather, setWeather] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [dirty, setDirty] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */ // syncs editor to the selected day's entry
  useEffect(() => {
    setTitle(entry?.title ?? "")
    setContent(entry?.content ?? "")
    setMood(entry?.mood ?? null)
    setWeather(entry?.weather ?? "")
    setTagsInput(entry?.tags?.join(", ") ?? "")
    setDirty(false)
  }, [entry, selectedDate])
  /* eslint-enable react-hooks/set-state-in-effect */

  function noteDirty() {
    setDirty(true)
  }

  function focusEditor() {
    document.getElementById("diary-writer")?.scrollIntoView({ behavior: "smooth", block: "start" })
    document.getElementById("diary-title")?.focus()
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
    })
    setDirty(false)
  }

  // Book pages autosave on blur, but only when the draft actually changed.
  async function handleBookCommit() {
    const seed = byDate.get(selectedDate)
    if (!dirty && title === (seed?.title ?? "") && content === (seed?.content ?? "")) return
    await handleSave()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Diary"
        actions={
          <Button onClick={focusEditor} className="hidden gap-1.5 md:inline-flex">
            <PenLine className="size-4" /> Write entry
          </Button>
        }
      />

      <div className="hidden md:block">
        <DiaryBook
          entries={entries ?? []}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          editable
          title={title}
          content={content}
          onTitleChange={(v) => {
            setTitle(v)
            noteDirty()
          }}
          onContentChange={(v) => {
            setContent(v)
            noteDirty()
          }}
          onCommit={handleBookCommit}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
        <div className={`order-2 lg:order-1 ${isLoading ? "animate-pulse" : ""}`}>
          <DiaryCalendar
            entries={entries ?? []}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>

        <Card id="diary-writer" className="order-1 h-fit lg:order-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">
              {humanDate(selectedDate, "EEEE, MMMM d, yyyy")}
              {entry && (
                <span className="ml-2" aria-hidden>{moodEmoji(entry.mood)}</span>
              )}
            </CardTitle>
            {entry && dirty && (
              <span className="text-xs text-muted-foreground">Unsaved changes</span>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    setMood(mood === m.value ? null : m.value)
                    noteDirty()
                  }}
                  title={m.label}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-full border px-3 py-1.5 text-lg transition",
                    mood === m.value
                      ? "border-primary bg-accent"
                      : "border-transparent hover:bg-accent/60",
                  )}
                >
                  <span aria-hidden>{m.emoji}</span>
                  <span className="text-[9px] text-muted-foreground">{m.label}</span>
                </button>
              ))}
            </div>

            <Input
              id="diary-title"
              placeholder="A short title for today…"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                noteDirty()
              }}
            />

            <MarkdownEditor content={content} onChange={(md) => { setContent(md); noteDirty() }} placeholder="Write your day… " />

            <div className="flex flex-wrap gap-4">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="diary-weather" className="text-xs">
                  Weather
                </Label>
                <Input
                  id="diary-weather"
                  placeholder="e.g. sunny, 21°"
                  value={weather}
                  onChange={(e) => {
                    setWeather(e.target.value)
                    noteDirty()
                  }}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="diary-tags" className="text-xs">
                  Tags
                </Label>
                <Input
                  id="diary-tags"
                  placeholder="work, hike, food"
                  value={tagsInput}
                  onChange={(e) => {
                    setTagsInput(e.target.value)
                    noteDirty()
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saveEntry.isPending}>
                <Save className="mr-1 size-4" /> Save day
              </Button>
              {entry && (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    void deleteEntry.mutate(entry.id)
                  }}
                >
                  <Trash2 className="mr-1 size-4" /> Delete entry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateFab
        label="Write today's entry"
        onClick={focusEditor}
      />
    </div>
  )
}