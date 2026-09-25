"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  FileText,
  NotebookPen,
  Repeat,
  Crown,
  X,
} from "lucide-react";

const ITEMS = [
  { label: "Daily Quests", href: "/habits", icon: Repeat, sub: "Quests" },
  { label: "Hunter Ranks", href: "/ranks", icon: Crown, sub: "9 Levels" },
  { label: "Shadow Log", href: "/diary", icon: BookOpen, sub: "Diary" },
  { label: "Chronicle", href: "/journal", icon: NotebookPen, sub: "Journal" },
  { label: "Archives", href: "/notes", icon: FileText, sub: "Intel" },
] as const;

export function MobileStaggeredMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll when open and handle Esc
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-[#060010]/60 backdrop-blur-md md:hidden"
            onClick={onClose}
            aria-hidden={!open}
          />

          <motion.aside
            key="panel"
            id="mobile-staggered-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 z-50 flex h-dvh w-[82vw] max-w-[340px] flex-col border-l border-primary/20 bg-[#0d0a1a] shadow-[0_0_40px_rgba(0,0,0,0.6)] md:hidden"
            aria-hidden={!open}
          >
            <div className="flex items-center justify-between border-b border-primary/15 px-5 py-4">
              <div>
                <p className="font-mono text-[0.62rem] tracking-[0.18em] text-primary">
                  VAULT
                </p>
                <p className="font-rajdhani text-sm font-bold tracking-[0.16em] text-foreground">
                  EXTRA
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 place-items-center rounded border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* List anchored to bottom for thumb reach — flex-1 + justify-end keeps items near footer */}
            <div className="flex flex-1 flex-col justify-end overflow-y-auto p-5">
              <motion.ul
                className="flex flex-col gap-2 mt-auto"
                role="list"
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={{
                  show: {
                    transition: {
                      staggerChildren: 0.07,
                      delayChildren: 0.12,
                      staggerDirection: -1,
                    },
                  },
                  hidden: {
                    transition: { staggerChildren: 0.04, staggerDirection: -1 },
                  },
                }}
              >
                {ITEMS.map((it) => {
                  const active =
                    pathname === it.href || pathname.startsWith(`${it.href}/`);
                  const Icon = it.icon;
                  return (
                    <motion.li
                      key={it.href}
                      variants={{
                        hidden: { y: 28, opacity: 0 },
                        show: {
                          y: 0,
                          opacity: 1,
                          transition: {
                            duration: 0.42,
                            ease: [0.22, 1, 0.36, 1],
                          },
                        },
                      }}
                      className="overflow-hidden"
                    >
                      <Link
                        href={it.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 border px-4 py-4 text-left transition-colors min-h-[56px]",
                          active
                            ? "border-primary/30 bg-primary/15 text-primary"
                            : "border-primary/10 bg-card/40 text-foreground hover:border-primary/20 hover:bg-primary/5",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-10 place-items-center rounded-full shrink-0",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold tracking-wide">
                            {it.label}
                          </span>
                          <span className="block truncate text-xs font-mono tracking-widest text-muted-foreground">
                            {it.sub}
                          </span>
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </div>

            <div className="border-t border-primary/10 p-4">
              <button
                type="button"
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 border border-primary/20 bg-primary/10 px-4 py-3 font-mono text-xs font-bold tracking-widest text-primary hover:bg-primary/15"
              >
                <X className="size-3.5" /> CLOSE
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
