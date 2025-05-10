export const dynamic = "force-dynamic"

import { CategoryList } from "@/components/lists/category"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryForm } from "@/components/category/forms/category"
import { Suspense } from "react"
import { getCategoriesByCompany } from "@/lib/data/categories"
import { SkeletonLoader } from "@/components/ui/skeleton-loader"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Categories",
  description: "Categories",
}

export default async function CategoriesDashboardPage({ params }: { params: Promise<{ company_id: string }> }) {
  const companyId = (await params).company_id

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-semibold">Manage Categories</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CategoryForm companyId={companyId} />

        <Card>
          <CardHeader>
            <CardTitle>Your Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <SkeletonLoader key={i} height={64} className="rounded-md" />
                  ))}
                </div>
              }>
              <CategoriesWrapper companyId={companyId} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function CategoriesWrapper({ companyId }: { companyId: string }) {
  const categories = await getCategoriesByCompany(companyId)

  if (!categories?.length) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No categories yet. Create your first one!</p>
      </div>
    )
  }

  return <CategoryList categories={categories} />
}
