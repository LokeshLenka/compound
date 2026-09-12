export const HABIT_COLORS = [
  { name: "slate", swatch: "bg-slate-400" },
  { name: "red", swatch: "bg-red-500" },
  { name: "orange", swatch: "bg-orange-500" },
  { name: "amber", swatch: "bg-amber-500" },
  { name: "green", swatch: "bg-green-500" },
  { name: "emerald", swatch: "bg-emerald-500" },
  { name: "teal", swatch: "bg-teal-500" },
  { name: "sky", swatch: "bg-sky-500" },
  { name: "blue", swatch: "bg-blue-500" },
  { name: "violet", swatch: "bg-violet-500" },
  { name: "fuchsia", swatch: "bg-fuchsia-500" },
  { name: "pink", swatch: "bg-pink-500" },
] as const

export function colorSwatch(name: string | undefined): string {
  return HABIT_COLORS.find((c) => c.name === name)?.swatch ?? "bg-slate-400"
}

export function colorText(name: string | undefined): string {
  return HABIT_COLORS.find((c) => c.name === name)?.swatch.replace("bg-", "text-") ?? "text-slate-400"
}

export const HABIT_SOFT: Record<string, string> = {
  slate: "bg-slate-400/20 text-slate-700 dark:bg-slate-400/20 dark:text-slate-200",
  red: "bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  orange: "bg-orange-500/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  amber: "bg-amber-500/20 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300",
  green: "bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  emerald: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  teal: "bg-teal-500/15 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  sky: "bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  blue: "bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  violet: "bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
  pink: "bg-pink-500/15 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
}

export function colorSoft(name: string | undefined): string {
  return HABIT_SOFT[name ?? ""] ?? HABIT_SOFT.slate
}