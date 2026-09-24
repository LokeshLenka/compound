"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  expenseTransactionSchema,
  expenseCategorySchema,
  expenseBudgetSchema,
  debtSchema,
  type ExpenseTransactionFormValues,
  type ExpenseCategoryFormValues,
  type ExpenseBudgetFormValues,
  type DebtFormValues,
} from "@/lib/schemas";
import type {
  ExpenseCategory,
  ExpenseTransaction,
  ExpenseBudget,
  Debt,
} from "@/lib/types";
import {
  useSaveTransaction,
  useDeleteTransaction,
  useSaveCategory,
  useDeleteCategory,
  useSaveBudget,
  useDeleteBudget,
  useSaveDebt,
  useDeleteDebt,
} from "@/features/expenses/use-expenses";
import { colorSoft, HABIT_COLORS } from "@/lib/colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const NONE = "__none";

function TypeSegmented({
  value,
  onChange,
}: {
  value: "income" | "expense";
  onChange: (v: "income" | "expense") => void;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-full bg-muted/70 p-1"
      role="group"
      aria-label="Transaction type"
    >
      {(["expense", "income"] as const).map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={value === t}
          onClick={() => onChange(t)}
          className={cn(
            "h-9 rounded-full text-sm font-medium capitalize transition active:scale-95",
            value === t
              ? t === "expense"
                ? "bg-red-500 text-white shadow-sm"
                : "bg-green-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t === "expense" ? "− Expense" : "+ Income"}
        </button>
      ))}
    </div>
  );
}

