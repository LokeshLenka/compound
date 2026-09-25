"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Wallet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Scale,
  BarChart3,
  Pencil,
  X,
  Check,
  Trash,
  ArrowDown,
  ChevronDown,
} from "lucide-react";
import {
  useTransactions,
  useCategories,
  useBudgets,
  useDebts,
  useAllDebtPayments,
  useDeleteDebtPayment,
} from "@/features/expenses/use-expenses";
import {
  TransactionDialog,
  CategoryDialog,
  BudgetDialog,
  DebtDialog,
  DebtPaymentDialog,
  CategoryEmoji,
} from "@/features/expenses/expense-forms";
import { CreateFab } from "@/components/create-fab";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import type { ExpenseTransaction, ExpenseCategory } from "@/lib/types";
import { format } from "date-fns";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function fmt(n: number | string): string {
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodStart(
  period: "weekly" | "monthly" | "yearly",
  now = new Date(),
): Date {
  const d = new Date(now);
  if (period === "weekly") d.setDate(d.getDate() - 7);
  else if (period === "monthly") d.setDate(1);
  else d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function ExpenseSummaryCarousel({
  spent,
  earned,
  net,
  totalDebt,
  totalOwe,
  netDebt,
  slide,
  onSlideChange,
}: {
  spent: number;
  earned: number;
  net: number;
  totalDebt: number;
  totalOwe: number;
  netDebt: number;
  slide: number;
  onSlideChange: (n: number) => void;
}) {
  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40 && slide === 0) onSlideChange(1);
    if (dx > 40 && slide === 1) onSlideChange(0);
    startX.current = null;
  };
  return (
    <div className="space-y-2">
      <div
        className="overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          <div className="min-w-full grid lg:grid-cols-3 grid-cols-2 gap-2 pr-2">
            <div className="rounded-2xl bg-red-500/10 py-3 text-center">
              <p className="flex items-center justify-center gap-1 text-xs font-medium text-red-700 dark:text-red-300">
                <TrendingDown className="size-3.5" aria-hidden /> Spent
              </p>
              <p className="mt-0.5 truncate text-lg font-bold tabular-nums text-red-700 dark:text-red-300">
                {fmt(spent)}
              </p>
            </div>
            <div className="rounded-2xl bg-green-600/10 p-3 text-center">
              <p className="flex items-center justify-center gap-1 text-xs font-medium text-green-700 dark:text-green-300">
                <TrendingUp className="size-3.5" aria-hidden /> Earned
              </p>
              <p className="mt-0.5 truncate text-lg font-bold tabular-nums text-green-700 dark:text-green-300">
                {fmt(earned)}
              </p>
            </div>
            <div
              className={cn(
                "rounded-2xl p-3 text-center transition lg:col-span-1 col-span-2",
                net >= 0 ? "bg-green-600/10" : "bg-red-500/10",
              )}
            >
              <p className="flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
                <Scale className="size-3.5" aria-hidden /> Net
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate text-lg font-bold tabular-nums",
                  net >= 0
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300",
                )}
              >
                {net >= 0 ? "+" : "-"}
                {fmt(Math.abs(net))}
              </p>
            </div>
          </div>
          <div className="min-w-full grid lg:grid-cols-3 grid-cols-2 gap-2 pl-2">
            <div className="rounded-2xl bg-red-500/10 py-3 text-center">
              <p className="flex items-center justify-center gap-1 text-xs font-medium text-red-700 dark:text-red-300">
                <TrendingDown className="size-3.5" aria-hidden /> Debt
              </p>
              <p className="mt-0.5 truncate text-lg font-bold tabular-nums text-red-700 dark:text-red-300">
                −{fmt(totalDebt)}
              </p>
            </div>
            <div className="rounded-2xl bg-green-600/10 p-3 text-center">
              <p className="flex items-center justify-center gap-1 text-xs font-medium text-green-700 dark:text-green-300">
                <TrendingUp className="size-3.5" aria-hidden /> Owe
              </p>
              <p className="mt-0.5 truncate text-lg font-bold tabular-nums text-green-700 dark:text-green-300">
                +{fmt(totalOwe)}
              </p>
            </div>
            <div
              className={cn(
                "rounded-2xl p-3 text-center transition lg:col-span-1 col-span-2",
                netDebt >= 0 ? "bg-green-600/10" : "bg-red-500/10",
              )}
            >
              <p className="flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
                <Scale className="size-3.5" aria-hidden /> Net
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate text-lg font-bold tabular-nums",
                  netDebt >= 0
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300",
                )}
              >
                {netDebt >= 0 ? "+" : ""}
                {fmt(netDebt)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5">
        {[0, 1].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => onSlideChange(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              slide === i ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30",
            )}
          />
        ))}
      </div>
    </div>
  );
}

