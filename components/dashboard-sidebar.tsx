import {
	Calendar,
	GalleryVerticalEnd,
	Home,
	Inbox,
	Search,
	Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

// Menu items.
const items = [
	{
		title: 'Main',
		url: '/dashboard/',
		icon: Home,
	},
	{
		title: 'Products',
		url: '/dashboard/products',
		icon: Inbox,
	},
	{
		title: 'Categories',
		url: '/dashboard/categories',
		icon: Calendar,
	},
]

const systemItems = [
	{
		title: 'Settings',
		url: '/dashboard/settings',
		icon: Settings,
	},
	{
		title: 'Search',
		url: '/dashboard/search',
		icon: Search,
	},
]

export async function DashboardSidebar() {
	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	return (
		<Sidebar>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="#">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<GalleryVerticalEnd className="size-4" />
								</div>
								<div className="flex flex-col gap-0.5 leading-none">
									<span className="font-semibold">Shelfie</span>
									<span className="">v1.0.0</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Seller</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<a href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>System</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{systemItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<a href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<div>
					<p className="text-sm text-muted-foreground">
						Logged in as:{' '}
						<strong className="font-medium text-foreground">
							{user?.email}
						</strong>
					</p>
				</div>
			</SidebarFooter>
		</Sidebar>
	)
}
