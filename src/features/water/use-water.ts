"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { waterKeys, fetchWaterLogs, fetchWaterSettings } from "@/lib/supabase/fetchers"
import type { Profile, WaterLog } from "@/lib/types"
import type { WaterSettingsFormValues } from "@/lib/schemas"

export { waterKeys }

export function useWaterLogs() {
  return useQuery({
    queryKey: waterKeys.logs,
    queryFn: () => fetchWaterLogs(getSupabaseBrowserClient()),
  })
}

export function useAddWater() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      amount_ml,
      note,
    }: {
      amount_ml: number
      note?: string
    }) => {
      const sb = getSupabaseBrowserClient()
      const { data, error } = await sb
        .from("water_intake_logs")
        .insert({
          amount_ml,
          note: note?.trim() || null,
          drank_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return data as WaterLog
    },
    onMutate: ({ amount_ml, note }) => {
      const previous = qc.getQueryData<WaterLog[]>(waterKeys.logs)
      qc.setQueryData<WaterLog[]>(waterKeys.logs, (old = []) => [
        {
          id: `optimistic-${Date.now()}`,
          user_id: "",
          amount_ml,
          drank_at: new Date().toISOString(),
          note: note?.trim() || null,
          created_at: new Date().toISOString(),
        },
        ...old,
      ])
      return { previous }
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(waterKeys.logs, ctx.previous)
      toast.error(e.message)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: waterKeys.logs }),
  })
}

export function useUpdateWater() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, amount_ml }: { id: string; amount_ml: number }) => {
      const { data, error } = await getSupabaseBrowserClient()
        .from("water_intake_logs")
        .update({ amount_ml })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data as WaterLog
    },
    onMutate: ({ id, amount_ml }) => {
      const previous = qc.getQueryData<WaterLog[]>(waterKeys.logs)
      qc.setQueryData<WaterLog[]>(waterKeys.logs, (old = []) =>
        old.map((l) => (l.id === id ? { ...l, amount_ml } : l)),
      )
      return { previous }
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(waterKeys.logs, ctx.previous)
      toast.error(e.message)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: waterKeys.logs }),
  })
}

export function useDeleteWater() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabaseBrowserClient()
        .from("water_intake_logs")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onMutate: (id) => {
      const previous = qc.getQueryData<WaterLog[]>(waterKeys.logs)
      qc.setQueryData<WaterLog[]>(waterKeys.logs, (old = []) =>
        old.filter((l) => l.id !== id),
      )
      return { previous }
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(waterKeys.logs, ctx.previous)
      toast.error(e.message)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: waterKeys.logs }),
  })
}

export function useWaterSettings() {
  return useQuery({
    queryKey: waterKeys.profile,
    queryFn: () => fetchWaterSettings(getSupabaseBrowserClient()),
  })
}

export function useUpdateWaterSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: WaterSettingsFormValues) => {
      const sb = getSupabaseBrowserClient()
      const userId = (await sb.auth.getUser()).data.user!.id
      const { error } = await sb
        .from("profiles")
        .update({
          water_goal_ml: values.water_goal_ml,
          water_unit: values.water_unit,
          water_quick_amounts: values.water_quick_amounts,
        })
        .eq("id", userId)
      if (error) throw error
      return values
    },
    onSuccess: (v) => {
      qc.setQueryData(waterKeys.profile, {
        water_goal_ml: v.water_goal_ml,
        water_unit: v.water_unit,
        water_quick_amounts: v.water_quick_amounts,
      })
      toast.success("Water settings saved")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}