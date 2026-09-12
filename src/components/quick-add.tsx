"use client"

import { useRouter } from "next/navigation"
import { Plus, Repeat, ListChecks, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateFab } from "@/components/create-fab"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ACTIONS = [
  { label: "Habit", href: "/habits?create=1", icon: Repeat },
  { label: "Task", href: "/tasks?create=1", icon: ListChecks },
  { label: "Note", href: "/notes?create=1", icon: FileText },
]

function QuickAddItems() {
  const router = useRouter()
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>Quick add</DropdownMenuLabel>
      {ACTIONS.map((a) => (
        <DropdownMenuItem key={a.href} onClick={() => router.push(a.href)}>
          <a.icon className="size-4 text-muted-foreground" />
          New {a.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  )
}

export function QuickAdd() {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" className="w-40">
            <QuickAddItems />
          </DropdownMenuContent>
        </DropdownMenuPortal>
        <DropdownMenuTrigger
          render={
            <Button className="hidden md:inline-flex">
              <Plus className="mr-1 size-4" /> Quick add
            </Button>
          }
        />
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" className="w-40">
            <QuickAddItems />
          </DropdownMenuContent>
        </DropdownMenuPortal>
        <DropdownMenuTrigger
          render={<CreateFab label="Quick add" onClick={() => {}} />}
        />
      </DropdownMenu>
    </>
  )
}