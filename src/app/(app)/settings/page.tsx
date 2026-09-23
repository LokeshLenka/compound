import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { fetchProfile, profileKeys } from "@/lib/supabase/fetchers"
import SettingsClient from "./settings-client"

export default async function Page() {
  const supabase = await getSupabaseServerClient()
  const qc = getQueryClient()
  await qc.prefetchQuery({ queryKey: profileKeys.all, queryFn: () => fetchProfile(supabase) })
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <SettingsClient />
    </HydrationBoundary>
  )
}
