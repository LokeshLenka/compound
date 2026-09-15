"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { habitSchema, type HabitFormValues } from "@/lib/schemas";
import { HABIT_COLORS } from "@/lib/colors";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCreateHabit, useUpdateHabit } from "@/features/habits/use-habits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekdays: "Specific days",
  weekly: "X times per week",
  every_n_days: "Every N days",
};

export function HabitFormDialog({
  open,
  onOpenChange,
  habit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
}) {
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const isEdit = Boolean(habit);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: "",
      emoji: "⭐",
      color: "slate",
      frequency_type: "daily",
      times: 3,
      days: [1, 2, 3, 4, 5],
      every: 2,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        habit
          ? {
              name: habit.name,
              emoji: habit.emoji,
              color: habit.color,
              frequency_type: habit.frequency_type,
              times: habit.frequency_value.times ?? 3,
              days: habit.frequency_value.days ?? [1, 2, 3, 4, 5],
              every: habit.frequency_value.every ?? 2,
            }
          : {
              name: "",
              emoji: "⭐",
              color: "slate",
              frequency_type: "daily",
              times: 3,
              days: [1, 2, 3, 4, 5],
              every: 2,
            },
      );
    }
  }, [open, habit, reset]);

  const frequency = watch("frequency_type");
  const days = watch("days");
  const color = watch("color");

  async function onSubmit(values: HabitFormValues) {
    if (isEdit && habit) {
      await updateHabit.mutateAsync({ id: habit.id, values });
    } else {
      await createHabit.mutateAsync(values);
    }
    onOpenChange(false);
  }

  function toggleDay(d: number) {
    const current = days ?? [];
    const next = current.includes(d)
      ? current.filter((x) => x !== d)
      : [...current, d].sort();
    setValue("days", next, { shouldDirty: true });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit habit" : "New habit"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="habit-name">Name</Label>
            <Input
              id="habit-name"
              placeholder="e.g. Morning jog"
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="habit-emoji">Emoji</Label>
              <Input
                id="habit-emoji"
                className="text-center max-h-8"
                maxLength={8}
                {...register("emoji")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="habit-frequency">Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(v) =>
                  setValue(
                    "frequency_type",
                    v as HabitFormValues["frequency_type"],
                    { shouldDirty: true },
                  )
                }
              >
                <SelectTrigger id="habit-frequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {frequency === "weekdays" && (
            <div className="space-y-2">
              <Label>Which days?</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition",
                      (days ?? []).includes(d)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    {WEEKDAY_LABELS[d - 1]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {frequency === "weekly" && (
            <div className="space-y-2">
              <Label htmlFor="habit-times">Times per week</Label>
              <Select
                value={String(watch("times"))}
                onValueChange={(value) =>
                  setValue("times", Number(value), { shouldDirty: true })
                }
              >
                <SelectTrigger id="habit-times" className="w-full rounded-full">
                  <SelectValue placeholder="Select times per week" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "time" : "times"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {frequency === "every_n_days" && (
            <div className="space-y-2">
              <Label htmlFor="habit-every">Repeat every N days</Label>
              <Input
                id="habit-every"
                type="number"
                min={1}
                max={90}
                {...register("every")}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap sm:gap-1 gap-1.5 pt-1">
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
