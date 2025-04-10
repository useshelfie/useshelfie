import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"

export default async function ProductPage({
  params,
}: {
  params: { product_id: string; company_id: string }
}) {
  const supabase = await createClient()
  
  // Fetch product with its categories
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      product_categories (
        category:categories (
          id,
          name
        )
      )
    `)
    .eq("id", params.product_id)
    .single()

  if (error || !product) {
    console.error("Error fetching product:", error)
    notFound()
  }

  // Extract categories from the nested structure
  const categories = product.product_categories
    ?.map((pc: any) => pc.category)
    .filter(Boolean) || []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href={`/dashboard/${params.company_id}/products`}>
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                {product.image_links && product.image_links.length > 0 ? (
                  <div className="aspect-square relative rounded-lg overflow-hidden border">
                    <Image
                      src={product.image_links[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">No image available</p>
                  </div>
                )}
                {product.image_links && product.image_links.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.image_links.slice(1).map((url: string, i: number) => (
                      <div key={i} className="aspect-square relative rounded-lg overflow-hidden border">
                        <Image
                          src={url}
                          alt={`${product.name} - Image ${i + 2}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 12vw"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold">{product.name}</h1>
                  <p className="text-2xl font-semibold mt-2 text-primary">
                    {formatPrice(product.price)}
                  </p>
                </div>

                {product.description && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Description</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                )}

                {categories.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Categories</h2>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category: { id: string; name: string }) => (
                        <span
                          key={category.id}
                          className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6">
                  <Button className="w-full">Edit Product</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
