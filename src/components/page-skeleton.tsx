import { Skeleton } from "@/components/ui/skeleton"

export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-7 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="hall-divider w-full opacity-90" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    </div>
  )
}
