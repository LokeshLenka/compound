import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { fetchHabits, fetchHabitLogs, habitsKeys } from "@/lib/supabase/fetchers"
import HabitsStatsClient from "./habits-stats-client"

export default async function Page() {
  const supabase = await getSupabaseServerClient()
  const qc = getQueryClient()
  await Promise.all([
    qc.prefetchQuery({ queryKey: habitsKeys.all, queryFn: () => fetchHabits(supabase) }),
    qc.prefetchQuery({ queryKey: habitsKeys.logs, queryFn: () => fetchHabitLogs(supabase) }),
  ])
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <HabitsStatsClient />
    </HydrationBoundary>
  )
}
