import { z } from "zod"

export const habitSchema = z.object({
  name: z.string().trim().min(1, "Give the habit a name").max(80),
  emoji: z.string().max(8).default("⭐"),
  color: z.string().default("slate"),
  frequency_type: z.enum(["daily", "weekdays", "weekly", "every_n_days"]),
  times: z.coerce.number().int().min(1).max(7).optional(),
  days: z.array(z.number().int().min(1).max(7)).default([]),
  every: z.coerce.number().int().min(1).max(30).optional(),
})

export type HabitFormValues = z.input<typeof habitSchema>

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200),
  notes: z.string().default(""),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["todo", "in_progress", "done", "archived"]).default("todo"),
  due_date: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
})

export type TaskFormValues = z.input<typeof taskSchema>

export const noteSchema = z.object({
  title: z.string().trim().max(140).default(""),
  content: z.string().default(""),
  tags: z.array(z.string()).default([]),
})

export type NoteFormValues = z.input<typeof noteSchema>

export const diarySchema = z.object({
  title: z.string().trim().max(140).default(""),
  content: z.string().default(""),
  mood: z.number().int().min(1).max(5).nullable().default(null),
  weather: z.string().trim().max(40).nullable().default(null),
  tags: z.array(z.string()).default([]),
})

export type DiaryFormValues = z.input<typeof diarySchema>

export const profileSchema = z.object({
  full_name: z.string().trim().max(80).default(""),
  theme: z.enum(["system", "light", "dark"]).default("system"),
})

export type ProfileFormValues = z.input<typeof profileSchema>

export const waterSettingsSchema = z.object({
  water_goal_ml: z.coerce.number().int().min(100, "Goal must be at least 100").max(10000, "Goal is capped at 10,000"),
  water_unit: z.enum(["ml", "oz"]),
  water_quick_amounts: z
    .array(z.coerce.number().int().min(50).max(2000))
    .length(3, "Exactly three quick-add sizes"),
})

export type WaterSettingsFormValues = z.input<typeof waterSettingsSchema>

/** Split "a, b c" into normalized tag strings. */
export function splitTags(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean)
}