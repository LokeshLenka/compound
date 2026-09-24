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
} from "lucide-react";
import {
  useTransactions,
  useCategories,
  useBudgets,
  useDebts,
  useToggleDebtPaid,
} from "@/features/expenses/use-expenses";
import {
  TransactionDialog,
  CategoryDialog,
  BudgetDialog,
  DebtDialog,
  CategoryEmoji,
} from "@/features/expenses/expense-forms";
import { CreateFab } from "@/components/create-fab";
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
  const toggleDebtPaid = useToggleDebtPaid();

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

  useEffect(() => {
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
    const pendingDebts = debts.filter(
      (d) => d.type === "debt" && d.status !== "paid",
    );
    const pendingOwes = debts.filter(
      (d) => d.type === "owe" && d.status !== "paid",
    );
    const totalDebt = pendingDebts.reduce((s, d) => s + Number(d.amount), 0);
    const totalOwe = pendingOwes.reduce((s, d) => s + Number(d.amount), 0);
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
          <TabsTrigger value="transactions" className="rounded-full">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="debts" className="rounded-full">
            Debts
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-full">
            Categories
          </TabsTrigger>
          <TabsTrigger value="budgets" className="rounded-full">
            Budgets
          </TabsTrigger>
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
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setEditingTxn(t);
                          setTxnOpen(true);
                        }}
                        className="flex w-full items-center gap-3 px-6 py-3 text-left transition hover:bg-muted/50"
                      >
                        <CategoryEmoji emoji={cat?.icon} color={cat?.color} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {t.note || cat?.name || "Uncategorized"}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {cat?.name && t.note ? `${cat.name} · ` : ""}
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
              <Card>
                <CardContent className="divide-y divide-border/60 p-0">
                  {visibleDebts.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDebt(d);
                          setDebtOpen(true);
                        }}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <span
                          className={cn(
                            "grid size-8 place-items-center rounded-full text-xs font-bold text-white",
                            d.type === "debt" ? "bg-red-500" : "bg-green-600",
                          )}
                        >
                          {d.type === "debt" ? "D" : "O"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {d.person_name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {d.note ||
                              (d.due_date
                                ? `Due ${format(new Date(d.due_date), "MMM d, yyyy")}`
                                : "No due date")}{" "}
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
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-semibold tabular-nums",
                            d.type === "debt"
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400",
                          )}
                        >
                          {d.type === "debt" ? "−" : "+"}
                          {fmt(Number(d.amount))}
                        </span>
                      </button>
                      <Button
                        size="sm"
                        variant={d.status === "paid" ? "outline" : "default"}
                        className="h-8 shrink-0"
                        onClick={() => toggleDebtPaid.mutate(d.id)}
                        disabled={toggleDebtPaid.isPending}
                      >
                        {d.status === "paid" ? "Undo" : "Paid"}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
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
