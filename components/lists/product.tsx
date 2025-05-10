import { Card } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { getProductsByCompany } from "@/lib/data/products"

export async function ProductsList({ companyId }: { companyId: string }) {
  const products = await getProductsByCompany(companyId)

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/dashboard/${companyId}/products/${product.id}`}
          className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
          prefetch={true}>
          <Card className="h-full hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="aspect-square relative mb-4 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                {product.image_links && product.image_links.length > 0 ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={product.image_links[0]}
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
              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              )}
              <div className="mt-2 flex gap-2 flex-wrap">
                {Array.isArray(product.categories) &&
                  product.categories?.map((category: { name: string; id: number }) => (
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
