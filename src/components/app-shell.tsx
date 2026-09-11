"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Moon,
  Repeat,
  Sun,
  Settings,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { GlobalSearch } from "@/features/search/global-search"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import type { Profile } from "@/lib/types"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/diary", label: "Diary", icon: BookOpen },
]

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  )
}

export function AppShell({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: Profile | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r bg-card p-3 md:flex">
        <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            H
          </span>
          Personal Hub
        </Link>
        <div className="mt-4 flex-1">
          <NavLinks pathname={pathname} />
          <div className="mt-3 px-3">
            <GlobalSearch />
          </div>
        </div>
        <Separator className="my-2" />
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
            pathname === "/settings" && "bg-accent text-accent-foreground",
          )}
        >
          <Settings className="size-4" />
          Settings
        </Link>
        <div className="mt-2 flex items-center gap-2 px-2">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.full_name || "User"}</p>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/80 px-4 py-2 backdrop-blur md:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-64 p-4">
              <p className="px-3 py-2 font-semibold">Personal Hub</p>
              <div className="mt-2">
                <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
              </div>
              <Separator className="my-3" />
              <div className="flex items-center gap-2 px-3">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{profile?.full_name || "User"}</span>
                <div className="ml-auto flex items-center">
                  <ThemeToggle />
                  <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
                    <LogOut className="size-4" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Personal Hub</span>
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <Link href="/settings" aria-label="Settings">
              <Settings className="size-4" />
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}