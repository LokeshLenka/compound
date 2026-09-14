"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type {
  ExpenseCategory,
  ExpenseTransaction,
  ExpenseBudget,
} from "@/lib/types"
import type {
  ExpenseCategoryFormValues,
  ExpenseTransactionFormValues,
  ExpenseBudgetFormValues,
} from "@/lib/schemas"

export const expenseKeys = {
  transactions: ["expense_transactions"] as const,
  categories: ["expense_categories"] as const,
  budgets: ["expense_budgets"] as const,
}

export function useTransactions() {
  return useQuery({
    queryKey: expenseKeys.transactions,
    queryFn: async () => {
      const sb = getSupabaseBrowserClient()
      const { data, error } = await sb
        .from("expense_transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(500)
      if (error) throw error
      return (data ?? []) as ExpenseTransaction[]
    },
  })
}

export function useCategories() {
  return useQuery({
    queryKey: expenseKeys.categories,
    queryFn: async () => {
      const sb = getSupabaseBrowserClient()
      const { data, error } = await sb
        .from("expense_categories")
        .select("*")
        .order("name", { ascending: true })
      if (error) throw error
      return (data ?? []) as ExpenseCategory[]
    },
  })
}

export function useBudgets() {
  return useQuery({
    queryKey: expenseKeys.budgets,
    queryFn: async () => {
      const sb = getSupabaseBrowserClient()
      const { data, error } = await sb
        .from("expense_budgets")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as ExpenseBudget[]
    },
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
