import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { fetchDiaryEntries, diaryKeys } from "@/lib/supabase/fetchers"
import DiaryClient from "./diary-client"

export default async function Page() {
  const supabase = await getSupabaseServerClient()
  const qc = getQueryClient()
  await qc.prefetchQuery({ queryKey: diaryKeys.all, queryFn: () => fetchDiaryEntries(supabase) })
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <DiaryClient />
    </HydrationBoundary>
  )
}
