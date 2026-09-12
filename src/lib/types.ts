export type FrequencyType = "daily" | "weekdays" | "weekly" | "every_n_days"

export interface Habit {
  id: string
  user_id: string
  name: string
  emoji: string
  color: string
  frequency_type: FrequencyType
  frequency_value: {
    times?: number
    days?: number[]
    every?: number
  }
  archived: boolean
  archived_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  log_date: string
  note: string | null
  created_at: string
}

export type TaskStatus = "todo" | "in_progress" | "done" | "archived"
export type TaskPriority = "low" | "medium" | "high" | "urgent"

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  title: string
  notes: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  tags: string[]
  completed_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  is_pinned: boolean
  archived: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export type Mood = 1 | 2 | 3 | 4 | 5

export interface DiaryEntry {
  id: string
  user_id: string
  entry_date: string
  title: string | null
  content: string
  mood: number | null
  weather: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  theme: string
  water_goal_ml: number
  water_unit: "ml" | "oz"
  water_quick_amounts: number[]
  created_at: string
  updated_at: string
}

export type WaterUnit = "ml" | "oz"

/** Daily hydration target expressed in the user's display unit. */
export interface WaterGoal {
  amount: number
  unit: WaterUnit
}

export interface WaterLog {
  id: string
  user_id: string
  amount_ml: number
  drank_at: string
  note: string | null
  created_at: string
}

export interface TagCount {
  tag: string
  count: number
}