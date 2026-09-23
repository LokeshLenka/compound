import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { fetchJournalEntries, journalKeys } from "@/lib/supabase/fetchers"
import JournalClient from "./journal-client"

export default async function Page() {
  const supabase = await getSupabaseServerClient()
  const qc = getQueryClient()
  await qc.prefetchQuery({ queryKey: journalKeys.all, queryFn: () => fetchJournalEntries(supabase) })
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <JournalClient />
    </HydrationBoundary>
  )
}
