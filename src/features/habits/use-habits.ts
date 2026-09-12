"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Habit, HabitLog } from "@/lib/types"
import type { HabitFormValues } from "@/lib/schemas"

export const habitsKeys = {
  all: ["habits"] as const,
  logs: ["habit_logs"] as const,
}

export function useHabits() {
  return useQuery({
    queryKey: habitsKeys.all,
    queryFn: async () => {
      const sb = getSupabaseBrowserClient()
      const { data, error } = await sb
        .from("habits")
        .select("*")
        .eq("archived", false)
        .order("sort_order")
        .order("created_at")
      if (error) throw error
      return (data ?? []) as Habit[]
    },
  })
}

export function useHabitLogs() {
  return useQuery({
    queryKey: habitsKeys.logs,
    queryFn: async () => {
      const sb = getSupabaseBrowserClient()
      const { data, error } = await sb
        .from("habit_logs")
        .select("*")
        .order("log_date", { ascending: false })
        .limit(500)
      if (error) throw error
      return (data ?? []) as HabitLog[]
    },
  })
}

function toHabitDb(values: HabitFormValues) {
  return {
    name: values.name,
    emoji: values.emoji || "⭐",
    color: values.color,
    frequency_type: values.frequency_type,
    frequency_value:
      values.frequency_type === "weekly"
        ? { times: values.times ?? 3 }
        : values.frequency_type === "weekdays"
          ? { days: values.days }
          : values.frequency_type === "every_n_days"
            ? { every: values.every ?? 2 }
            : {},
  }
}

export function useCreateHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: HabitFormValues) => {
      const sb = getSupabaseBrowserClient()
      const existing = qc.getQueryData<Habit[]>(habitsKeys.all) ?? []
      const { error } = await sb
        .from("habits")
        .insert({ ...toHabitDb(values), sort_order: existing.length })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: habitsKeys.all })
      toast.success("Habit created")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: HabitFormValues
    }) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb
        .from("habits")
        .update(toHabitDb(values))
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: habitsKeys.all })
      toast.success("Habit updated")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from("habits").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: habitsKeys.all })
      qc.invalidateQueries({ queryKey: habitsKeys.logs })
      toast.success("Habit archived")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

/** Persist a new drag-and-drop order: reindexes sort_order 0..n-1 for every row. */
export function useMoveHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids }: { ids: string[] }) => {
      const sb = getSupabaseBrowserClient()
      const previous = qc.getQueryData<Habit[]>(habitsKeys.all) ?? []
      const byId = new Map(previous.map((h) => [h.id, h]))
      const next = ids
        .map((id) => byId.get(id))
        .filter((h): h is Habit => Boolean(h))
        .map((h, i) => ({ ...h, sort_order: i }))
      if (next.length === 0) return
      await qc.cancelQueries({ queryKey: habitsKeys.all })
      qc.setQueryData(habitsKeys.all, next)
      try {
        await Promise.all(
          next.map((h) =>
            sb.from("habits").update({ sort_order: h.sort_order }).eq("id", h.id),
          ),
        )
      } catch (e) {
        qc.setQueryData(habitsKeys.all, previous)
        throw e
      }
    },
    onError: () => toast.error("Couldn't reorder habits"),
    onSettled: () => qc.invalidateQueries({ queryKey: habitsKeys.all }),
  })
}

/** Toggle a day's log with optimistic cache update. */
export function useToggleLog() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      habit_id,
      log_date,
    }: {
      habit_id: string
      log_date: string
    }) => {
      const sb = getSupabaseBrowserClient()
      const existing = await sb
        .from("habit_logs")
        .select("id")
        .eq("habit_id", habit_id)
        .eq("log_date", log_date)
        .maybeSingle()

      if (existing.data) {
        const { error } = await sb
          .from("habit_logs")
          .delete()
          .eq("id", existing.data.id)
        if (error) throw error
        return "deleted"
      }

      const { error } = await sb.from("habit_logs").insert({ habit_id, log_date })
      if (error) throw error
      return "inserted"
    },
    onMutate: async ({ habit_id, log_date }) => {
      await qc.cancelQueries({ queryKey: habitsKeys.logs })
      const previous = qc.getQueryData<HabitLog[]>(habitsKeys.logs)
      qc.setQueryData<HabitLog[]>(habitsKeys.logs, (old = []) => {
        const exists = old.some(
          (l) => l.habit_id === habit_id && l.log_date === log_date,
        )
        if (exists) return old.filter((l) => !(l.habit_id === habit_id && l.log_date === log_date))
        return [
          {
            id: `optimistic-${habit_id}-${log_date}`,
            habit_id,
            user_id: "",
            log_date,
            note: null,
            created_at: new Date().toISOString(),
          },
          ...old,
        ]
      })
      return { previous }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(habitsKeys.logs, ctx.previous)
      toast.error("Couldn't update check-in")
    },
    onSettled: () => qc.invalidateQueries({ queryKey: habitsKeys.logs }),
  })
}