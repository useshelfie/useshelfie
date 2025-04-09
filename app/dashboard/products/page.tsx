export const dynamic = "force-dynamic"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { getCachedProducts } from "@/lib/data/cache"

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button asChild>
          <Link href="/dashboard/products/create" prefetch={true}>
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
        <ProductsList />
      </Suspense>
    </div>
  )
}

function ProductSkeleton() {
  return (
    <Card className="p-4">
      <div className="animate-pulse space-y-4">
        <div className="aspect-square relative rounded-md bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded dark:bg-gray-800 w-3/4" />
          <div className="h-4 bg-gray-200 rounded dark:bg-gray-800 w-1/2" />
        </div>
      </div>
    </Card>
  )
}

async function ProductsList() {
  const products = await getCachedProducts()

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/products/create" prefetch={true}>
            Create your first product
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/dashboard/products/${product.id}`}
          className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
          prefetch={true}>
          <Card className="h-full hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="aspect-square relative mb-4 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                {product.image_url ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={false}
                      quality={75}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}
              </div>
              <h3 className="font-medium mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              <div className="mt-2 flex gap-2 flex-wrap">
                {product.categories?.map((category: { name: string; id: string }) => (
                  <span
                    key={category.id}
                    className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800">
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
