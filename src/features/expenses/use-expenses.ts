"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  expenseKeys,
  fetchBudgets,
  fetchCategories,
  fetchTransactions,
} from "@/lib/supabase/fetchers"
import type {
  ExpenseCategoryFormValues,
  ExpenseTransactionFormValues,
  ExpenseBudgetFormValues,
} from "@/lib/schemas"

export { expenseKeys }

export function useTransactions() {
  return useQuery({
    queryKey: expenseKeys.transactions,
    queryFn: () => fetchTransactions(getSupabaseBrowserClient()),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: expenseKeys.categories,
    queryFn: () => fetchCategories(getSupabaseBrowserClient()),
  })
}

export function useBudgets() {
  return useQuery({
    queryKey: expenseKeys.budgets,
    queryFn: () => fetchBudgets(getSupabaseBrowserClient()),
  })
}

export function useSaveTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string
      values: ExpenseTransactionFormValues
    }) => {
      const sb = getSupabaseBrowserClient()
      const payload = {
        amount: values.amount,
        type: values.type,
        category_id: values.category_id || null,
        date: values.date,
        note: values.note || null,
        recurring_interval: values.recurring_interval || null,
      }
      if (id) {
        const { error } = await sb.from("expense_transactions").update(payload).eq("id", id)
        if (error) throw error
      } else {
        const { error } = await sb.from("expense_transactions").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.transactions })
      toast.success("Transaction saved")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from("expense_transactions").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.transactions })
      toast.success("Transaction deleted")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useSaveCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string
      values: ExpenseCategoryFormValues
    }) => {
      const sb = getSupabaseBrowserClient()
      const payload = {
        name: values.name,
        type: values.type,
        icon: values.icon,
        color: values.color,
      }
      if (id) {
        const { error } = await sb.from("expense_categories").update(payload).eq("id", id)
        if (error) throw error
      } else {
        const { error } = await sb.from("expense_categories").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.categories })
      toast.success("Category saved")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from("expense_categories").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.categories })
      toast.success("Category deleted")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useSaveBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string
      values: ExpenseBudgetFormValues
    }) => {
      const sb = getSupabaseBrowserClient()
      const payload = {
        category_id: values.category_id,
        amount: values.amount,
        period: values.period,
      }
      if (id) {
        const { error } = await sb.from("expense_budgets").update(payload).eq("id", id)
        if (error) throw error
      } else {
        const { error } = await sb.from("expense_budgets").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.budgets })
      toast.success("Budget saved")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from("expense_budgets").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.budgets })
      toast.success("Budget deleted")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
