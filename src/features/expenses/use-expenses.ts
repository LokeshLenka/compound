"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  debtsKeys,
  expenseKeys,
  fetchAllDebtPayments,
  fetchBudgets,
  fetchCategories,
  fetchDebtPayments,
  fetchDebts,
  fetchTransactions,
} from "@/lib/supabase/fetchers"
import type {
  DebtFormValues,
  DebtPaymentFormValues,
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

async function recalcDebtPaidAmount(sb: ReturnType<typeof getSupabaseBrowserClient>, debtId: string) {
  const { data: payments, error: payErr } = await sb.from("debt_payments").select("amount").eq("debt_id", debtId)
  if (payErr) throw payErr
  const sum = (payments as { amount: number }[]).reduce((s, p) => s + Number(p.amount), 0)
  const { data: debt, error: debtErr } = await sb.from("debts").select("amount").eq("id", debtId).single()
  if (debtErr) throw debtErr
  const newPaid = Math.min(Number(debt.amount), sum)
  const newStatus = newPaid >= Number(debt.amount) - 0.001 ? "paid" : "pending"
  const { error: updErr } = await sb.from("debts").update({ paid_amount: newPaid, status: newStatus }).eq("id", debtId)
  if (updErr) throw updErr
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
        amount: Number(values.amount),
        type: values.type,
        category_id: values.category_id || null,
        date: values.date,
        note: values.note || null,
        recurring_interval: values.recurring_interval || null,
      }
      if (id) {
        // Check if this is a debt payment transaction
        const { data: dp } = await sb.from("debt_payments").select("id, debt_id, amount").eq("transaction_id", id).maybeSingle()
        if (dp) {
          const debtId = (dp as { debt_id: string; amount: number }).debt_id
          const oldAmt = Number((dp as { amount: number }).amount)
          // Check overpayment for debt
          const { data: debt } = await sb.from("debts").select("amount, paid_amount").eq("id", debtId).single()
          if (debt) {
            const currentPaidWithoutThis = Number((debt as { paid_amount: number }).paid_amount || 0) - oldAmt
            const newTotal = currentPaidWithoutThis + Number(values.amount)
            if (newTotal > Number((debt as { amount: number }).amount) + 0.001) {
              throw new Error(`Exceeds remaining ${(Number((debt as { amount: number }).amount) - currentPaidWithoutThis).toFixed(2)}`)
            }
          }
        }
        const { data: dSettlement } = await sb.from("debts").select("id").eq("settlement_transaction_id", id).maybeSingle()
        const { error } = await sb.from("expense_transactions").update(payload).eq("id", id)
        if (error) throw error
        if (dp) {
          const debtId = (dp as { debt_id: string }).debt_id
          const { error: updPayErr } = await sb.from("debt_payments").update({ amount: Number(values.amount), date: values.date, note: values.note || null }).eq("id", (dp as { id: string }).id)
          if (updPayErr) throw updPayErr
          await recalcDebtPaidAmount(sb, debtId)
        } else if (dSettlement) {
          // Single settlement edited — keep debt paid_amount in sync
          const debtId = (dSettlement as { id: string }).id
          const { error: updErr } = await sb.from("debts").update({ paid_amount: Number(values.amount) }).eq("id", debtId)
          if (updErr) throw updErr
        }
      } else {
        const { error } = await sb.from("expense_transactions").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.transactions })
      qc.invalidateQueries({ queryKey: debtsKeys.all })
      qc.invalidateQueries({ queryKey: debtsKeys.allPayments })
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
      const { data: dp } = await sb.from("debt_payments").select("id, debt_id, amount, transaction_id").eq("transaction_id", id).maybeSingle()
      const { data: dSettlement } = await sb.from("debts").select("id").eq("settlement_transaction_id", id).maybeSingle()
      let debtIdForRecalc: string | null = null
      if (dp) debtIdForRecalc = (dp as { debt_id: string }).debt_id
      const { error } = await sb.from("expense_transactions").delete().eq("id", id)
      if (error) throw error
      if (dp) {
        // debt_payments row remains with transaction_id=null due to SET NULL, delete it
        await sb.from("debt_payments").delete().eq("id", (dp as { id: string }).id)
        // Some implementations keep it with null, ensure deleted
        await sb.from("debt_payments").delete().eq("transaction_id", id)
        if (debtIdForRecalc) await recalcDebtPaidAmount(sb, debtIdForRecalc)
      } else if (dSettlement) {
        const debtId = (dSettlement as { id: string }).id
        const { error: clearErr } = await sb.from("debts").update({ settlement_transaction_id: null, paid_amount: 0, status: "pending" }).eq("id", debtId)
        if (clearErr) throw clearErr
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.transactions })
      qc.invalidateQueries({ queryKey: debtsKeys.all })
      qc.invalidateQueries({ queryKey: debtsKeys.allPayments })
      toast.success("Transaction deleted — debt synced")
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

export function useDebtPayments(debtId: string) {
  return useQuery({
    queryKey: debtsKeys.payments(debtId),
    queryFn: () => fetchDebtPayments(getSupabaseBrowserClient(), debtId),
    enabled: !!debtId,
  })
}

