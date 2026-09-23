import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { fetchTasks, tasksKeys } from "@/lib/supabase/fetchers"
import TasksClient from "./tasks-client"

export default async function Page() {
  const supabase = await getSupabaseServerClient()
  const qc = getQueryClient()
  await qc.prefetchQuery({ queryKey: tasksKeys.all, queryFn: () => fetchTasks(supabase) })
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <TasksClient />
    </HydrationBoundary>
  )
}
