"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { JournalEntry } from "@/lib/types"
import type { JournalFormValues } from "@/lib/schemas"

export const journalKeys = {
  all: ["journal_entries"] as const,
}

export function useJournalEntries() {
  return useQuery({
    queryKey: journalKeys.all,
    queryFn: async () => {
      const sb = getSupabaseBrowserClient()
      const { data, error } = await sb
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500)
      if (error) throw error
      return (data ?? []) as JournalEntry[]
    },
  })
}

export function useSaveJournalEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string
      values: JournalFormValues
    }) => {
      const sb = getSupabaseBrowserClient()
      const payload = {
        title: values.title || "",
        content: values.content,
        mood: values.mood,
        tags: values.tags,
        category: values.category || null,
      }
      if (id) {
        const { error } = await sb.from("journal_entries").update(payload).eq("id", id)
        if (error) throw error
      } else {
        const { error } = await sb.from("journal_entries").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: journalKeys.all })
      toast.success("Journal entry saved")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from("journal_entries").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: journalKeys.all })
      toast.success("Entry deleted")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
