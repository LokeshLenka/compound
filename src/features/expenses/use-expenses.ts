"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  debtsKeys,
  expenseKeys,
  fetchBudgets,
  fetchCategories,
  fetchDebts,
  fetchTransactions,
} from "@/lib/supabase/fetchers"
import type {
  DebtFormValues,
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

export function useDebts() {
  return useQuery({
    queryKey: debtsKeys.all,
    queryFn: () => fetchDebts(getSupabaseBrowserClient()),
  })
}

async function syncDebtSettlement(
  sb: ReturnType<typeof getSupabaseBrowserClient>,
  debtId: string,
  debt: { amount: number; type: "debt" | "owe"; person_name: string; note: string | null; status: string; settlement_transaction_id: string | null }
) {
  const today = new Date().toISOString().slice(0, 10)
  if (debt.status === "paid") {
    const txnType = debt.type === "owe" ? "income" : "expense"
    const note = `Debt settlement: ${debt.person_name}${debt.note ? ` - ${debt.note}` : ""}`
    if (debt.settlement_transaction_id) {
      const { error } = await sb
        .from("expense_transactions")
        .update({ amount: debt.amount, type: txnType, note, date: today })
        .eq("id", debt.settlement_transaction_id)
      if (error) throw error
    } else {
      const { data: txn, error: insErr } = await sb
        .from("expense_transactions")
        .insert({ amount: debt.amount, type: txnType, note, date: today, category_id: null })
        .select("id")
        .single()
      if (insErr) throw insErr
      const { error: linkErr } = await sb.from("debts").update({ settlement_transaction_id: txn.id }).eq("id", debtId)
      if (linkErr) throw linkErr
    }
  } else {
    if (debt.settlement_transaction_id) {
      const { error: delErr } = await sb.from("expense_transactions").delete().eq("id", debt.settlement_transaction_id)
      if (delErr) throw delErr
      const { error: clearErr } = await sb.from("debts").update({ settlement_transaction_id: null }).eq("id", debtId)
      if (clearErr) throw clearErr
    }
  }
}

export function useSaveDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: DebtFormValues }) => {
      const sb = getSupabaseBrowserClient()
      const payload = {
        person_name: values.person_name,
        amount: values.amount,
        type: values.type,
        status: values.status,
        due_date: values.due_date || null,
        note: values.note || null,
      }
      if (id) {
        // fetch existing settlement before update
        const { data: existing, error: fetchErr } = await sb.from("debts").select("settlement_transaction_id, status, type").eq("id", id).single()
        if (fetchErr) throw fetchErr
        const { error } = await sb.from("debts").update(payload).eq("id", id)
        if (error) throw error
        // sync settlement after update
        const { data: updated, error: fetch2 } = await sb.from("debts").select("settlement_transaction_id, amount, type, person_name, note, status").eq("id", id).single()
        if (fetch2) throw fetch2
        await syncDebtSettlement(sb, id, updated as never)
        // if type changed while paid and settlement existed, sync already handled via update
        if (existing.settlement_transaction_id && existing.type !== values.type && values.status === "paid") {
          // type change already handled by sync update
        }
      } else {
        const { data: inserted, error } = await sb.from("debts").insert(payload).select("id").single()
        if (error) throw error
        if (values.status === "paid") {
          const { data: debtRow, error: fetchErr2 } = await sb.from("debts").select("settlement_transaction_id, amount, type, person_name, note, status").eq("id", inserted.id).single()
          if (fetchErr2) throw fetchErr2
          await syncDebtSettlement(sb, inserted.id, debtRow as never)
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: debtsKeys.all })
      qc.invalidateQueries({ queryKey: expenseKeys.transactions })
      toast.success("Debt saved — net synced")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient()
      const { data: debt, error: fetchErr } = await sb.from("debts").select("settlement_transaction_id").eq("id", id).single()
      if (fetchErr) throw fetchErr
      if (debt?.settlement_transaction_id) {
        const { error: delTxnErr } = await sb.from("expense_transactions").delete().eq("id", debt.settlement_transaction_id)
        if (delTxnErr) throw delTxnErr
      }
      const { error } = await sb.from("debts").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: debtsKeys.all })
      qc.invalidateQueries({ queryKey: expenseKeys.transactions })
      toast.success("Debt deleted — net synced")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useToggleDebtPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient()
      const { data: debt, error: fetchError } = await sb.from("debts").select("status, settlement_transaction_id, amount, type, person_name, note").eq("id", id).single()
      if (fetchError) throw fetchError
      const newStatus = debt.status === "paid" ? "pending" : "paid"
      const { error } = await sb.from("debts").update({ status: newStatus }).eq("id", id)
      if (error) throw error
      // sync settlement
      const updated = { ...debt, status: newStatus } as never
      await syncDebtSettlement(sb, id, updated)
      return newStatus
    },
    onSuccess: (newStatus) => {
      qc.invalidateQueries({ queryKey: debtsKeys.all })
      qc.invalidateQueries({ queryKey: expenseKeys.transactions })
      toast.success(newStatus === "paid" ? "Marked as paid — net updated" : "Marked as pending — net updated")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
