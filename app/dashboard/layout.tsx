import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Suspense } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import DashboardNavigationBar from "@/components/dashboard-navigation-bar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<SidebarProvider>
			<DashboardSidebar />
			<SidebarInset>
				<DashboardNavigationBar />
				<Suspense
					fallback={
						<div className="flex items-center justify-center min-h-[50vh]">
							<LoadingSpinner size="lg" />
						</div>
					}
				>
					<div>{children}</div>
				</Suspense>
			</SidebarInset>
		</SidebarProvider>
	)
}
