"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  NotebookPen,
  Repeat,
  Settings,
  Droplet,
  Wallet,
  MoreHorizontal,
  Search,
  Radar,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/features/search/global-search";
import { InstallPrompt } from "@/components/install-prompt";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/lib/types";

/* HUNTER HQ NAV — Solo Leveling mapping */
const NAV = [
  {
    href: "/dashboard",
    label: "DOSSIER",
    sub: "Hunter HQ",
    icon: LayoutDashboard,
  },
  { href: "/analytics", label: "CODEX", sub: "System Stats", icon: Radar },
  { href: "/habits", label: "DAILY QUESTS", sub: "Check-ins", icon: Repeat },
  { href: "/tasks", label: "GATES", sub: "Missions", icon: ListChecks },
  { href: "/notes", label: "ARCHIVES", sub: "Intel", icon: FileText },
  { href: "/diary", label: "SHADOW LOG", sub: "Diary", icon: BookOpen },
  { href: "/journal", label: "CHRONICLE", sub: "Journal", icon: NotebookPen },
  { href: "/expenses", label: "VAULT", sub: "Gold", icon: Wallet },
  { href: "/water", label: "VITALS", sub: "HP / Mana", icon: Droplet },
];

const MOBILE_PRIMARY = [
  { href: "/dashboard", label: "Dossier", icon: LayoutDashboard },
  { href: "/analytics", label: "Codex", icon: Radar },
  { href: "/tasks", label: "Gates", icon: ListChecks },
  { href: "/expenses", label: "Vault", icon: Wallet },
  { href: "/water", label: "Vitals", icon: Droplet },
];

const MOBILE_MORE = [
  { href: "/habits", label: "Quests", icon: Repeat },
  { href: "/diary", label: "Shadow Log", icon: BookOpen },
  { href: "/journal", label: "Chronicle", icon: NotebookPen },
  { href: "/notes", label: "Archives", icon: FileText },
];

