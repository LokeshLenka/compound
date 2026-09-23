"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { notesKeys, fetchNotes } from "@/lib/supabase/fetchers"
import type { Note } from "@/lib/types"
import type { NoteFormValues } from "@/lib/schemas"

export { notesKeys }

export function useNotes() {
  return useQuery({
    queryKey: notesKeys.all,
    queryFn: () => fetchNotes(getSupabaseBrowserClient()),
  })
}

export function useSaveNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string
      values: NoteFormValues
    }): Promise<string | undefined> => {
      const sb = getSupabaseBrowserClient()
      const payload = {
        title: values.title || "Untitled",
        content: values.content,
        tags: values.tags,
      }
      if (id) {
        const { error } = await sb.from("notes").update(payload).eq("id", id)
        if (error) throw error
        return id
      } else {
        const { data, error } = await sb.from("notes").insert(payload).select("id").single()
        if (error) throw error
        return data?.id
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: notesKeys.all })
      toast.success(v.id ? "Note updated" : "Note created")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from("notes").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notesKeys.all })
      toast.success("Note deleted")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useTogglePin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb
        .from("notes")
        .update({ is_pinned: pinned })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKeys.all }),
    onError: (e: Error) => toast.error(e.message),
  })
}