"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { noteSchema, splitTags, type NoteFormValues } from "@/lib/schemas"
import type { Note } from "@/lib/types"
import { useSaveNote, useDeleteNote } from "@/features/notes/use-notes"
import { MarkdownEditor } from "@/features/notes/markdown-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function NoteFormDialog({
  open,
  onOpenChange,
  note,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  note?: Note | null
}) {
  const saveNote = useSaveNote()
  const deleteNote = useDeleteNote()
  const isEdit = Boolean(note)

  const { register, reset, handleSubmit, formState } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", content: "", tags: [] },
  })

  const [content, setContent] = useState("")
  const [tagsInput, setTagsInput] = useState("")

  /* eslint-disable react-hooks/set-state-in-effect */ // syncs form + editor to the opened note
  useEffect(() => {
    if (open) {
      reset({
        title: note?.title ?? "",
        content: note?.content ?? "",
        tags: note?.tags ?? [],
      })
      setContent(note?.content ?? "")
      setTagsInput(note?.tags?.join(", ") ?? "")
    }
  }, [open, note, reset])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function onSubmit(values: NoteFormValues) {
    await saveNote.mutateAsync({
      id: note?.id,
      values: { ...values, content, tags: splitTags(tagsInput || "") },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit note" : "New note"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input
            id="note-title"
            placeholder="Title"
            className="text-lg font-semibold"
            autoFocus
            {...register("title")}
          />
          <MarkdownEditor
            key={note?.id ?? "new"}
            content={note?.content ?? ""}
            onChange={setContent}
            placeholder="Write in markdown… "
          />
          <div className="space-y-2">
            <Label htmlFor="note-tags">Tags</Label>
            <Input
              id="note-tags"
              placeholder="ideas, work, journal"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            {isEdit && note && (
              <Button
                type="button"
                variant="destructive"
                className="mr-auto"
                onClick={() => {
                  void deleteNote.mutate(note.id)
                  onOpenChange(false)
                }}
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={formState.isSubmitting || saveNote.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}