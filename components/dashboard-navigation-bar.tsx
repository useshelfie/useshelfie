import { SidebarTrigger } from './ui/sidebar'

export default async function DashboardNavigationBar() {
	return (
		<nav className="bg-sidebar border-sidebar h-16 flex items-center justify-between px-4 shadow-sm">
			<div className="text-lg font-bold">
				<SidebarTrigger className="text-black" />
			</div>
		</nav>
	)
}
