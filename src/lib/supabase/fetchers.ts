import type { SupabaseClient } from "@supabase/supabase-js"
import { subDays } from "date-fns"
import type {
  Debt,
  DiaryEntry,
  ExpenseBudget,
  ExpenseCategory,
  ExpenseTransaction,
  Habit,
  HabitLog,
  JournalEntry,
  Note,
  Profile,
  Task,
  WaterLog,
} from "@/lib/types"

// ── query keys (shared between server prefetch and client hooks) ──
export const habitsKeys = {
  all: ["habits"] as const,
  logs: ["habit_logs"] as const,
}
export const tasksKeys = {
  all: ["tasks"] as const,
}
export const notesKeys = {
  all: ["notes"] as const,
}
export const diaryKeys = {
  all: ["diary_entries"] as const,
}
export const journalKeys = {
  all: ["journal_entries"] as const,
}
export const expenseKeys = {
  transactions: ["expense_transactions"] as const,
  categories: ["expense_categories"] as const,
  budgets: ["expense_budgets"] as const,
}
export const debtsKeys = {
  all: ["debts"] as const,
}
export const waterKeys = {
  logs: ["water_logs"] as const,
  profile: ["profile"] as const,
}
export const profileKeys = {
  all: ["profile"] as const,
}

// ── fetchers — pure async functions that take a supabase client ──
export async function fetchHabits(supabase: SupabaseClient): Promise<Habit[]> {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("archived", false)
    .order("sort_order")
    .order("created_at")
  if (error) throw error
  return (data ?? []) as Habit[]
}

export async function fetchHabitLogs(supabase: SupabaseClient): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .order("log_date", { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as HabitLog[]
}

export async function fetchTasks(supabase: SupabaseClient): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("sort_order")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Task[]
}

export async function fetchNotes(supabase: SupabaseClient): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("archived", false)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Note[]
}

export async function fetchDiaryEntries(supabase: SupabaseClient): Promise<DiaryEntry[]> {
  const yearAgo = new Date()
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)
  const { data, error } = await supabase
    .from("diary_entries")
    .select("*")
    .gte("entry_date", yearAgo.toISOString().slice(0, 10))
    .order("entry_date", { ascending: false })
    .limit(800)
  if (error) throw error
  return (data ?? []) as DiaryEntry[]
}

export async function fetchJournalEntries(supabase: SupabaseClient): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as JournalEntry[]
}

export async function fetchTransactions(supabase: SupabaseClient): Promise<ExpenseTransaction[]> {
  const { data, error } = await supabase
    .from("expense_transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as ExpenseTransaction[]
}

export async function fetchCategories(supabase: SupabaseClient): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .order("name", { ascending: true })
  if (error) throw error
  return (data ?? []) as ExpenseCategory[]
}

export async function fetchBudgets(supabase: SupabaseClient): Promise<ExpenseBudget[]> {
  const { data, error } = await supabase
    .from("expense_budgets")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as ExpenseBudget[]
}

export async function fetchDebts(supabase: SupabaseClient): Promise<Debt[]> {
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Debt[]
}

export async function fetchWaterLogs(supabase: SupabaseClient): Promise<WaterLog[]> {
  const from = subDays(new Date(), 60).toISOString()
  const { data, error } = await supabase
    .from("water_intake_logs")
    .select("*")
    .gte("drank_at", from)
    .order("drank_at", { ascending: false })
    .limit(300)
  if (error) throw error
  return (data ?? []) as WaterLog[]
}

export async function fetchWaterSettings(
  supabase: SupabaseClient,
): Promise<Pick<Profile, "water_goal_ml" | "water_unit" | "water_quick_amounts"> | null> {
  const { data } = await supabase
    .from("profiles")
    .select("water_goal_ml, water_unit, water_quick_amounts")
    .single()
  return (data ?? null) as Pick<
    Profile,
    "water_goal_ml" | "water_unit" | "water_quick_amounts"
  > | null
}

export async function fetchProfile(supabase: SupabaseClient): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").single()
  return (data ?? null) as Profile | null
}
