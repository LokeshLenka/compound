"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  NotebookPen,
  Repeat,
  Sun,
  Settings,
  Droplet,
  Wallet,
  MoreHorizontal,
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

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/diary", label: "Diary", icon: BookOpen },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/water", label: "Water", icon: Droplet },
];

const MOBILE_PRIMARY = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/water", label: "Water", icon: Droplet },
];

const MOBILE_MORE = [
  { href: "/diary", label: "Diary", icon: BookOpen },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/notes", label: "Notes", icon: FileText },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav
      className="flex flex-col items-center gap-1.5 xl:items-stretch xl:gap-1"
      aria-label="Primary"
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-label={label}
            title={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-full text-sm font-medium transition-colors active:scale-95",
              "size-11 justify-center p-0 xl:h-auto xl:w-auto xl:justify-start xl:px-2 xl:py-1.5",
              active
                ? "bg-primary text-primary-foreground shadow-sm xl:bg-accent/70 xl:text-accent-foreground xl:shadow-none"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground xl:hover:bg-accent/50",
            )}
          >
            <span
              className={cn(
                "grid place-items-center rounded-full transition-colors xl:size-8 xl:shrink-0",
                active
                  ? "xl:bg-primary xl:text-primary-foreground xl:shadow-sm"
                  : "xl:bg-muted/60 xl:text-muted-foreground xl:group-hover:bg-muted",
              )}
            >
              <Icon className="size-5 xl:size-4" aria-hidden />
            </span>
            <span className="hidden truncate xl:inline">{label}</span>
            {active && (
              <span
                aria-hidden
                className="absolute -bottom-0.5 size-1 rounded-full bg-current xl:hidden"
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-2 py-3">
        {MOBILE_PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              <span className="text-[0.625rem] font-semibold leading-none">
                {label}
              </span>
              {/* {active && (
                <span className="mt-0.5 size-1 rounded-full bg-primary" />
              )} */}
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 transition-colors",
              isMoreActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="size-5" aria-hidden />
            <span className="text-[0.625rem] font-semibold leading-none">
              More
            </span>
            {isMoreActive && (
              <span className="mt-0.5 size-1 rounded-full bg-primary" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            sideOffset={12}
            align="center"
            className="rounded-2xl"
          >
            {MOBILE_MORE.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <DropdownMenuItem
                  key={href}
                  render={
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2.5",
                        active && "text-primary",
                      )}
                    />
                  }
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </Button>
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

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar: icon rail on md, labeled rail on xl */}
      <aside className="sticky top-0 hidden h-dvh w-20 shrink-0 flex-col items-center border-r border-border/60 bg-sidebar/60 py-4 backdrop-blur md:flex xl:w-60 xl:items-stretch xl:px-4">
        <div className="mt-2 flex flex-1 flex-col items-center xl:items-stretch">
          <NavLinks pathname={pathname} />
          <div className="mt-4 flex justify-center xl:justify-stretch xl:[&_button]:w-full">
            <GlobalSearch iconOnly />
          </div>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          title="Settings"
          aria-current={pathname === "/settings" ? "page" : undefined}
          className={cn(
            "group relative flex items-center gap-3 rounded-full text-sm font-medium transition-colors active:scale-95",
            "size-11 justify-center p-0 xl:h-auto xl:w-auto xl:justify-start xl:px-2 xl:py-1.5",
            pathname === "/settings"
              ? "bg-primary text-primary-foreground shadow-sm xl:bg-accent/70 xl:text-accent-foreground xl:shadow-none"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground xl:hover:bg-accent/50",
          )}
        >
          <span
            className={cn(
              "grid place-items-center rounded-full transition-colors xl:size-8 xl:shrink-0",
              pathname === "/settings"
                ? "xl:bg-primary xl:text-primary-foreground xl:shadow-sm"
                : "xl:bg-muted/60 xl:text-muted-foreground xl:group-hover:bg-muted",
            )}
          >
            <Settings className="size-5 xl:size-4" aria-hidden />
          </span>
          <span className="hidden truncate xl:inline">Settings</span>
          {pathname === "/settings" && (
            <span
              aria-hidden
              className="absolute -bottom-0.5 size-1 rounded-full bg-current xl:hidden"
            />
          )}
        </Link>
        <div className="mt-3 flex flex-col items-center gap-1 rounded-full bg-card/70 px-1.5 py-2 ring-1 ring-border/50 xl:flex-row xl:gap-2 xl:px-2 xl:py-1.5">
          <Avatar
            className="size-9 shrink-0"
            title={profile?.full_name || "User"}
          >
            <AvatarFallback className="bg-accent text-xs text-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 flex-1 xl:block">
            <p className="truncate text-sm font-medium">
              {profile?.full_name || "User"}
            </p>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            title="Sign out"
            onClick={signOut}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border/60 bg-background/85 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur md:hidden">
          <span className="font-semibold tracking-tight">Compound</span>
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <GlobalSearch iconOnly />
            <ThemeToggle />
            <Link
              href="/settings"
              aria-label="Settings"
              title="Settings"
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
