import { SidebarWithSuspense } from '@/components/ui/sidebar'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import DashboardNavigationBar from '@/components/dashboard-navigation-bar'

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="h-full relative">
			<div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
				<SidebarWithSuspense />
			</div>
			<main className="md:pl-72 min-h-screen">
				<DashboardNavigationBar />
				<Suspense
					fallback={
						<div className="flex items-center justify-center min-h-[50vh]">
							<LoadingSpinner size="lg" />
						</div>
					}
				>
					<div className="relative">{children}</div>
				</Suspense>
			</main>
		</div>
	)
}
