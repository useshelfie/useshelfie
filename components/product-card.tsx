"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge" // For displaying categories
import { redirect } from "next/navigation"
import { formatPrice } from "@/lib/utils"
import { ProductWithDetails } from "@/lib/data/products"

interface Props {
  product: ProductWithDetails
  sellerId: string
}

export default function ProductCard({ product, sellerId }: Props) {
  return (
    <Card
      key={product.id}
      className="cursor-pointer"
      onClick={() => {
        redirect(`/sellers/${sellerId}/${product.id}`)
      }}>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription className="pt-1 font-semibold text-lg text-primary">
          {formatPrice(product.price)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {product.description && <p className="mb-4 text-muted-foreground">{product.description}</p>}
        {product.categories && product.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium">Categories:</span>
            {product.categories.map((category) => (
              <Badge key={category.id} variant="secondary">
                {category.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
