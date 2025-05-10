import { Skeleton } from "@/components/ui/skeleton"

export function SidebarSkeleton() {
  return (
    <div className="w-64 border-r border-border h-screen p-4 flex flex-col">
      <div className="flex items-center mb-8">
        <Skeleton className="h-8 w-8 rounded-lg mr-2" />
        <div className="flex flex-col">
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="space-y-4 flex-1">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
        <div className="pt-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={`sys-${i}`} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="mt-auto border border-border rounded-md p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}
