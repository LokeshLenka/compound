"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { DiaryEntry } from "@/lib/types"
import { humanDate } from "@/lib/dates"
import { moodEmoji } from "@/features/diary/moods"
import { bookSpread, entryFor, shiftISO } from "@/features/diary/book-model"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type TurnDir = 1 | -1

function sentence(content: string): string {
  return content.replace(/[#*_`>\-\[\]]/g, "").replace(/\s+/g, " ").trim()
}

function PaperLines({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-px w-full bg-black/[0.06] dark:bg-white/10" />
      ))}
    </div>
  )
}

function BookPage({ iso, entry }: { iso: string; entry: DiaryEntry | null }) {
  return (
    <article
      data-slot="book-page"
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden p-[6%] text-stone-800",
        "bg-[linear-gradient(135deg,#fbf7ee_0%,#f5ecd9_100%)]",
      )}
      style={{ boxShadow: "inset 0 0 24px -12px rgba(120,90,40,0.5)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgba(120,90,40,0.06) 1px, transparent 1px), repeating-linear-gradient(0deg, transparent 0 26px, rgba(120,90,40,0.05) 26px 27px)",
          backgroundSize: "3px 3px, 100% 27px",
        }}
      />
      <header className="relative flex items-center justify-between gap-2 border-b border-stone-400/40 pb-2">
        <div className="text-[clamp(0.55rem,1.4vw,0.8rem)] font-semibold uppercase tracking-[0.18em] text-stone-500">
          {humanDate(iso, "EEEE, MMM d")}
        </div>
        <span
          className="text-[clamp(0.8rem,2vw,1.2rem)]"
          aria-hidden
        >
          {moodEmoji(entry?.mood) || "·"}
        </span>
      </header>
      <div className="relative mt-3 flex-1 overflow-hidden">
        {entry ? (
          <>
            {entry.title && (
              <h3 className="font-heading text-[clamp(0.95rem,2.4vw,1.5rem)] font-semibold leading-snug text-stone-800">
                {entry.title}
              </h3>
            )}
            <p className="mt-2 text-[clamp(0.62rem,1.55vw,0.95rem)] leading-relaxed text-stone-700">
              {sentence(entry.content)}
            </p>
            {(entry.weather || entry.tags?.length) && (
              <footer className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 pt-2 text-[clamp(0.5rem,1.2vw,0.72rem)] text-stone-500">
                {entry.weather && <span>☀ {entry.weather}</span>}
                {entry.tags?.map((t) => (
                  <span key={t} className="rounded-full border border-stone-400/50 px-2 py-0.5">
                    #{t}
                  </span>
                ))}
              </footer>
            )}
          </>
        ) : (
          <>
            <p className="font-heading text-[clamp(1rem,2.5vw,1.6rem)] font-medium italic text-stone-400">
              A blank page…
            </p>
            <PaperLines count={8} className="mt-4 opacity-70" />
          </>
        )}
      </div>
    </article>
  )
}

/** Blank back-side of a turned leaf (a real sketchbook page has a paper back). */
function PageBack() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f7f1e4_0%,#efe3cd_100%)] text-stone-300">
      <div className="absolute inset-[5%] rounded-sm border border-stone-300/70" />
      <div className="font-heading text-[clamp(0.7rem,1.6vw,1.1rem)] italic text-stone-400/70">
        · personal sketches ·
      </div>
    </div>
  )
}

/**
 * A sketchbook-style diary: two pages are always open and a 3D leaf turns
 * around the spine. Purely transform/opacity driven for GPU-friendly motion,
 * and it collapses to an instant flip under prefers-reduced-motion.
 */
