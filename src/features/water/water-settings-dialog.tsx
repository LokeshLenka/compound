"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  waterSettingsSchema,
  type WaterSettingsFormValues,
} from "@/lib/schemas"
import {
  useWaterSettings,
  useUpdateWaterSettings,
} from "@/features/water/use-water"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function WaterSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: settings } = useWaterSettings()
  const update = useUpdateWaterSettings()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WaterSettingsFormValues>({
    resolver: zodResolver(waterSettingsSchema),
    defaultValues: {
      water_goal_ml: 2500,
      water_unit: "ml",
      water_quick_amounts: [200, 400, 800],
    },
  })

  const unit = watch("water_unit")

  useEffect(() => {
    if (open && settings) {
      reset({
        water_goal_ml: settings.water_goal_ml,
        water_unit: settings.water_unit,
        water_quick_amounts:
          settings.water_quick_amounts.length === 3
            ? settings.water_quick_amounts
            : [200, 400, 800],
      })
    }
  }, [open, settings, reset])

  async function onSubmit(values: WaterSettingsFormValues) {
    await update.mutateAsync(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Water settings</DialogTitle>
          <DialogDescription>
            Your daily goal, preferred unit, and one-tap quick amounts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="water-goal">Daily goal</Label>
            <div className="flex gap-2">
              <Input
                id="water-goal"
                type="number"
                inputMode="numeric"
                min={100}
                max={10000}
                {...register("water_goal_ml")}
                aria-describedby={errors.water_goal_ml ? "water-goal-err" : undefined}
              />
              <Select
                value={unit}
                onValueChange={(v) =>
                  setValue("water_unit", v as WaterSettingsFormValues["water_unit"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger aria-label="Unit" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="oz">oz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.water_goal_ml && (
              <p id="water-goal-err" className="text-sm text-destructive">
                {errors.water_goal_ml.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Quick amounts</Label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <Input
                  key={i}
                  type="number"
                  inputMode="numeric"
                  min={50}
                  max={5000}
                  placeholder="Amount"
                  aria-label={`Quick amount ${i + 1}`}
                  {...register(`water_quick_amounts.${i}`)}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save settings"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
