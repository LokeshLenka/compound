import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { fetchNotes, notesKeys } from "@/lib/supabase/fetchers"
import NotesClient from "./notes-client"

export default async function Page() {
  const supabase = await getSupabaseServerClient()
  const qc = getQueryClient()
  await qc.prefetchQuery({ queryKey: notesKeys.all, queryFn: () => fetchNotes(supabase) })
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <NotesClient />
    </HydrationBoundary>
  )
}