export function DiaryBook({
  entries,
  selectedDate,
  onSelect,
}: {
  entries: DiaryEntry[]
  selectedDate: string
  onSelect: (iso: string) => void
}) {
  const [turning, setTurning] = useState<TurnDir | null>(null)
  const timersRef = useRef<number[]>([])
  const reduced = useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", callback)
      return () => mq.removeEventListener("change", callback)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )

  const spread = useMemo(() => bookSpread(selectedDate, entries), [selectedDate, entries])

  // The static spread always shows the DESTINATION pages (the states the book
  // will land in). The leaf carries the page that is physically moving.
  const displayLeft = turning === 1 ? spread.leftIso : turning === -1 ? shiftISO(spread.leftIso, -1) : spread.leftIso
  const displayRight = turning === 1 ? shiftISO(spread.leftIso, 2) : spread.rightIso
  const leafIso = turning === 1 ? spread.rightIso : turning === -1 ? spread.leftIso : spread.rightIso

  const turnTo = useCallback(
    (dir: TurnDir) => {
      if (turning) return
      if (dir === 1 && !spread.hasNext) return
      if (dir === -1 && !spread.hasPrev) return
      const target = dir === 1 ? spread.rightIso : shiftISO(spread.leftIso, -1)
      if (reduced) {
        onSelect(target)
        return
      }
      setTurning(dir)
      timersRef.current.push(
        window.setTimeout(() => {
          setTurning(null)
          onSelect(target)
        }, 700),
      )
    },
    [onSelect, reduced, spread, turning],
  )

  useEffect(
    () => () => {
      const timers = timersRef.current
      timers.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault()
        turnTo(1)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        turnTo(-1)
      }
    },
    [turnTo],
  )

  const leafRest = turning === 1 ? "rotateY(-178deg)" : turning === -1 ? "rotateY(178deg)" : "rotateY(0deg)"

  return (
    <div className="w-full">
      <div
        role="region"
        aria-label="Diary book"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="group mx-auto max-w-4xl outline-none"
      >
        <div className="relative [perspective:2200px]" style={{ transform: "rotateX(4deg)" }}>
          <div aria-hidden className="absolute inset-x-[4%] -bottom-4 h-8 rounded-full bg-black/25 blur-2xl" />
          <div className="relative mx-[3%] grid aspect-[2/1.35] grid-cols-2 overflow-hidden rounded-[0.9rem] border border-stone-300/70 shadow-[0_24px_48px_-16px_rgba(60,40,10,0.4)]">
            {/* Left (dest) + Right (dest) */}
            <BookPage iso={displayLeft} entry={entryFor(entries, displayLeft)} />
            <BookPage iso={displayRight} entry={entryFor(entries, displayRight)} />

            {/* Spine crease */}
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(80,55,20,0.3)_45%,rgba(80,55,20,0.3)_55%,transparent)]" />

            {/* Turning leaf — always mounted at rest so the rotate transition can fire */}
            <div
              className={cn(
                "absolute inset-y-0 w-[50.4%] [transform-style:preserve-3d]",
                turning === -1 ? "left-0 [transform-origin:right_center]" : "right-0 [transform-origin:left_center]",
              )}
              style={{
                transform: leafRest,
                transition: turning ? "transform 700ms cubic-bezier(0.33, 1, 0.68, 1)" : "none",
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
                <div
                  className="absolute inset-0 overflow-hidden rounded-lg [backface-visibility:hidden]"
                  style={{ transform: "rotateY(0deg)" }}
                >
                  <BookPage iso={leafIso} entry={entryFor(entries, leafIso)} />
                </div>
                <div
                  className="absolute inset-0 overflow-hidden rounded-lg [backface-visibility:hidden]"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <PageBack />
                </div>
              </div>

            {/* Hotspots */}
            {spread.hasNext && (
              <button
                type="button"
                aria-label="Turn to next page"
                onClick={() => turnTo(1)}
                className="group/btn absolute inset-y-0 right-0 z-20 flex w-1/5 cursor-pointer items-center justify-end rounded-r-[0.9rem] bg-transparent px-3 transition-colors hover:bg-stone-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ChevronRight className="size-5 text-stone-400 opacity-0 transition-opacity group-hover/btn:opacity-100" />
              </button>
            )}
            {spread.hasPrev && (
              <button
                type="button"
                aria-label="Turn to previous page"
                onClick={() => turnTo(-1)}
                className="group/btn absolute inset-y-0 left-0 z-20 flex w-1/5 cursor-pointer items-center justify-start rounded-l-[0.9rem] bg-transparent px-3 transition-colors hover:bg-stone-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ChevronLeft className="size-5 text-stone-400 opacity-0 transition-opacity group-hover/btn:opacity-100" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          aria-label="Previous day"
          disabled={!spread.hasPrev || turning !== null}
          onClick={() => turnTo(-1)}
        >
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          {humanDate(selectedDate, "MMMM d, yyyy")}
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label="Next day"
          disabled={!spread.hasNext || turning !== null}
          onClick={() => turnTo(1)}
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}