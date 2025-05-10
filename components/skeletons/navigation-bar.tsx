import { Skeleton } from "@/components/ui/skeleton"

export function NavigationBarSkeleton() {
  return (
    <nav className="bg-sidebar border-sidebar h-16 flex items-center justify-between px-4 shadow-sm">
      <Skeleton className="h-6 w-6" />
      <Skeleton className="h-8 w-40" />
    </nav>
  )
}