type Tab = "transactions" | "categories" | "budgets" | "debts";

export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      }
    >
      <ExpensesPageContent />
    </Suspense>
  );
}

function ExpensesPageContent() {
  const searchParams = useSearchParams();
  const { data: txns, isLoading: txnsLoading } = useTransactions();
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: budgets = [] } = useBudgets();
  const { data: debts = [], isLoading: debtsLoading } = useDebts();

  const [tab, setTab] = useState<Tab>("transactions");
  const [monthOffset, setMonthOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">(
    "all",
  );
  const [txnOpen, setTxnOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<ExpenseTransaction | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<
    (typeof budgets)[number] | null
  >(null);
  const [debtOpen, setDebtOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<(typeof debts)[number] | null>(
    null,
  );
  const [debtFilter, setDebtFilter] = useState<"all" | "debt" | "owe">("all");
  const [carouselSlide, setCarouselSlide] = useState(0);
  const [paymentDebt, setPaymentDebt] = useState<(typeof debts)[number] | null>(
    null,
  );
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<
    import("@/lib/types").DebtPayment | null
  >(null);
  const [confirmPayment, setConfirmPayment] = useState<{
    paymentId: string;
    debtId: string;
    amount: string;
  } | null>(null);
  const { data: debtPayments = [] } = useAllDebtPayments();
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const deletePayment = useDeleteDebtPayment();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync carousel to tab
    if (tab === "debts") setCarouselSlide(1);
    else setCarouselSlide(0);
  }, [tab]);

  useEffect(() => {
    if (searchParams.get("create")) {
      /* eslint-disable react-hooks/set-state-in-effect */ // open create dialog from ?create=1
      setEditingTxn(null);
      setTxnOpen(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [searchParams]);

  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const viewMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);
  const viewKey = monthKey(viewMonth);

  const monthTxns = useMemo(
    () => (txns ?? []).filter((t) => t.date.slice(0, 7) === viewKey),
    [txns, viewKey],
  );

  const spent = useMemo(
    () =>
      monthTxns
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + Number(t.amount), 0),
    [monthTxns],
  );
  const earned = useMemo(
    () =>
      monthTxns
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + Number(t.amount), 0),
    [monthTxns],
  );
  const net = earned - spent;

  const visibleTxns = useMemo(() => {
    let list = monthTxns;
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          (t.note ?? "").toLowerCase().includes(q) ||
          (t.category_id
            ? (catById.get(t.category_id)?.name ?? "").toLowerCase().includes(q)
            : false),
      );
    }
    return [...list].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      // same day: newest first by created_at, then updated_at, then id for stability
      if (a.created_at !== b.created_at)
        return a.created_at < b.created_at ? 1 : -1;
      if (a.updated_at !== b.updated_at)
        return a.updated_at < b.updated_at ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    });
  }, [monthTxns, typeFilter, query, catById]);

  const visibleDebts = useMemo(() => {
    let list = debts ?? [];
    if (debtFilter !== "all") list = list.filter((d) => d.type === debtFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.person_name.toLowerCase().includes(q) ||
          (d.note ?? "").toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      // pending first, then overdue, then paid
      const order = { pending: 0, overdue: 1, paid: 2 } as const;
      if (order[a.status] !== order[b.status])
        return order[a.status] - order[b.status];
      if (a.due_date && b.due_date)
        return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0;
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      return a.created_at < b.created_at ? 1 : -1;
    });
  }, [debts, debtFilter, query]);

  const debtStats = useMemo(() => {
    const totalDebt = debts
      .filter((d) => d.type === "debt" && d.status !== "paid")
      .reduce(
        (s, d) =>
          s +
          (Number(d.amount) -
            Number((d as { paid_amount?: number }).paid_amount || 0)),
        0,
      );
    const totalOwe = debts
      .filter((d) => d.type === "owe" && d.status !== "paid")
      .reduce(
        (s, d) =>
          s +
          (Number(d.amount) -
            Number((d as { paid_amount?: number }).paid_amount || 0)),
        0,
      );
    return { totalDebt, totalOwe, net: totalOwe - totalDebt };
  }, [debts]);

  const budgetProgress = useMemo(() => {
    const now = new Date();
    return budgets.map((b) => {
      const start = periodStart(b.period, now);
      const spend = (txns ?? [])
        .filter(
          (t) =>
            t.type === "expense" &&
            t.category_id === b.category_id &&
            new Date(t.date) >= start,
        )
        .reduce((s, t) => s + Number(t.amount), 0);
      return {
        budget: b,
        spend,
        pct: Math.min(100, Math.round((spend / Number(b.amount)) * 100)),
      };
    });
  }, [budgets, txns]);

  const expenseCats = categories.filter((c) => c.type === "expense");
  const incomeCats = categories.filter((c) => c.type === "income");
  const isLoading = txnsLoading || catsLoading;

  function openNewTxn() {
    setEditingTxn(null);
    setTxnOpen(true);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expenses"
        actions={
          <>
            <Link
              href="/expenses/stats"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 gap-1",
              )}
            >
              <BarChart3 className="size-3.5" /> Stats
            </Link>
            <Button
              variant="outline"
              className="hidden h-9 md:inline-flex"
              onClick={() => {
                setEditingCat(null);
                setCatOpen(true);
              }}
            >
              New category
            </Button>
            <Button className="hidden md:inline-flex" onClick={openNewTxn}>
              <Plus className="mr-1 size-4" /> Add transaction
            </Button>
          </>
        }
      />

      {/* Month summary — carousel: Spent/Earned/Net ↔ Owe/Debt/Net */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setMonthOffset((o) => o - 1)}
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-semibold">
              {format(viewMonth, "MMMM yyyy")}
              {monthOffset === 0 && (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  This month
                </span>
              )}
            </p>
            <button
              type="button"
              aria-label="Next month"
              disabled={monthOffset >= 0}
              onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <ExpenseSummaryCarousel
            spent={spent}
            earned={earned}
            net={net}
            totalDebt={debtStats.totalDebt}
            totalOwe={debtStats.totalOwe}
            netDebt={debtStats.net}
            slide={carouselSlide}
            onSlideChange={setCarouselSlide}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList
          className="grid w-full grid-cols-4 rounded-full bg-muted/70 p-1"
          aria-label="Expenses views"
        >
          <TabsTrigger value="transactions">
            <span className="lg:hidden ">History</span>
            <span className="hidden lg:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="debts">Debts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search notes or categories…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div
                className="flex shrink-0 gap-1 rounded-full bg-muted/70 p-1"
                role="group"
                aria-label="Filter by type"
              >
                {(["all", "expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={typeFilter === t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      "h-8 rounded-full px-3 text-xs font-medium capitalize transition active:scale-95",
                      typeFilter === t
                        ? "bg-card shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t === "all" ? "All" : t === "expense" ? "Out" : "In"}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : visibleTxns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p className="mb-3 flex justify-center">
                    <span className="grid size-14 place-items-center rounded-full bg-chart-2/12 text-chart-2">
                      <Wallet className="size-6" aria-hidden />
                    </span>
                  </p>
                  <p className="text-sm">
                    {monthTxns.length
                      ? "Nothing matches these filters."
                      : `No transactions in ${format(viewMonth, "MMMM")}.`}
                  </p>
                  {!monthTxns.length && (
                    <Button className="mt-4 gap-1.5" onClick={openNewTxn}>
                      <Plus className="size-4" /> Log your first transaction
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="divide-y divide-border/60 p-0">
                  {visibleTxns.map((t) => {
                    const cat = t.category_id
                      ? catById.get(t.category_id)
                      : undefined;
                    const dp = debtPayments.find(
                      (p) => p.transaction_id === t.id,
                    );
                    const dSettle = debts.find(
                      (d) =>
                        (d as unknown as { settlement_transaction_id?: string })
                          .settlement_transaction_id === t.id,
                    );
                    const debtForTxn = dp
                      ? debts.find((d) => d.id === dp.debt_id)
                      : (dSettle ?? null);
                    const isDebtTxn = !!(dp || dSettle);
                    let debtInfo: string | null = null;
                    if (isDebtTxn && debtForTxn) {
                      const person = debtForTxn.person_name || "Unknown";
                      const debtNote = debtForTxn.note?.trim();
                      const payNote = dp?.note?.trim() || "";
                      const txnNote = t.note?.trim() || "";
                      // Prefer txn note if it already is a full debt note, otherwise compose
                      if (txnNote && txnNote.startsWith("Debt")) {
                        debtInfo = txnNote;
                      } else {
                        const parts = [
                          `Debt ${dSettle ? "settlement" : "payment"}: ${person}`,
                        ];
                        if (debtNote) parts.push(debtNote);
                        if (payNote && payNote !== debtNote)
                          parts.push(payNote);
                        if (
                          txnNote &&
                          !parts.join(" ").includes(txnNote) &&
                          txnNote !== payNote &&
                          txnNote !== debtNote
                        )
                          parts.push(txnNote);
                        debtInfo = parts.join(" — ");
                        if (!payNote && !debtNote && !txnNote)
                          debtInfo = `Debt ${dSettle ? "settlement" : "payment"}: ${person}`;
                      }
                    } else if (isDebtTxn) {
                      debtInfo = t.note?.trim()
                        ? t.note
                        : `Debt:payment - ${t.note || "payment"}`;
                    }
                    // Fallback when debt not found but still debt txn (should not happen)
                    const displayTitle = isDebtTxn
                      ? debtInfo || `Debt:payment - ${t.note || "payment"}`
                      : t.note || cat?.name || "Uncategorized";
                    const debtNote = debtForTxn?.note?.trim() || "";
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setEditingTxn(t);
                          setTxnOpen(true);
                        }}
                        className="flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-muted/50 min-h-[56px]"
                      >
                        {isDebtTxn ? (
                          <span className="grid size-10 place-items-center rounded-full bg-violet-500/15 text-violet-400 shrink-0">
                            <span className="text-xs font-bold">₿</span>
                          </span>
                        ) : (
                          <CategoryEmoji emoji={cat?.icon} color={cat?.color} />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {displayTitle}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {isDebtTxn
                              ? "Vault · "
                              : cat?.name && t.note
                                ? `${cat.name} · `
                                : cat?.name
                                  ? `${cat.name} · `
                                  : ""}
                            {format(new Date(t.date), "MMM d")}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-semibold tabular-nums",
                            t.type === "expense"
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400",
                          )}
                        >
                          {t.type === "expense" ? "−" : "+"}
                          {fmt(Number(t.amount))}
                        </span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-4">
            <CategoryGroup
              title="Spending"
              categories={expenseCats}
              onEdit={(c) => {
                setEditingCat(c);
                setCatOpen(true);
              }}
              onNew={() => {
                setEditingCat(null);
                setCatOpen(true);
              }}
            />
            <CategoryGroup
              title="Income"
              categories={incomeCats}
              onEdit={(c) => {
                setEditingCat(c);
                setCatOpen(true);
              }}
              onNew={() => {
                setEditingCat(null);
                setCatOpen(true);
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="budgets">
          <div className="space-y-3">
            {budgetProgress.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">
                    No budgets yet. Set a spending limit per category.
                  </p>
                  <Button
                    className="mt-4 gap-1.5"
                    disabled={categories.length === 0}
                    onClick={() => {
                      setEditingBudget(null);
                      setBudgetOpen(true);
                    }}
                  >
                    <Plus className="size-4" /> Create a budget
                  </Button>
                  {categories.length === 0 && (
                    <p className="mt-2 text-xs">Add a category first.</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {budgetProgress.map(({ budget, spend, pct }) => {
                  const cat = catById.get(budget.category_id);
                  const over = spend > Number(budget.amount);
                  return (
                    <button
                      key={budget.id}
                      type="button"
                      onClick={() => {
                        setEditingBudget(budget);
                        setBudgetOpen(true);
                      }}
                      className="block w-full rounded-3xl text-left transition hover:border-primary/50"
                    >
                      <Card className="hover:card-shadow">
                        <CardContent className="space-y-2 px-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                              <CategoryEmoji
                                emoji={cat?.icon}
                                color={cat?.color}
                              />
                              <span className="truncate">
                                {cat?.name ?? "Unknown"}
                              </span>
                              <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium capitalize text-accent-foreground">
                                {budget.period}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                              {fmt(spend)} / {fmt(Number(budget.amount))}
                            </span>
                          </div>
                          <Progress
                            value={pct}
                            aria-label={`${cat?.name ?? "Budget"} ${pct}% used`}
                            className={cn(
                              over &&
                                "[&_[data-slot=progress-indicator]]:bg-destructive",
                            )}
                          />
                          <p
                            className={cn(
                              "text-xs tabular-nums",
                              over
                                ? "font-medium text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            {over
                              ? `${fmt(spend - Number(budget.amount))} over budget`
                              : `${pct}% used · ${fmt(Number(budget.amount) - spend)} left`}
                          </p>
                        </CardContent>
                      </Card>
                    </button>
                  );
                })}
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={categories.length === 0}
                  onClick={() => {
                    setEditingBudget(null);
                    setBudgetOpen(true);
                  }}
                >
                  <Plus className="mr-1 size-4" /> New budget
                </Button>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="debts">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1 rounded-full bg-muted/70 p-1">
                {(["all", "debt", "owe"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={debtFilter === t}
                    onClick={() => setDebtFilter(t)}
                    className={cn(
                      "h-8 rounded-full px-3 text-xs font-medium capitalize",
                      debtFilter === t
                        ? "bg-card shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    {t === "all" ? "All" : t === "debt" ? "Debts" : "Owes"}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                className="ml-auto h-8"
                onClick={() => {
                  setEditingDebt(null);
                  setDebtOpen(true);
                }}
              >
                <Plus className="mr-1 size-3.5" /> Add debt
              </Button>
            </div>
            {debtsLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : visibleDebts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">
                    No {debtFilter === "all" ? "" : debtFilter} debts yet.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setEditingDebt(null);
                      setDebtOpen(true);
                    }}
                  >
                    <Plus className="mr-1 size-4" /> Add debt / owe
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {visibleDebts.map((d) => {
                  const paid = Number(
                    (d as unknown as { paid_amount?: number }).paid_amount || 0,
                  );
                  const total = Number(d.amount);
                  const remaining = Math.max(0, total - paid);
                  const pct =
                    total > 0 ? Math.min(100, (paid / total) * 100) : 0;
                  const isPaid = remaining <= 0.01;
                  const expanded = expandedDebtId === d.id;
                  const payments = debtPayments.filter(
                    (p) => p.debt_id === d.id,
                  );
                  return (
                    <Card key={d.id} className="overflow-hidden">
                      <CardContent className="space-y-4">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedDebtId(expanded ? null : d.id)
                          }
                          className="flex w-full items-center gap-3 p-4 text-left min-h-[56px] hover:bg-muted/20 transition-colors"
                        >
                          <span
                            className={cn(
                              "grid size-10 place-items-center rounded-full text-xs font-bold text-white shrink-0",
                              d.type === "debt" ? "bg-red-500" : "bg-green-600",
                            )}
                          >
                            {d.type === "debt" ? "D" : "O"}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                              {d.person_name}
                              {isPaid && (
                                <span className="text-green-600 text-xs">
                                  Paid
                                </span>
                              )}
                            </span>
                            <span className="block text-xs text-muted-foreground truncate">
                              {fmt(paid)} / {fmt(total)} · {pct.toFixed(0)}% ·{" "}
                              {isPaid ? "paid" : d.status}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "shrink-0 text-sm font-bold tabular-nums",
                              d.type === "debt"
                                ? "text-red-600 dark:text-red-400"
                                : "text-green-600 dark:text-green-400",
                            )}
                          >
                            {d.type === "debt" ? "-" : "+"}
                            {fmt(total)}
                          </span>
                          <span
                            className={cn(
                              "grid size-8 place-items-center shrink-0 rounded border transition-transform",
                              expanded
                                ? "bg-primary text-primary-foreground rotate-180"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            <ChevronDown className="size-4" />
                          </span>
                        </button>
                        <div className="px-4 pb-3">
                          <div className="h-2 bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        {expanded && (
                          <div className="space-y-3 px-4 pb-4 animate-enter">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-muted-foreground">
                                {d.note ? (
                                  <span>Note: {d.note}</span>
                                ) : d.due_date ? (
                                  <span>
                                    Due{" "}
                                    {format(
                                      new Date(d.due_date),
                                      "MMM d, yyyy",
                                    )}
                                  </span>
                                ) : (
                                  <span>No due date</span>
                                )}{" "}
                                ·{" "}
                                <span
                                  className={cn(
                                    d.status === "paid"
                                      ? "text-green-600"
                                      : d.status === "overdue"
                                        ? "text-destructive"
                                        : "text-muted-foreground",
                                  )}
                                >
                                  {d.status}
                                </span>
                              </span>
                              <span
                                className={cn(
                                  "font-medium",
                                  remaining === 0
                                    ? "text-green-600"
                                    : "text-amber-600",
                                )}
                              >
                                Remaining {fmt(remaining)}
                              </span>
                            </div>

                            {payments.length > 0 && (
                              <div className="rounded-none border border-primary/10 bg-muted/20">
                                <div className="px-2 py-1 text-[10px] font-mono font-bold tracking-widest text-muted-foreground">
                                  PAYMENTS ({payments.length}) — tap to edit
                                </div>
                                <div className="divide-y divide-border/30">
                                  {payments.map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        setPaymentDebt(d);
                                        setEditingPayment(
                                          p as unknown as import("@/lib/types").DebtPayment,
                                        );
                                        setPaymentOpen(true);
                                      }}
                                      className="flex w-full items-center gap-3 px-3 py-4 text-left hover:bg-muted/40 transition-colors min-h-[56px]"
                                    >
                                      <span className="font-mono tabular-nums shrink-0 text-sm">
                                        {fmt(Number(p.amount))} ·{" "}
                                        {format(new Date(p.date), "MMM d")}
                                      </span>
                                      <span className="truncate text-muted-foreground flex-1 text-sm">
                                        {p.note || "No note"}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 min-h-[44px] text-sm"
                                disabled={isPaid}
                                onClick={() => {
                                  setPaymentDebt(d);
                                  setEditingPayment(null);
                                  setPaymentOpen(true);
                                }}
                              >
                                {isPaid
                                  ? "Fully paid"
                                  : `Pay ${fmt(remaining)}`}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="min-h-[44px] px-4"
                                onClick={() => {
                                  setEditingDebt(d);
                                  setDebtOpen(true);
                                }}
                              >
                                <Pencil className="size-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <TransactionDialog
        open={txnOpen}
        onOpenChange={setTxnOpen}
        txn={editingTxn}
        categories={categories}
      />
      <CategoryDialog
        open={catOpen}
        onOpenChange={setCatOpen}
        category={editingCat}
      />
      <BudgetDialog
        open={budgetOpen}
        onOpenChange={setBudgetOpen}
        budget={editingBudget}
        categories={categories}
      />
      <DebtDialog
        open={debtOpen}
        onOpenChange={setDebtOpen}
        debt={editingDebt}
      />
      <DebtPaymentDialog
        open={paymentOpen}
        onOpenChange={(o) => {
          setPaymentOpen(o);
          if (!o) setEditingPayment(null);
        }}
        debt={paymentDebt}
        payment={editingPayment}
      />
      <ConfirmDeleteDialog
        open={!!confirmPayment}
        onOpenChange={(o: boolean) => !o && setConfirmPayment(null)}
        onConfirm={() => {
          if (confirmPayment) {
            deletePayment.mutate({
              paymentId: confirmPayment.paymentId,
              debtId: confirmPayment.debtId,
            });
            setConfirmPayment(null);
          }
        }}
        title={`Delete payment ${confirmPayment?.amount ?? ""}?`}
        description="This will delete the payment and its vault transaction and update the debt balance. This cannot be undone."
      />

      <CreateFab
        label={
          tab === "debts"
            ? "Add debt"
            : tab === "categories"
              ? "Add category"
              : tab === "budgets"
                ? "Add budget"
                : "Add transaction"
        }
        onClick={() => {
          if (tab === "debts") {
            setEditingDebt(null);
            setDebtOpen(true);
          } else if (tab === "categories") {
            setEditingCat(null);
            setCatOpen(true);
          } else if (tab === "budgets") {
            setEditingBudget(null);
            setBudgetOpen(true);
          } else {
            openNewTxn();
          }
        }}
      />
    </div>
  );
}

function CategoryGroup({
  title,
  categories,
  onEdit,
  onNew,
}: {
  title: string;
  categories: ExpenseCategory[];
  onEdit: (c: ExpenseCategory) => void;
  onNew: () => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full"
          onClick={onNew}
        >
          <Plus className="size-3.5" /> New
        </Button>
      </div>
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No {title.toLowerCase()} categories yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onEdit(c)}
              className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/80 p-3 text-left transition hover:border-primary/20"
            >
              <CategoryEmoji emoji={c.icon} color={c.color} />
              <span className="flex-1 truncate text-sm font-medium">
                {c.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
