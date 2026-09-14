"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Wallet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";
import {
  useTransactions,
  useCategories,
  useBudgets,
} from "@/features/expenses/use-expenses";
import {
  TransactionDialog,
  CategoryDialog,
  BudgetDialog,
  CategoryEmoji,
} from "@/features/expenses/expense-forms";
import { CreateFab } from "@/components/create-fab";
import type { ExpenseTransaction, ExpenseCategory } from "@/lib/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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

type Tab = "transactions" | "categories" | "budgets";

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
    return [...list].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
    );
  }, [monthTxns, typeFilter, query, catById]);

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

      {/* Month summary */}
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
          <div className="grid grid-cols-3 gap-2">
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
                "rounded-2xl p-3 text-center",
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
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList
          className="grid w-full grid-cols-3 rounded-full bg-muted/70 p-1"
          aria-label="Expenses views"
        >
          <TabsTrigger value="transactions" className="rounded-full">
            Transactions
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

      <CreateFab label="Add transaction" onClick={openNewTxn} />
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
