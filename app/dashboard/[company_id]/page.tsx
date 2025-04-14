import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { fetchDashboardStatsByCompany } from "@/lib/data/cache"
import { SkeletonCard } from "@/components/ui/skeleton-loader"

export default function Dashboard({ params }: { params: { company_id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-8">Dashboard Overview</h1>
      <Suspense fallback={<DashboardSkeleton count={2} />}>
        <DashboardStats companyId={params.company_id} />
      </Suspense>
    </div>
  )
}

function DashboardSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} aria-label="Loading stat" />
      ))}
    </div>
  )
}

async function DashboardStats({ companyId }: { companyId: string }) {
  const stats = await fetchDashboardStatsByCompany(companyId)

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
          <CardDescription>Total number of categories</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.categoriesCount}</p>
        </CardContent>
      </Card>
    </div>
  )
}
