export const dynamic = "force-dynamic"

import { CategoryList } from "./_components/category-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateCategoryForm } from "@/components/forms/category"
import { Suspense } from "react"
import { getCachedCategories } from "@/lib/data/cache"

export default function CategoriesDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-semibold">Manage Categories</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CreateCategoryForm />

        <Card>
          <CardHeader>
            <CardTitle>Your Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-md dark:bg-gray-800"></div>
                    </div>
                  ))}
                </div>
              }>
              <CategoriesWrapper />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function CategoriesWrapper() {
  const categories = await getCachedCategories()

  if (!categories?.length) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No categories yet. Create your first one!</p>
      </div>
    )
  }

  return <CategoryList categories={categories} />
}
