"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { DiaryEntry } from "@/lib/types"
import type { DiaryFormValues } from "@/lib/schemas"

export const diaryKeys = {
  all: ["diary_entries"] as const,
}

export function useDiaryEntries() {
  return useQuery({
    queryKey: diaryKeys.all,
    queryFn: async () => {
      const sb = getSupabaseBrowserClient()
      const yearAgo = new Date()
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      const { data, error } = await sb
        .from("diary_entries")
        .select("*")
        .gte("entry_date", yearAgo.toISOString().slice(0, 10))
        .order("entry_date", { ascending: false })
        .limit(800)
      if (error) throw error
      return (data ?? []) as DiaryEntry[]
    },
  })
}

export function useSaveDiaryEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      entry_date,
      values,
    }: {
      entry_date: string
      values: DiaryFormValues
    }) => {
      const sb = getSupabaseBrowserClient()
      const { data: existing } = await sb
        .from("diary_entries")
        .select("id")
        .eq("entry_date", entry_date)
        .maybeSingle()

      const payload = {
        entry_date,
        title: values.title || null,
        content: values.content,
        mood: values.mood,
        weather: values.weather,
        tags: values.tags,
      }

      if (existing) {
        const { error } = await sb
          .from("diary_entries")
          .update(payload)
          .eq("id", existing.id)
        if (error) throw error
      } else {
        const { error } = await sb.from("diary_entries").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: diaryKeys.all })
      toast.success("Diary saved")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteDiaryEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from("diary_entries").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: diaryKeys.all })
      toast.success("Entry deleted")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}