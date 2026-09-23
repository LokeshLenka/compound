import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import {
  fetchHabits,
  fetchHabitLogs,
  habitsKeys,
  fetchTasks,
  tasksKeys,
  fetchNotes,
  notesKeys,
  fetchDiaryEntries,
  diaryKeys,
  fetchJournalEntries,
  journalKeys,
  fetchTransactions,
  fetchCategories,
  expenseKeys,
  fetchWaterLogs,
  fetchWaterSettings,
  waterKeys,
} from "@/lib/supabase/fetchers"
import DashboardClient from "./dashboard-client"

export default async function Page() {
  const supabase = await getSupabaseServerClient()
  const qc = getQueryClient()
  await Promise.all([
    qc.prefetchQuery({ queryKey: habitsKeys.all, queryFn: () => fetchHabits(supabase) }),
    qc.prefetchQuery({ queryKey: habitsKeys.logs, queryFn: () => fetchHabitLogs(supabase) }),
    qc.prefetchQuery({ queryKey: tasksKeys.all, queryFn: () => fetchTasks(supabase) }),
    qc.prefetchQuery({ queryKey: notesKeys.all, queryFn: () => fetchNotes(supabase) }),
    qc.prefetchQuery({ queryKey: diaryKeys.all, queryFn: () => fetchDiaryEntries(supabase) }),
    qc.prefetchQuery({ queryKey: journalKeys.all, queryFn: () => fetchJournalEntries(supabase) }),
    qc.prefetchQuery({ queryKey: expenseKeys.transactions, queryFn: () => fetchTransactions(supabase) }),
    qc.prefetchQuery({ queryKey: expenseKeys.categories, queryFn: () => fetchCategories(supabase) }),
    qc.prefetchQuery({ queryKey: waterKeys.logs, queryFn: () => fetchWaterLogs(supabase) }),
    qc.prefetchQuery({ queryKey: waterKeys.profile, queryFn: () => fetchWaterSettings(supabase) }),
  ])
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <DashboardClient />
    </HydrationBoundary>
  )
}
