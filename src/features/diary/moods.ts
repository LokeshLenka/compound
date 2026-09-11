export const MOODS = [
  { value: 1, emoji: "😞", label: "Rough", bg: "bg-red-100 dark:bg-red-950" },
  { value: 2, emoji: "😕", label: "Meh", bg: "bg-orange-100 dark:bg-orange-950" },
  { value: 3, emoji: "😐", label: "Okay", bg: "bg-amber-100 dark:bg-amber-950" },
  { value: 4, emoji: "🙂", label: "Good", bg: "bg-lime-100 dark:bg-lime-950" },
  { value: 5, emoji: "😄", label: "Great", bg: "bg-green-100 dark:bg-green-950" },
] as const

export function moodEmoji(value: number | null | undefined): string {
  return MOODS.find((m) => m.value === value)?.emoji ?? ""
}