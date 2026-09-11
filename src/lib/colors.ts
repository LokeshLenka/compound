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