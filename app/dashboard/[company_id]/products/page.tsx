export const dynamic = "force-dynamic"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Suspense } from "react"
import { Metadata } from "next"
import { ProductsList } from "@/components/lists/product"
import { ProductSkeleton } from "@/components/skeletons/product"

export const metadata: Metadata = {
  title: "Products",
  description: "Products",
}

export default async function ProductsPage({ params }: { params: { company_id: string } }) {
  const companyId = params.company_id

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button asChild>
          <Link href={`/dashboard/${companyId}/products/create`} prefetch={true}>
            Add Product
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        }>
        <ProductsList companyId={companyId} />
      </Suspense>
    </div>
  )
}
