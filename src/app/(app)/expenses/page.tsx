import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/get-query-client"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import {
  fetchTransactions,
  fetchCategories,
  fetchBudgets,
  expenseKeys,
} from "@/lib/supabase/fetchers"
import ExpensesClient from "./expenses-client"

export default async function Page() {
  const supabase = await getSupabaseServerClient()
  const qc = getQueryClient()
  await Promise.all([
    qc.prefetchQuery({ queryKey: expenseKeys.transactions, queryFn: () => fetchTransactions(supabase) }),
    qc.prefetchQuery({ queryKey: expenseKeys.categories, queryFn: () => fetchCategories(supabase) }),
    qc.prefetchQuery({ queryKey: expenseKeys.budgets, queryFn: () => fetchBudgets(supabase) }),
  ])
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ExpensesClient />
    </HydrationBoundary>
  )
}
