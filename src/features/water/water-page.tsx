"use client";

import { useState, type FormEvent } from "react";
import {
  Check,
  Droplet,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useWaterLogs, useWaterSettings } from "@/features/water/use-water";
import { useAddWater } from "@/features/water/use-water";
import { useDeleteWater } from "@/features/water/use-water";
import { useUpdateWater } from "@/features/water/use-water";
import { WaterProgressRing } from "@/features/water/water-progress-ring";
import { WaterWeekChart } from "@/features/water/water-week-chart";
import { WaterSettingsDialog } from "@/features/water/water-settings-dialog";
import {
  bestDayMl,
  dailyTotals,
  formatAmount,
  formatClock,
  mlToUnit,
  progressPct,
  remainingMl,
  totalMl,
  currentStreak,
  dailyAverage,
  unitToMl,
  weekTotalMl,
} from "@/lib/water";
import type { WaterLog, WaterUnit } from "@/lib/types";

/** Matches the amount_ml check constraint on water_intake_logs. */
const MAX_ENTRY_ML = 5000;

export default function WaterPage() {
  const logsQuery = useWaterLogs();
  const settingsQuery = useWaterSettings();
  const addWater = useAddWater();
  const deleteWater = useDeleteWater();
  const updateWater = useUpdateWater();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const logs = logsQuery.data ?? [];
  const settings = settingsQuery.data;
  const unit: WaterUnit = settings?.water_unit ?? "ml";
  const goalMl = settings?.water_goal_ml ?? 2500;
  const quickAmounts = settings?.water_quick_amounts ?? [200, 400, 800];

  const now = new Date();
  const todayLogs = logs.filter((l) => {
    const d = new Date(l.drank_at);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });
  const todayMl = totalMl(todayLogs);
  const pct = progressPct(todayMl, goalMl);
  const rest = remainingMl(todayMl, goalMl);
  const done = todayMl >= goalMl;
  const streak = currentStreak(logs, goalMl, now);
  const avgMl = dailyAverage(logs, 7, now);
  const week = dailyTotals(logs, 7, now);
  const weekTotal = weekTotalMl(week);
  const bestDay = bestDayMl(week);

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Water"
        actions={
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="size-4" />
            Settings
          </Button>
        }
      />

      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col items-center gap-6">
            {logsQuery.isLoading ? (
              <Skeleton className="size-48 rounded-full" />
            ) : (
              <WaterProgressRing
                totalMl={todayMl}
                goalMl={goalMl}
                unit={unit}
              />
            )}

            <div className="grid w-full grid-cols-3 gap-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  onClick={() => addWater.mutate({ amount_ml: amt })}
                >
                  +{formatAmount(amt, unit)}
                </Button>
              ))}
            </div>

            <CustomAmountForm
              unit={unit}
              pending={addWater.isPending}
              onAdd={(ml) => addWater.mutate({ amount_ml: ml })}
            />

            <div className="grid w-full gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Today&apos;s entries{" "}
                  <span className="tabular-nums text-muted-foreground">
                    ({todayLogs.length})
                  </span>
                </p>
                {todayLogs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deleteWater.isPending}
                    onClick={() => deleteWater.mutate(todayLogs[0].id)}
                  >
                    <Undo2 className="size-4" />
                    Undo last
                  </Button>
                )}
              </div>
              {todayLogs.length === 0 ? (
                <p className="rounded-3xl border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  No water logged yet today — add your first glass above.
                </p>
              ) : (
                <div className="grid max-h-72 gap-2 overflow-y-auto pr-0.5">
                  {todayLogs.map((log) => (
                    <WaterLogRow
                      key={log.id}
                      log={log}
                      unit={unit}
                      saving={updateWater.isPending}
                      onSave={(amountMl) =>
                        updateWater.mutate({ id: log.id, amount_ml: amountMl })
                      }
                      onDelete={() => deleteWater.mutate(log.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-center">This week</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-5">
            <WaterWeekChart logs={logs} goalMl={goalMl} unit={unit} now={now} />

            <div className="grid grid-cols-3 gap-x-2 gap-y-3 text-center">
              <WeekStat label="7-day avg" value={formatAmount(avgMl, unit)} />
              <WeekStat
                label="Week total"
                value={formatAmount(weekTotal, unit)}
              />
              <WeekStat label="Best day" value={formatAmount(bestDay, unit)} />
              <WeekStat label="Streak" value={`${streak}d`} />
              <WeekStat label="Today" value={formatAmount(todayMl, unit)} />
              <WeekStat label="Daily goal" value={formatAmount(goalMl, unit)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <WaterSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function WeekStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function CustomAmountForm({
  unit,
  pending,
  onAdd,
}: {
  unit: WaterUnit;
  pending: boolean;
  onAdd: (ml: number) => void;
}) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(parsed) || parsed <= 0) {
      setError(`Enter an amount greater than 0 ${unit}.`);
      return;
    }
    const ml = unitToMl(parsed, unit);
    if (ml > MAX_ENTRY_ML) {
      setError(
        `Single entries are capped at ${formatAmount(MAX_ENTRY_ML, unit)}.`,
      );
      return;
    }
    onAdd(ml);
    setRaw("");
    setError(null);
  }

  return (
    <form onSubmit={submit} className="grid w-full gap-1.5">
      <Label htmlFor="water-custom">Custom amount</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="water-custom"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder={unit === "oz" ? "8" : "350"}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            aria-describedby={error ? "water-custom-err" : undefined}
            className="pr-10 tabular-nums"
          />
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs text-muted-foreground">
            {unit}
          </span>
        </div>
        <Button type="submit" disabled={pending}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      {error && (
        <p id="water-custom-err" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

function WaterLogRow({
  log,
  unit,
  saving,
  onSave,
  onDelete,
}: {
  log: WaterLog;
  unit: WaterUnit;
  saving: boolean;
  onSave: (amountMl: number) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Optimistic rows carry a client-side id that doesn't exist server-side yet.
  const isOptimistic = log.id.startsWith("optimistic-");

  function beginEdit() {
    setRaw(String(mlToUnit(log.amount_ml, unit)));
    setError(null);
    setEditing(true);
  }

  function commit() {
    const parsed = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    const ml = unitToMl(parsed, unit);
    if (ml > MAX_ENTRY_ML) {
      setError(
        `Single entries are capped at ${formatAmount(MAX_ENTRY_ML, unit)}.`,
      );
      return;
    }
    onSave(ml);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="grid gap-1 rounded-3xl border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            aria-label="Edit amount"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="h-8 tabular-nums"
            autoFocus
          />
          <span className="shrink-0 text-xs text-muted-foreground">{unit}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={commit}
            disabled={saving}
            aria-label="Save entry"
          >
            <Check className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(false)}
            aria-label="Cancel edit"
          >
            <X className="size-4" />
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-full bg-chart-water/15 text-chart-water">
          <Droplet className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium tabular-nums">
            {formatAmount(log.amount_ml, unit)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatClock(log.drank_at)}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        {!isOptimistic && (
          <Button
            variant="ghost"
            size="sm"
            onClick={beginEdit}
            aria-label="Edit entry"
          >
            <Pencil className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          aria-label="Delete entry"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
