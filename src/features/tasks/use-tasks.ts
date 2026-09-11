"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Project, Task, TaskStatus } from "@/lib/types"
import type { TaskFormValues } from "@/lib/schemas"

export const tasksKeys = {
  all: ["tasks"] as const,
  projects: ["projects"] as const,
}

export function useTasks() {
  return useQuery({
    queryKey: tasksKeys.all,
    queryFn: async () => {
      const sb = getSupabaseBrowserClient()
      const { data, error } = await sb
        .from("tasks")
        .select("*")
        .order("sort_order")
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as Task[]
    },
  })
}

export function useProjects() {
  return useQuery({
    queryKey: tasksKeys.projects,
    queryFn: async () => {
      const sb = getSupabaseBrowserClient()
      const { data, error } = await sb.from("projects").select("*").order("name")
      if (error) throw error
      return (data ?? []) as Project[]
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      values: TaskFormValues & { due_date: string | null; project_id: string | null },
    ) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from("tasks").insert({
        title: values.title,
        notes: values.notes || null,
        priority: values.priority,
        status: values.status,
        due_date: values.due_date,
        project_id: values.project_id,
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
        Partial<Pick<Task, "due_date" | "project_id" | "tags" | "title">>
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

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from("projects").insert({ name })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKeys.projects }),
    onError: (e: Error) => toast.error(e.message),
  })
}