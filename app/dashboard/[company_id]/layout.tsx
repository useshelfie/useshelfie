import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Suspense } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import DashboardNavigationBar from "@/components/dashboard-navigation-bar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { company_id: string }
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={<SidebarSkeleton />}>
        <DashboardSidebar companyId={params.company_id} />
      </Suspense>

      <SidebarInset>
        <Suspense fallback={<NavigationBarSkeleton />}>
          <DashboardNavigationBar />
        </Suspense>

        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[50vh]">
              <LoadingSpinner size="lg" />
            </div>
          }>
          <div>{children}</div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}

function SidebarSkeleton() {
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
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        <div className="pt-4">
          {[...Array(2)].map((_, i) => <Skeleton key={`sys-${i}`} className="h-8 w-full" />)}
        </div>
      </div>
      <div className="mt-auto border border-border rounded-md p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

function NavigationBarSkeleton() {
  return (
    <nav className="bg-sidebar border-sidebar h-16 flex items-center justify-between px-4 shadow-sm">
      <Skeleton className="h-6 w-6" />
      <Skeleton className="h-8 w-40" />
    </nav>
  )
}
