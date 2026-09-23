import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { fetchWaterLogs, fetchWaterSettings, waterKeys } from "@/lib/supabase/fetchers"
import WaterStatsPage from "@/features/water/water-stats-page"

export default async function Page() {
  const supabase = await getSupabaseServerClient()
  const qc = getQueryClient()
  await Promise.all([
    qc.prefetchQuery({ queryKey: waterKeys.logs, queryFn: () => fetchWaterLogs(supabase) }),
    qc.prefetchQuery({ queryKey: waterKeys.profile, queryFn: () => fetchWaterSettings(supabase) }),
  ])
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <WaterStatsPage />
    </HydrationBoundary>
  )
}
