import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Suspense } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import DashboardNavigationBar from "@/components/shared/navigation/dashboard"
import { SidebarSkeleton } from "@/components/skeletons/sidebar"
import { NavigationBarSkeleton } from "@/components/skeletons/navigation-bar"
import { DashboardSidebar } from "@/components/shared/sidebars/dashboard"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ company_id: string }>
}) {
  const companyId = (await params).company_id

  return (
    <SidebarProvider>
      <Suspense fallback={<SidebarSkeleton />}>
        <DashboardSidebar companyId={companyId} />
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
