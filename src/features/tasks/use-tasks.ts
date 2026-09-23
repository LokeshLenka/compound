"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { tasksKeys, fetchTasks } from "@/lib/supabase/fetchers"
import type { Task, TaskStatus } from "@/lib/types"
import type { TaskFormValues } from "@/lib/schemas"

export { tasksKeys }

export function useTasks() {
  return useQuery({
    queryKey: tasksKeys.all,
    queryFn: () => fetchTasks(getSupabaseBrowserClient()),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: TaskFormValues & { due_date: string | null }) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from("tasks").insert({
        title: values.title,
        notes: values.notes || null,
        priority: values.priority,
        status: values.status,
        due_date: values.due_date,
        tags: values.tags,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKeys.all })
      toast.success("Task created")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<Pick<TaskFormValues, "title" | "notes" | "priority" | "status">> &
        Partial<Pick<Task, "due_date" | "tags" | "title">>
    }) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from("tasks").update(patch).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKeys.all })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

/** Optimistic status change (e.g. mark done / move columns). */
export function useSetTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb
        .from("tasks")
        .update({
          status,
          completed_at: status === "done" ? new Date().toISOString() : null,
        })
        .eq("id", id)
      if (error) throw error
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: tasksKeys.all })
      const previous = qc.getQueryData<Task[]>(tasksKeys.all)
      qc.setQueryData<Task[]>(tasksKeys.all, (old = []) =>
        old.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                completed_at:
                  status === "done" ? new Date().toISOString() : null,
              }
            : t,
        ),
      )
      return { previous }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(tasksKeys.all, ctx.previous)
      toast.error("Couldn't update task")
    },
    onSettled: () => qc.invalidateQueries({ queryKey: tasksKeys.all }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from("tasks").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKeys.all })
      toast.success("Task deleted")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
