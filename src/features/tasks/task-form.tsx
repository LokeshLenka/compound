"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { taskSchema, splitTags, type TaskFormValues } from "@/lib/schemas"
import type { Project, Task } from "@/lib/types"
import { useCreateTask, useProjects, useUpdateTask } from "@/features/tasks/use-tasks"
import { PRIORITY_META } from "@/features/tasks/meta"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultStatus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  defaultStatus?: TaskFormValues["status"]
}) {
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const { data: projects } = useProjects()
  const isEdit = Boolean(task)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      notes: "",
      priority: "medium",
      status: "todo",
      due_date: null,
      project_id: null,
      tags: [],
    },
  })

  const [tagsInput, setTagsInput] = useState("")

  useEffect(() => {
    if (open) {
      reset(
        task
          ? {
              title: task.title,
              notes: task.notes ?? "",
              priority: task.priority,
              status: task.status,
              due_date: task.due_date ? task.due_date.slice(0, 10) : null,
              project_id: task.project_id,
              tags: task.tags,
            }
          : {
              title: "",
              notes: "",
              priority: "medium",
              status: defaultStatus ?? "todo",
              due_date: null,
              project_id: null,
              tags: [],
            },
      )
      setTagsInput(task?.tags?.join(", ") ?? "")
    }
  }, [open, task, reset, defaultStatus])

  const priority = watch("priority")
  const status = watch("status")
  const projectId = watch("project_id")

  async function onSubmit(values: TaskFormValues) {
    const tags = splitTags(tagsInput)
    const payload = {
      ...values,
      tags,
      due_date: values.due_date || null,
      project_id: values.project_id || null,
    }
    if (isEdit && task) {
      await updateTask.mutateAsync({ id: task.id, patch: payload as TaskFormValues })
    } else {
      await createTask.mutateAsync(payload)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="What needs doing?"
              autoFocus
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea id="task-notes" rows={2} placeholder="Optional details…" {...register("notes")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setValue("priority", v as TaskFormValues["priority"], { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_META).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isEdit && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setValue("status", v as TaskFormValues["status"], { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                {...register("due_date")}
              />
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={projectId ?? undefined}
                onValueChange={(v) => setValue("project_id", v || null, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p: Project) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-tags">Tags</Label>
            <Input
              id="task-tags"
              placeholder="work, home, urgent"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}