import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { unstable_cache } from 'next/cache'

async function getStats() {
	const supabase = await createClient()
	return unstable_cache(
		async () => {
			const [{ count: productsCount }, { count: categoriesCount }] =
				await Promise.all([
					supabase.from('products').select('*', { count: 'exact', head: true }),
					supabase
						.from('categories')
						.select('*', { count: 'exact', head: true }),
				])

			return {
				productsCount: productsCount || 0,
				categoriesCount: categoriesCount || 0,
			}
		},
		['dashboard-stats'],
		{
			revalidate: 60, // Cache for 60 seconds
			tags: ['products', 'categories'],
		}
	)()
}

export default function DashboardPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-semibold mb-8">Dashboard Overview</h1>

			<Suspense fallback={<DashboardSkeleton />}>
				<DashboardContent />
			</Suspense>
		</div>
	)
}

function DashboardSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			{[...Array(2)].map((_, i) => (
				<Card key={i}>
					<CardHeader>
						<div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
						<div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-2" />
					</CardHeader>
					<CardContent>
						<div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
					</CardContent>
				</Card>
			))}
		</div>
	)
}

async function DashboardContent() {
	const stats = await getStats()

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<Card>
				<CardHeader>
					<CardTitle>Products</CardTitle>
					<CardDescription>Total number of products</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-bold">{stats.productsCount}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Categories</CardTitle>
					<CardDescription>Total number of categories</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-bold">{stats.categoriesCount}</p>
				</CardContent>
			</Card>
		</div>
	)
}
