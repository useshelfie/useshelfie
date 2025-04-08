import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card"
import { unstable_cache } from "next/cache"

interface DashboardStats {
	productsCount: number
	categoriesCount: number
}

async function fetchDashboardStats(): Promise<DashboardStats> {
	const supabase = await createClient()
	return unstable_cache(
		async () => {
			try {
				const [{ count: productsCount }, { count: categoriesCount }] =
					await Promise.all([
						supabase
							.from("products")
							.select("*", { count: "exact", head: true }),
						supabase
							.from("categories")
							.select("*", { count: "exact", head: true }),
					])
				return {
					productsCount: productsCount || 0,
					categoriesCount: categoriesCount || 0,
				}
			} catch (error) {
				console.error("Failed to fetch dashboard stats:", error)
				return { productsCount: 0, categoriesCount: 0 }
			}
		},
		["dashboard-stats"],
		{ revalidate: 60, tags: ["products", "categories"] }
	)()
}

export default function Dashboard() {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-semibold mb-8">Dashboard Overview</h1>
			<Suspense fallback={<DashboardSkeleton count={2} />}>
				<DashboardStats />
			</Suspense>
		</div>
	)
}

function DashboardSkeleton({ count }: { count: number }) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			{[...Array(count)].map((_, i) => (
				<Card key={i} role="region" aria-label="Loading stat">
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

async function DashboardStats() {
	const stats = await fetchDashboardStats()

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<Card role="region" aria-label="Products Count">
				<CardHeader>
					<CardTitle>Products</CardTitle>
					<CardDescription>Total number of products</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-bold">{stats.productsCount}</p>
				</CardContent>
			</Card>
			<Card role="region" aria-label="Categories Count">
				<CardHeader>
					<CardTitle>Categories</CardTitle>
					<CardDescription>
						Total number of categories
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-bold">
						{stats.categoriesCount}
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