function NavLinks({ pathname }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav
      className="flex flex-col items-center gap-1 xl:items-stretch"
      aria-label="Primary"
    >
      {NAV.map(({ href, label, sub, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            title={`${label} — ${sub}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 text-xs font-bold tracking-widest transition-all active:scale-[0.98]",
              "size-11 justify-center p-0 xl:h-auto xl:w-auto xl:justify-start xl:px-3 xl:py-2.5 xl:rounded-md",
              active
                ? "text-primary bg-primary/10 border border-primary/30 shadow-[0_0_14px_rgba(168,85,247,0.22)] xl:shadow-[0_0_10px_rgba(168,85,247,0.18)]"
                : "text-muted-foreground border border-transparent hover:text-primary hover:bg-primary/5 hover:border-primary/20",
            )}
          >
            <span
              className={cn(
                "grid place-items-center rounded border transition-colors xl:size-7 xl:shrink-0",
                active
                  ? "size-7 bg-primary/15 border-primary/30 text-primary shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                  : "size-7 bg-muted/20 border-primary/10 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary",
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="hidden xl:flex xl:flex-col xl:items-start xl:leading-none">
              <span>{label}</span>
              <span className="text-[0.58rem] font-mono font-normal tracking-wide text-muted-foreground/70">
                {sub}
              </span>
            </span>
            {active && (
              <span
                aria-hidden
                className="absolute right-0 top-1/2 hidden h-6 w-0.5 -translate-y-1/2 bg-primary shadow-[0_0_8px_rgba(168,85,247,0.8)] xl:block"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  const isMoreActive = MOBILE_MORE.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/20 bg-background/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        aria-hidden
      />
      <div className="flex items-center justify-around px-1 py-2">
        {MOBILE_PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 transition-colors border",
                active
                  ? "text-primary bg-primary/10 border-primary/25 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  : "text-muted-foreground border-transparent",
              )}
            >
              <Icon className="size-4.5" aria-hidden />
              <span className="text-[0.58rem] font-mono font-bold tracking-widest leading-none">
                {label.toUpperCase()}
              </span>
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 transition-colors border",
              isMoreActive
                ? "text-primary bg-primary/10 border-primary/25"
                : "text-muted-foreground border-transparent",
            )}
          >
            <MoreHorizontal className="size-4.5" aria-hidden />
            <span className="text-[0.58rem] font-mono font-bold tracking-widest leading-none">
              MORE
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            sideOffset={12}
            align="center"
            className="hud-frame rounded-lg"
          >
            {MOBILE_MORE.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <DropdownMenuItem
                  key={href}
                  render={
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2.5 font-mono text-xs tracking-widest",
                        active && "text-primary",
                      )}
                    />
                  }
                >
                  <Icon className="size-4" aria-hidden />
                  {label.toUpperCase()}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

export function AppShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = (profile?.full_name || "PLAYER")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar — HUNTER HQ */}
      <aside className="sticky top-0 hidden h-dvh w-20 shrink-0 flex-col items-center border-r border-primary/15 bg-sidebar/90 py-4 backdrop-blur xl:w-60 xl:items-stretch xl:px-3 md:flex">
        <div className="flex flex-1 flex-col items-center gap-2 xl:items-stretch w-full">
          <NavLinks pathname={pathname} />
          <div className="mt-1 flex justify-center xl:justify-stretch xl:px-1">
            <div className="flex w-full items-center gap-2 rounded-md border border-primary/15 bg-primary/[0.04] px-2 py-1.5 xl:py-2">
              <span className="hidden xl:inline text-xs font-mono tracking-widest text-muted-foreground">
                SEARCH
              </span>
              <span className="ml-auto hidden xl:inline-flex">
                <GlobalSearch iconOnly />
              </span>
              <span className="xl:hidden">
                <GlobalSearch iconOnly />
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/settings"
          aria-label="System Settings"
          title="System Settings"
          aria-current={pathname === "/settings" ? "page" : undefined}
          className={cn(
            "group flex items-center gap-3 text-xs font-bold tracking-widest transition-colors",
            "size-11 justify-center p-0 xl:h-auto xl:w-auto xl:justify-start xl:px-3 xl:py-2.5 xl:rounded-md border xl:border",
            pathname === "/settings"
              ? "text-primary bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
              : "text-muted-foreground border-transparent hover:text-primary hover:bg-primary/5 hover:border-primary/20",
          )}
        >
          <span
            className={cn(
              "grid place-items-center rounded border xl:size-7",
              pathname === "/settings"
                ? "size-7 bg-primary/15 border-primary/30 text-primary"
                : "size-7 bg-muted/20 border-primary/10 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary",
            )}
          >
            <Settings className="size-4" aria-hidden />
          </span>
          <span className="hidden xl:inline">SYSTEM</span>
        </Link>

        <div className="mt-3 flex w-full flex-col items-center gap-2 rounded-lg border border-primary/15 bg-card/60 px-2 py-2 backdrop-blur xl:flex-row xl:px-2.5">
          <Avatar
            className="size-9 shrink-0 border border-primary/25 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
            title={profile?.full_name || "Hunter"}
          >
            <AvatarFallback className="bg-primary/15 text-xs font-mono font-bold tracking-widest text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 flex-1 xl:block leading-tight">
            <p className="truncate text-xs font-bold tracking-wide text-foreground">
              {profile?.full_name || "Hunter"}
            </p>
            <p className="font-mono text-[0.62rem] tracking-widest text-primary">
              PLAYER
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            title="Sign out"
            onClick={signOut}
            className="size-7"
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </aside>

      {/* Mobile top bar — shows your name (Hunter → fullname) */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-primary/15 bg-background/90 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2.5 backdrop-blur md:hidden">
          <span className="min-w-0 flex-1 truncate text-sm font-bold tracking-wide text-foreground">
            {profile?.full_name?.trim() || "Hunter"}
          </span>
          <div className="flex items-center gap-1">
            <GlobalSearch iconOnly />
            <Link
              href="/settings"
              aria-label="System Settings"
              className="grid size-8 place-items-center rounded border border-primary/15 text-muted-foreground hover:text-primary hover:border-primary/25"
            >
              <Settings className="size-4" aria-hidden />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-24 md:p-7">
          <div>{children}</div>
        </main>
      </div>
      <MobileBottomNav pathname={pathname} />
      <InstallPrompt />
    </div>
  );
}
