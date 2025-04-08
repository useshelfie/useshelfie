'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Suspense, useTransition } from 'react'
import { LoadingSpinner } from './loading-spinner'

const routes = [
	{
		label: 'Dashboard',
		href: '/dashboard',
	},
	{
		label: 'Categories',
		href: '/dashboard/categories',
	},
	{
		label: 'Products',
		href: '/dashboard/products',
	},
] as const

export function Sidebar() {
	const pathname = usePathname()
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	const handleClick = (href: string) => {
		startTransition(() => {
			router.push(href)
		})
	}

	return (
		<div className="space-y-4 flex flex-col h-full relative">
			{isPending && (
				<div className="absolute inset-0 flex items-center justify-center">
					<LoadingSpinner size="lg" />
				</div>
			)}

			<div className="p-3 flex-1 flex justify-center">
				<div className="space-y-2">
					{routes.map((route) => (
						<Link
							key={route.href}
							href={route.href}
							onClick={() => handleClick(route.href)}
							prefetch={true}
							className={cn(
								'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition',
								pathname === route.href ? 'text-primary' : 'text-zinc-400',
								isPending && 'pointer-events-none opacity-50'
							)}
						>
							<div className="flex items-center flex-1">
								<span>{route.label}</span>
							</div>
						</Link>
					))}
				</div>
			</div>
		</div>
	)
}

export function SidebarWithSuspense() {
	return (
		<Suspense
			fallback={
				<div className="h-full w-full flex items-center justify-center">
					<LoadingSpinner size="lg" />
				</div>
			}
		>
			<Sidebar />
		</Suspense>
	)
}
