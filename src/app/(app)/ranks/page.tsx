import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchHabits, fetchHabitLogs, habitsKeys } from "@/lib/supabase/fetchers";
import { fetchTasks, tasksKeys } from "@/lib/supabase/fetchers";
import { fetchWaterLogs, waterKeys } from "@/lib/supabase/fetchers";
import { fetchTransactions, fetchDebts, expenseKeys, debtsKeys } from "@/lib/supabase/fetchers";
import { fetchDiaryEntries, diaryKeys } from "@/lib/supabase/fetchers";
import { fetchJournalEntries, journalKeys } from "@/lib/supabase/fetchers";
import RanksClient from "./ranks-client";

export default async function Page() {
  const supabase = await getSupabaseServerClient();
  const qc = getQueryClient();
  await Promise.all([
    qc.prefetchQuery({ queryKey: habitsKeys.all, queryFn: () => fetchHabits(supabase) }),
    qc.prefetchQuery({ queryKey: habitsKeys.logs, queryFn: () => fetchHabitLogs(supabase) }),
    qc.prefetchQuery({ queryKey: tasksKeys.all, queryFn: () => fetchTasks(supabase) }),
    qc.prefetchQuery({ queryKey: waterKeys.logs, queryFn: () => fetchWaterLogs(supabase) }),
    qc.prefetchQuery({ queryKey: expenseKeys.transactions, queryFn: () => fetchTransactions(supabase) }),
    qc.prefetchQuery({ queryKey: debtsKeys.all, queryFn: () => fetchDebts(supabase) }),
    qc.prefetchQuery({ queryKey: diaryKeys.all, queryFn: () => fetchDiaryEntries(supabase) }),
    qc.prefetchQuery({ queryKey: journalKeys.all, queryFn: () => fetchJournalEntries(supabase) }),
  ]);
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <RanksClient />
    </HydrationBoundary>
  );
}