export function TransactionDialog({
  open,
  onOpenChange,
  txn,
  categories,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  txn?: ExpenseTransaction | null;
  categories: ExpenseCategory[];
  defaultType?: "income" | "expense";
}) {
  const save = useSaveTransaction();
  const remove = useDeleteTransaction();
  const isEdit = Boolean(txn);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { register, reset, handleSubmit, setValue, watch, formState } =
    useForm<ExpenseTransactionFormValues>({
      resolver: zodResolver(expenseTransactionSchema),
      defaultValues: {
        amount: "" as unknown as number,
        type: "expense",
        category_id: null,
        date: new Date().toISOString().slice(0, 10),
        note: "",
        recurring_interval: null,
      },
    });

  const type = watch("type");
  const categoryId = watch("category_id");
  const categoryName = categories.find((c) => c.id === categoryId)?.name;

  /* eslint-disable react-hooks/set-state-in-effect */ // syncs form to the opened transaction
  useEffect(() => {
    if (open) {
      reset({
        amount: (txn?.amount ?? "") as unknown as number,
        type: txn?.type ?? defaultType ?? "expense",
        category_id: txn?.category_id ?? null,
        date: txn?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        note: txn?.note ?? "",
        recurring_interval: txn?.recurring_interval ?? null,
      });
    }
  }, [open, txn, defaultType, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const visibleCategories = categories.filter((c) => c.type === type);

  async function onSubmit(values: ExpenseTransactionFormValues) {
    await save.mutateAsync({ id: txn?.id, values });
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className={"pl-2"}>
              {isEdit ? "Edit transaction" : "Add transaction"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <TypeSegmented
              value={type}
              onChange={(v) => {
                setValue("type", v, { shouldDirty: true });
                setValue("category_id", null, { shouldDirty: true });
              }}
            />
            <div className="space-y-2">
              <Label htmlFor="txn-amount">Amount</Label>
              <Input
                id="txn-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                autoFocus
                className="text-2xl font-bold tabular-nums"
                {...register("amount")}
              />
              {formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="txn-category">Category</Label>
                <Select
                  value={categoryName ?? NONE}
                  onValueChange={(v) =>
                    setValue("category_id", v === NONE ? null : v, {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="txn-category" className="w-full">
                    <SelectValue placeholder="Uncategorized" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Uncategorized</SelectItem>
                    {visibleCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="txn-date">Date</Label>
                <Input id="txn-date" type="date" {...register("date")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="txn-note">Note</Label>
              <Input
                id="txn-note"
                placeholder="What was this for?"
                {...register("note")}
              />
            </div>
            <DialogFooter>
              {isEdit && txn && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full sm:w-auto mr-auto"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formState.isSubmitting || save.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={() => {
          if (txn) void remove.mutate(txn.id);
          onOpenChange(false);
        }}
      />
    </>
  );
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ExpenseCategory | null;
  defaultType?: "income" | "expense";
}) {
  const save = useSaveCategory();
  const remove = useDeleteCategory();
  const isEdit = Boolean(category);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { register, reset, handleSubmit, setValue, watch, formState } =
    useForm<ExpenseCategoryFormValues>({
      resolver: zodResolver(expenseCategorySchema),
      defaultValues: { name: "", type: "expense", icon: "🏷️", color: "slate" },
    });

  const type = watch("type");
  const icon = watch("icon");
  const color = watch("color");

  /* eslint-disable react-hooks/set-state-in-effect */ // syncs form to the opened category
  useEffect(() => {
    if (open) {
      reset({
        name: category?.name ?? "",
        type: category?.type ?? defaultType ?? "expense",
        icon: category?.icon && category.icon !== "tag" ? category.icon : "🏷️",
        color: category?.color ?? "slate",
      });
    }
  }, [open, category, defaultType, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function onSubmit(values: ExpenseCategoryFormValues) {
    await save.mutateAsync({ id: category?.id, values });
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <TypeSegmented
              value={type}
              onChange={(v) => setValue("type", v, { shouldDirty: true })}
            />
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                placeholder="Groceries, Salary, Rent…"
                autoFocus
                {...register("name")}
              />
              {formState.errors.name && (
                <p className="text-xs text-destructive">
                  {formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-emoji">Icon</Label>
              <Input
                id="cat-emoji"
                placeholder="Type or paste an emoji…"
                maxLength={4}
                value={icon}
                onChange={(e) =>
                  setValue("icon", e.target.value, { shouldDirty: true })
                }
              />
              <p className="text-xs text-muted-foreground">
                Type any emoji to represent this category
              </p>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    aria-label={`Color ${c.name}`}
                    onClick={() =>
                      setValue("color", c.name, { shouldDirty: true })
                    }
                    className={cn(
                      "size-6 rounded-full ring-offset-2 transition",
                      c.swatch,
                      color === c.name && "ring-2 ring-foreground",
                    )}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              {isEdit && category && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full sm:w-auto mr-auto"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formState.isSubmitting || save.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={() => {
          if (category) void remove.mutate(category.id);
          onOpenChange(false);
        }}
      />
    </>
  );
}

const PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export function BudgetDialog({
  open,
  onOpenChange,
  budget,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: ExpenseBudget | null;
  categories: ExpenseCategory[];
}) {
  const save = useSaveBudget();
  const remove = useDeleteBudget();
  const isEdit = Boolean(budget);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { register, reset, handleSubmit, setValue, watch, formState } =
    useForm<ExpenseBudgetFormValues>({
      resolver: zodResolver(expenseBudgetSchema),
      defaultValues: {
        category_id: "",
        amount: "" as unknown as number,
        period: "monthly",
      },
    });

  const categoryId = watch("category_id");
  const categoryName = categories.find((c) => c.id === categoryId)?.name;
  const period = watch("period");

  /* eslint-disable react-hooks/set-state-in-effect */ // syncs form to the opened budget
  useEffect(() => {
    if (open) {
      reset({
        category_id: budget?.category_id ?? categories[0]?.id ?? "",
        amount: (budget?.amount ?? "") as unknown as number,
        period: budget?.period ?? "monthly",
      });
    }
  }, [open, budget, categories, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function onSubmit(values: ExpenseBudgetFormValues) {
    await save.mutateAsync({ id: budget?.id, values });
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit budget" : "New budget"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="budget-category">Category</Label>
              <Select
                value={categoryName ?? ""}
                onValueChange={(v) =>
                  setValue("category_id", v ?? "", { shouldDirty: true })
                }
              >
                <SelectTrigger id="budget-category" className="w-full">
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} · {c.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budget-amount">Limit</Label>
                <Input
                  id="budget-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  autoFocus
                  className="tabular-nums"
                  {...register("amount")}
                />
                {formState.errors.amount && (
                  <p className="text-xs text-destructive">
                    {formState.errors.amount.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-period">Period</Label>
                <Select
                  value={period}
                  onValueChange={(v) =>
                    setValue("period", v as "weekly" | "monthly" | "yearly", {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="budget-period" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              {isEdit && budget && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full sm:w-auto mr-auto"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formState.isSubmitting || save.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={() => {
          if (budget) void remove.mutate(budget.id);
          onOpenChange(false);
        }}
      />
    </>
  );
}

export function DebtDialog({
  open,
  onOpenChange,
  debt,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt?: Debt | null
}) {
  const save = useSaveDebt()
  const remove = useDeleteDebt()
  const isEdit = Boolean(debt)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const { register, reset, handleSubmit, setValue, watch, formState } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      person_name: "",
      amount: "" as unknown as number,
      type: "debt",
      status: "pending",
      due_date: null,
      note: "",
    },
  })

  const type = watch("type")
  const status = watch("status")

  useEffect(() => {
    if (open) {
      reset({
        person_name: debt?.person_name ?? "",
        amount: (debt?.amount ?? "") as unknown as number,
        type: debt?.type ?? "debt",
        status: debt?.status ?? "pending",
        due_date: debt?.due_date?.slice(0, 10) ?? null,
        note: debt?.note ?? "",
      })
    }
  }, [open, debt, reset])

  async function onSubmit(values: DebtFormValues) {
    await save.mutateAsync({ id: debt?.id, values })
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit debt" : "Add debt / owe"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="debt-person">Person</Label>
              <Input id="debt-person" placeholder="Who?" autoFocus {...register("person_name")} />
              {formState.errors.person_name && <p className="text-xs text-destructive">{formState.errors.person_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-amount">Amount</Label>
              <Input id="debt-amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" className="text-xl font-bold tabular-nums" {...register("amount")} />
              {formState.errors.amount && <p className="text-xs text-destructive">{formState.errors.amount.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setValue("type", v as DebtFormValues["type"], { shouldDirty: true })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debt">I owe (Debt)</SelectItem>
                    <SelectItem value="owe">They owe me (Owe)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setValue("status", v as DebtFormValues["status"], { shouldDirty: true })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-due">Due date</Label>
              <Input id="debt-due" type="date" {...register("due_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-note">Note</Label>
              <Input id="debt-note" placeholder="Optional note" {...register("note")} />
            </div>
            <DialogFooter>
              {isEdit && debt && (
                <Button type="button" variant="destructive" className="w-full sm:w-auto mr-auto" onClick={() => setConfirmDeleteOpen(true)}>
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={formState.isSubmitting || save.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen} onConfirm={() => { if (debt) void remove.mutate(debt.id); onOpenChange(false) }} />
    </>
  )
}

export function CategoryEmoji({
  emoji,
  color,
  className,
}: {
  emoji?: string | null;
  color?: string;
  className?: string;
}) {
  const glyph = emoji && emoji !== "tag" ? emoji : "🏷️";
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-xl text-lg",
        colorSoft(color),
        className,
      )}
    >
      {glyph}
    </span>
  );
}