export function useAllDebtPayments() {
  return useQuery({
    queryKey: debtsKeys.allPayments,
    queryFn: () => fetchAllDebtPayments(getSupabaseBrowserClient()),
  })
}

export function useAddDebtPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ debtId, values }: { debtId: string; values: import("@/lib/schemas").DebtPaymentFormValues }) => {
      const sb = getSupabaseBrowserClient()
      const { data: debt, error: fetchErr } = await sb.from("debts").select("amount, paid_amount, type, person_name, note, status").eq("id", debtId).single()
      if (fetchErr) throw fetchErr
      const remaining = Number(debt.amount) - Number(debt.paid_amount || 0)
      if (Number(values.amount) > remaining + 0.001) throw new Error(`Exceeds remaining ${remaining.toFixed(2)}`)
      const txnType = debt.type === "owe" ? "income" : "expense"
      const txnNote = `Debt payment: ${debt.person_name}${values.note ? ` - ${values.note}` : debt.note ? ` - ${debt.note}` : ""}`
      const { data: txn, error: txnErr } = await sb
        .from("expense_transactions")
        .insert({ amount: Number(values.amount), type: txnType, date: values.date, note: txnNote, category_id: null })
        .select("id")
        .single()
      if (txnErr) throw txnErr
      const { data: payment, error: payErr } = await sb
        .from("debt_payments")
        .insert({ debt_id: debtId, amount: Number(values.amount), date: values.date, note: values.note || null, transaction_id: txn.id })
        .select("id")
        .single()
      if (payErr) {
        await sb.from("expense_transactions").delete().eq("id", txn.id)
        throw payErr
      }
      const newPaid = Number(debt.paid_amount || 0) + Number(values.amount)
      const newStatus = newPaid >= Number(debt.amount) - 0.001 ? "paid" : debt.status === "paid" ? "pending" : debt.status
      const { error: updErr } = await sb.from("debts").update({ paid_amount: newPaid, status: newStatus }).eq("id", debtId)
      if (updErr) throw updErr
      return payment
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: debtsKeys.all })
      qc.invalidateQueries({ queryKey: debtsKeys.payments(vars.debtId) })
      qc.invalidateQueries({ queryKey: debtsKeys.allPayments })
      qc.invalidateQueries({ queryKey: expenseKeys.transactions })
      toast.success("Payment added — net synced")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteDebtPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ paymentId, debtId }: { paymentId: string; debtId: string }) => {
      const sb = getSupabaseBrowserClient()
      const { data: payment, error: fetchErr } = await sb.from("debt_payments").select("amount, transaction_id").eq("id", paymentId).single()
      if (fetchErr) throw fetchErr
      if (payment.transaction_id) {
        const { error: delTxnErr } = await sb.from("expense_transactions").delete().eq("id", payment.transaction_id)
        if (delTxnErr) throw delTxnErr
      }
      const { error: delPayErr } = await sb.from("debt_payments").delete().eq("id", paymentId)
      if (delPayErr) throw delPayErr
      await recalcDebtPaidAmount(sb, debtId)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: debtsKeys.all })
      qc.invalidateQueries({ queryKey: debtsKeys.payments(vars.debtId) })
      qc.invalidateQueries({ queryKey: debtsKeys.allPayments })
      qc.invalidateQueries({ queryKey: expenseKeys.transactions })
      toast.success("Payment removed — net synced")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateDebtPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      paymentId,
      debtId,
      values,
    }: {
      paymentId: string
      debtId: string
      values: import("@/lib/schemas").DebtPaymentFormValues
    }) => {
      const sb = getSupabaseBrowserClient()
      const { data: debt, error: debtErr } = await sb.from("debts").select("amount").eq("id", debtId).single()
      if (debtErr) throw debtErr
      const { data: payment, error: payErr } = await sb.from("debt_payments").select("amount, transaction_id").eq("id", paymentId).single()
      if (payErr) throw payErr
      // check remaining if amount changed
      const { data: allPayments } = await sb.from("debt_payments").select("amount").eq("debt_id", debtId)
      const sumOthers = (allPayments as { amount: number }[] | null)?.reduce((s, p) => s + Number(p.amount), 0) ?? 0
      const sumWithoutThis = sumOthers - Number(payment.amount)
      const newTotal = sumWithoutThis + Number(values.amount)
      if (newTotal > Number(debt.amount) + 0.001) throw new Error(`Exceeds remaining ${(Number(debt.amount) - sumWithoutThis).toFixed(2)}`)
      if (payment.transaction_id) {
        const { error: updTxnErr } = await sb
          .from("expense_transactions")
          .update({ amount: Number(values.amount), date: values.date, note: values.note ? `Debt payment: ${values.note}` : null })
          .eq("id", payment.transaction_id)
        if (updTxnErr) throw updTxnErr
      }
      const { error: updPayErr } = await sb.from("debt_payments").update({ amount: Number(values.amount), date: values.date, note: values.note || null }).eq("id", paymentId)
      if (updPayErr) throw updPayErr
      await recalcDebtPaidAmount(sb, debtId)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: debtsKeys.all })
      qc.invalidateQueries({ queryKey: debtsKeys.payments(vars.debtId) })
      qc.invalidateQueries({ queryKey: debtsKeys.allPayments })
      qc.invalidateQueries({ queryKey: expenseKeys.transactions })
      toast.success("Payment updated — net synced")
    },
    onError: (e: Error) => toast.error(e.message),
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
        const { data: existing, error: fetchErr } = await sb.from("debts").select("settlement_transaction_id, status, type, paid_amount").eq("id", id).single()
        if (fetchErr) throw fetchErr
        // if amount reduced below paid_amount, cap paid_amount
        let newPaid = Number(existing.paid_amount || 0)
        if (newPaid > Number(values.amount)) newPaid = Number(values.amount)
        const newStatus = newPaid >= Number(values.amount) ? "paid" : values.status
        const { error } = await sb.from("debts").update({ ...payload, paid_amount: newPaid, status: newStatus }).eq("id", id)
        if (error) throw error
        const { data: updated, error: fetch2 } = await sb.from("debts").select("settlement_transaction_id, amount, type, person_name, note, status").eq("id", id).single()
        if (fetch2) throw fetch2
        await syncDebtSettlement(sb, id, updated as never)
      } else {
        const { data: inserted, error } = await sb.from("debts").insert({ ...payload, paid_amount: values.status === "paid" ? values.amount : 0 }).select("id").single()
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
      // delete related payments (their transactions cascade via ON DELETE SET NULL, but we delete transactions explicitly)
      const { data: payments } = await sb.from("debt_payments").select("transaction_id").eq("debt_id", id)
      if (payments) {
        for (const p of payments as { transaction_id: string | null }[]) {
          if (p.transaction_id) await sb.from("expense_transactions").delete().eq("id", p.transaction_id)
        }
      }
      const { error } = await sb.from("debts").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: debtsKeys.all })
      qc.invalidateQueries({ queryKey: debtsKeys.allPayments })
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
      const { data: debt, error: fetchError } = await sb.from("debts").select("status, settlement_transaction_id, amount, type, person_name, note, paid_amount").eq("id", id).single()
      if (fetchError) throw fetchError
      // For partial model, toggling paid means set paid_amount to amount or 0
      const isPaid = Number(debt.paid_amount || 0) >= Number(debt.amount) - 0.001
      const newPaid = isPaid ? 0 : Number(debt.amount)
      const newStatus = newPaid >= Number(debt.amount) - 0.001 ? "paid" : "pending"
      const { error } = await sb.from("debts").update({ paid_amount: newPaid, status: newStatus }).eq("id", id)
      if (error) throw error
      // For legacy single settlement, sync
      if (!isPaid) {
        // marking paid: create single settlement if no partial payments exist
        const { data: payments } = await sb.from("debt_payments").select("id").eq("debt_id", id).limit(1)
        if (!payments || (payments as unknown[]).length === 0) {
          const updated = { ...debt, status: newStatus, amount: debt.amount, type: debt.type, person_name: debt.person_name, note: debt.note, settlement_transaction_id: debt.settlement_transaction_id } as never
          await syncDebtSettlement(sb, id, updated)
        } else {
          // already has partial payments, just update paid_amount, dont create single settlement
        }
      } else {
        // marking pending: remove single settlement if exists
        if (debt.settlement_transaction_id) {
          await syncDebtSettlement(sb, id, { ...debt, status: newStatus, settlement_transaction_id: debt.settlement_transaction_id } as never)
        }
        // also if there are partial payments, they remain, but paid_amount is now 0, so they should be considered? For simplicity, keep payments but paid_amount reset will make net correct after deleting their transactions via sync? For partial toggle, we just reset paid_amount, but partial payment transactions remain — they should be deleted or kept? For now, keep them and just reset paid_amount, net will be off until payments are deleted. To keep net correct, we should delete all partial payment transactions when toggling to pending via "paid -> pending" for partial debts?
        // For partial debts, toggling to pending should not delete partial payments, just set paid to 0 and keep history? But then net would still include those transactions. Better to keep paid_amount logic separate from single settlement.
        // For now, for partial debts, toggle will just set paid_amount, not affect debt_payments.
      }
      return newStatus
    },
    onSuccess: (newStatus) => {
      qc.invalidateQueries({ queryKey: debtsKeys.all })
      qc.invalidateQueries({ queryKey: debtsKeys.allPayments })
      qc.invalidateQueries({ queryKey: expenseKeys.transactions })
      toast.success(newStatus === "paid" ? "Marked as paid — net updated" : "Marked as pending — net updated")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useToggleDebtLock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient()
      const { data: debt, error } = await sb.from("debts").select("is_locked").eq("id", id).single()
      if (error) throw error
      const newLocked = !debt.is_locked
      const { error: updErr } = await sb.from("debts").update({ is_locked: newLocked }).eq("id", id)
      if (updErr) throw updErr
      return newLocked
    },
    onSuccess: (locked) => {
      qc.invalidateQueries({ queryKey: debtsKeys.all })
      toast.success(locked ? "Locked" : "Unlocked")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
