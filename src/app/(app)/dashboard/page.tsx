"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Droplet,
  FileText,
  ListChecks,
  NotebookPen,
  PenLine,
  Repeat,
  CheckCircle2,
  Flame,
  PlusCircle,
  Wallet,
} from "lucide-react";
import {
  useHabits,
  useHabitLogs,
  useToggleLog,
} from "@/features/habits/use-habits";
import { useTasks, useSetTaskStatus } from "@/features/tasks/use-tasks";
import { useNotes } from "@/features/notes/use-notes";
import { useDiaryEntries } from "@/features/diary/use-diary";
import { useJournalEntries } from "@/features/journaling/use-journaling";
import { useTransactions } from "@/features/expenses/use-expenses";
import {
  useWaterLogs,
  useWaterSettings,
  useAddWater,
} from "@/features/water/use-water";
import { isDueToday } from "@/lib/habits";
import { colorSoft } from "@/lib/colors";
import { todayISO, humanDate } from "@/lib/dates";
import { totalMl, formatAmount, progressPct, remainingMl } from "@/lib/water";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StaggerGrid, StaggerItem } from "@/components/stagger-grid";
import { CreateFab } from "@/components/create-fab";

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: habits = [] } = useHabits();
  const { data: allLogs = [] } = useHabitLogs();
  const { data: tasks = [] } = useTasks();
  const { data: notes = [] } = useNotes();
  const { data: diary } = useDiaryEntries();
  const { data: journal = [] } = useJournalEntries();
  const { data: transactions = [] } = useTransactions();
  const { data: waterLogs = [] } = useWaterLogs();
  const { data: waterSettings } = useWaterSettings();
  const toggleLog = useToggleLog();
  const setStatus = useSetTaskStatus();
  const addWater = useAddWater();

  const today = todayISO();
  const now = new Date();

  const dueHabits = habits.filter(isDueToday);
  const todayLogs = new Set(
    allLogs.filter((l) => l.log_date === today).map((l) => l.habit_id),
  );
  const completedHabits = dueHabits.filter((h) => todayLogs.has(h.id));
  const pendingHabits = dueHabits.filter((h) => !todayLogs.has(h.id));

  const openTasks = tasks
    .filter((t) => t.status !== "done" && t.status !== "archived")
    .sort((a, b) => {
      const da = a.due_date ?? "9999-12-31";
      const db = b.due_date ?? "9999-12-31";
      return da < db ? -1 : da > db ? 1 : 0;
    });

  const todayDiary = diary?.find((e) => e.entry_date === today);

  const waterUnit = waterSettings?.water_unit ?? "ml";
  const waterGoal = waterSettings?.water_goal_ml ?? 2500;
  const waterPresets = (
    waterSettings?.water_quick_amounts ?? [150, 250, 350]
  ).slice(0, 3);
  const waterToday = totalMl(
    waterLogs.filter((l) => {
      const d = new Date(l.drank_at);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }),
  );
  const waterDone = waterToday >= waterGoal;
  const waterPct = progressPct(waterToday, waterGoal);

  const openCount =
    pendingHabits.length +
    openTasks.length +
    (todayDiary ? 0 : 1) +
    (waterDone ? 0 : 1);

  useEffect(() => {
    try {
      const nav = navigator as Navigator & {
        setAppBadge?: (n: number) => Promise<void>;
        clearAppBadge?: () => Promise<void>;
      };
      if (openCount > 0) void nav.setAppBadge?.(openCount);
      else void nav.clearAppBadge?.();
    } catch {
      /* badge unsupported — ignore */
    }
  }, [openCount]);

  const habitItems = [...completedHabits, ...pendingHabits];

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" />

      <motion.p
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-balance text-sm leading-relaxed text-muted-foreground"
      >
        {greeting(now)}, {humanDate(today, "EEEE, MMMM d")} —{" "}
        {openCount === 0 ? (
          <>everything is done. Enjoy your day.</>
        ) : (
          <>
            {openCount} thing{openCount === 1 ? "" : "s"} open today. Start at
            the top.
          </>
        )}
      </motion.p>

      {/* Habits Section */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-chart-1/12 text-chart-1">
              <Repeat className="size-4" aria-hidden />
            </span>
            Habits
          </CardTitle>
          <Link
            href="/habits"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-8 rounded-full",
            )}
          >
            All habits <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {dueHabits.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Nothing due today. Enjoy it!
            </CardContent>
          </Card>
        ) : (
          <StaggerGrid className="grid gap-2 sm:grid-cols-2">
            {habitItems.map((h, index) => (
              <StaggerItem key={h.id}>
                <HabitDashboardRow
                  habit={h}
                  done={todayLogs.has(h.id)}
                  onToggle={() =>
                    toggleLog.mutate({ habit_id: h.id, log_date: today })
                  }
                  index={index}
                />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}
      </motion.section>

      {/* Tasks Section */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-chart-2/12 text-chart-2">
              <ListChecks className="size-4" aria-hidden />
            </span>
            Tasks
          </CardTitle>
          <Link
            href="/tasks"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-8 rounded-full",
            )}
          >
            All tasks <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {openTasks.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              All clear. Add a task to stay ahead.
            </CardContent>
          </Card>
        ) : (
          <StaggerGrid className="grid gap-2 sm:grid-cols-2">
            {openTasks.slice(0, 6).map((t, index) => (
              <StaggerItem key={t.id}>
                <TaskDashboardRow
                  task={t}
                  onToggle={(done) =>
                    setStatus.mutate({
                      id: t.id,
                      status: done ? "done" : "todo",
                    })
                  }
                  index={index}
                />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}
      </motion.section>

      {/* Water Tracking Section */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-chart-water/12 text-chart-water">
              <Droplet className="size-4" aria-hidden />
            </span>
            Water
          </CardTitle>
          <Link
            href="/water"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-8 rounded-full",
            )}
          >
            Details <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-4 space-y-4">
            {/* Progress Ring + Stats */}
            <WaterProgressRingCompact
              totalMl={waterToday}
              goalMl={waterGoal}
              unit={waterUnit}
            />

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {waterPresets.map((amt) => (
                <motion.button
                  key={amt}
                  type="button"
                  disabled={addWater.isPending}
                  onClick={() => addWater.mutate({ amount_ml: amt })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-chart-water/10 text-sm font-semibold text-chart-water transition-colors hover:bg-chart-water/20 active:scale-[0.98] disabled:opacity-50"
                >
                  <PlusCircle className="size-4" />
                  {formatAmount(amt, waterUnit)}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Diary & Notes Quick Access */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-chart-3/12 text-chart-3">
                <PenLine className="size-4" aria-hidden />
              </span>
              Diary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayDiary ? (
              <>
                <p className="truncate text-sm font-medium">
                  {todayDiary.title || "Today's entry"}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {todayDiary.content
                    .replace(/[#>*`[\]()!~\-]/g, " ")
                    .replace(/\s+/g, " ")
                    .slice(0, 120)}
                </p>
                <Link
                  href="/diary"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-center",
                  )}
                >
                  Read entry <ArrowRight className="size-3.5" />
                </Link>
              </>
            ) : (
              <Link
                href="/diary"
                className="inline-flex items-center gap-1.5 w-full justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                <PenLine className="size-4" /> Write today&apos;s entry
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-chart-4/12 text-chart-4">
                <FileText className="size-4" aria-hidden />
              </span>
              Recent notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {notes.slice(0, 3).length === 0 ? (
              <Link
                href="/notes?create=1"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "w-full justify-center",
                )}
              >
                Create first note <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <>
                {notes.slice(0, 3).map((n) => (
                  <Link
                    key={n.id}
                    href="/notes"
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <span
                      className="mt-1 size-2 shrink-0 rounded-full bg-chart-3"
                      aria-hidden
                    />
                    <span className="flex-1 truncate text-sm font-medium">
                      {n.title || "Untitled"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {humanDate(n.updated_at, "MMM d")}
                    </span>
                  </Link>
                ))}
                <Link
                  href="/notes"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-center mt-1",
                  )}
                >
                  All notes <ArrowRight className="size-3.5" />
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Journal & Expenses Quick Access */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-chart-3/12 text-chart-3">
                <NotebookPen className="size-4" aria-hidden />
              </span>
              Journal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {journal.length === 0 ? (
              <Link
                href="/journal?create=1"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "w-full justify-center",
                )}
              >
                Start journaling <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <>
                <p className="truncate text-sm font-medium">
                  {journal[0].title ||
                    journal[0].content.slice(0, 60) ||
                    "Untitled"}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {journal.length} {journal.length === 1 ? "entry" : "entries"} ·{" "}
                  {humanDate(journal[0].created_at, "MMM d")}
                </p>
                <Link
                  href="/journal"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-center",
                  )}
                >
                  Open journal <ArrowRight className="size-3.5" />
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-chart-2/12 text-chart-2">
                <Wallet className="size-4" aria-hidden />
              </span>
              Spending
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {transactions.length === 0 ? (
              <Link
                href="/expenses?create=1"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "w-full justify-center",
                )}
              >
                Log first transaction <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <>
                <p className="text-sm font-medium tabular-nums">
                  {transactions
                    .filter(
                      (t) =>
                        t.type === "expense" &&
                        t.date.slice(0, 7) === today.slice(0, 7),
                    )
                    .reduce((s, t) => s + Number(t.amount), 0)
                    .toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                  <span className="font-normal text-muted-foreground">
                    spent this month
                  </span>
                </p>
                <Link
                  href="/expenses"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-center",
                  )}
                >
                  Open expenses <ArrowRight className="size-3.5" />
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </motion.section>

      <CreateFab
        label="New item"
        onClick={() => router.push("/tasks?create=1")}
      />
    </div>
  );
}

function HabitDashboardRow({
  habit,
  done,
  onToggle,
  index,
}: {
  habit: { id: string; name: string; emoji: string; color: string };
  done: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 30,
        delay: index * 0.03,
      }}
      className="group relative flex items-center gap-3 rounded-2xl bg-card/80 p-3 border border-border/50 hover:border-primary/20 transition-colors"
    >
      <motion.span
        whileHover={{ scale: 1.15, rotate: 6 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className="grid size-10 shrink-0 place-items-center rounded-xl text-lg shadow-sm"
        style={{
          background: `oklch(from ${colorSoft(habit.color)} l c h / 0.12)`,
        }}
        aria-hidden
      >
        {habit.emoji}
      </motion.span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            done && "line-through text-muted-foreground",
          )}
        >
          {habit.name}
        </p>
      </div>
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="flex items-center gap-1 rounded-full bg-chart-1/12 text-chart-1 px-2 py-0.5 text-xs font-semibold"
          >
            <CheckCircle2 className="size-3.5" />
            Done
          </motion.div>
        ) : (
          <motion.button
            key="check"
            type="button"
            onClick={onToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="shrink-0 size-10 rounded-full border-2 border-primary/30 bg-transparent flex items-center justify-center transition-colors hover:bg-primary/5 hover:border-primary"
            aria-label={`Mark ${habit.name} as done`}
          >
            <CheckCircle2 className="size-4.5 text-primary" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TaskDashboardRow({
  task,
  onToggle,
  index,
}: {
  task: {
    id: string;
    title: string;
    due_date: string | null;
    priority: string;
  };
  onToggle: (done: boolean) => void;
  index: number;
}) {
  const PRIORITY_META = {
    low: { label: "Low", bg: "bg-muted", text: "text-muted-foreground" },
    medium: {
      label: "Medium",
      bg: "bg-sky-100 dark:bg-sky-950",
      text: "text-sky-700 dark:text-sky-300",
    },
    high: {
      label: "High",
      bg: "bg-amber-100 dark:bg-amber-950",
      text: "text-amber-800 dark:text-amber-300",
    },
    urgent: {
      label: "Urgent",
      bg: "bg-red-100 dark:bg-red-950",
      text: "text-red-700 dark:text-red-300",
    },
  };
  const p =
    PRIORITY_META[task.priority as keyof typeof PRIORITY_META] ||
    PRIORITY_META.low;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 30,
        delay: index * 0.03,
      }}
      className="group relative flex items-center gap-3 rounded-2xl bg-card/80 p-3 border border-border/50 hover:border-primary/20 transition-colors"
    >
      <motion.span
        whileHover={{ scale: 1.15, rotate: 6 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className="grid size-10 shrink-0 place-items-center rounded-xl text-lg shadow-sm"
        aria-hidden
      >
        🎯
      </motion.span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-xs gap-1", p.bg, p.text)}
          >
            <Flame className="size-2.5" /> {p.label}
          </Badge>
          {task.due_date && (
            <span
              className={cn(
                "text-xs",
                task.due_date.slice(0, 10) < todayISO()
                  ? "text-destructive"
                  : task.due_date.slice(0, 10) === todayISO()
                    ? "text-primary"
                    : "text-muted-foreground",
              )}
            >
              {task.due_date.slice(0, 10) === todayISO()
                ? "Today"
                : task.due_date.slice(0, 10) < todayISO()
                  ? "Overdue"
                  : task.due_date.slice(0, 10)}
            </span>
          )}
        </div>
      </div>
      <motion.button
        type="button"
        onClick={() => onToggle(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="shrink-0 size-10 rounded-full border-2 border-primary/30 bg-transparent flex items-center justify-center transition-colors hover:bg-primary/5 hover:border-primary"
        aria-label={`Mark ${task.title} as done`}
      >
        <CheckCircle2 className="size-4.5 text-primary" />
      </motion.button>
    </motion.div>
  );
}

function WaterProgressRingCompact({
  totalMl: total,
  goalMl: goal,
  unit,
}: {
  totalMl: number;
  goalMl: number;
  unit: "ml" | "oz";
}) {
  const pct = Math.min(100, Math.round((total / goal) * 100));
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4 shrink-0">
      <div className="relative size-24">
        <svg className="size-full -rotate-90">
          <circle
            className="text-muted/20"
            strokeWidth="4"
            stroke="currentColor"
            fill="none"
            r={radius}
            cx={48}
            cy={48}
          />
          <motion.circle
            className="text-chart-water"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            r={radius}
            cx={48}
            cy={48}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.2,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold tabular-nums text-foreground">
            {pct}%
          </span>
        </div>
      </div>
      <div className="text-center sm:text-left">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Hydration
        </p>
        <p className="text-sm font-semibold tabular-nums">
          {formatAmount(total, unit)} / {formatAmount(goal, unit)}
        </p>
      </div>
    </div>
  );
}
