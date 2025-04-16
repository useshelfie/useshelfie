"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge" // For displaying categories
import { redirect } from "next/navigation"
import { formatPrice } from "@/lib/utils"
import { ProductWithDetails } from "@/lib/data/products"
import React from "react"
import { type ProductDatabaseData } from "@/schemas/productSchema"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Plus, DollarSign, Trash2, Grip } from "lucide-react"

interface Props {
  product: ProductWithDetails
  sellerId: string
}

export function ProductCard({ product, sellerId }: Props) {
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

// Product List components optimized for both desktop and mobile
interface ProductCardProps {
  product: ProductDatabaseData
  isInCatalog: boolean
  onAdd?: (productId: string) => void
  onRemove?: (productId: string) => void
  isDraggable?: boolean
}

// Enhanced product card that works both for drag-and-drop and for mobile tap interactions
export function ProductCardDragAndDrop({
  product,
  isInCatalog,
  onAdd,
  onRemove,
  isDraggable = false,
}: ProductCardProps) {
  // Only use the sortable hook if the product is draggable (desktop mode)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = isDraggable
    ? useSortable({
        id: product.id,
        data: {
          type: "product",
          productName: product.name,
          catalogId: product.catalog_id,
        },
      })
    : { attributes: {}, listeners: {}, setNodeRef: null, transform: null, transition: null, isDragging: false }

  // Determine styles based on whether this is draggable
  const style = isDraggable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
        touchAction: "none",
      }
    : {}

  // The actual component to render
  const cardContent = (
    <div
      className={`relative rounded-md border p-3 mb-2 hover:shadow-sm transition-shadow ${isInCatalog ? "bg-primary/5" : "bg-card"}`}>
      <div className="flex justify-between">
        <div className="flex-1 mr-2">
          <div className="font-medium line-clamp-1">{product.name}</div>
          {product.price != null && (
            <div className="text-sm text-muted-foreground flex items-center mt-1">
              <DollarSign className="h-3 w-3 mr-1" />
              {product.price}
            </div>
          )}
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>

        {/* Action buttons depend on if we're in catalog or not */}
        <div className="flex items-start space-x-1">
          {isDraggable && isInCatalog && (
            <div className="cursor-grab text-muted-foreground hover:text-primary p-1">
              <Grip className="h-4 w-4" />
            </div>
          )}

          {!isDraggable &&
            (isInCatalog ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onRemove?.(product.id)}
                title="Remove from catalog">
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary hover:text-primary"
                onClick={() => onAdd?.(product.id)}
                title="Add to catalog">
                <Plus className="h-4 w-4" />
              </Button>
            ))}
        </div>
      </div>
    </div>
  )

  // If the product is draggable, we need to wrap it with the necessary refs and listeners
  return isDraggable && setNodeRef ? (
    <div ref={setNodeRef} style={style as React.CSSProperties} {...attributes} {...listeners}>
      {cardContent}
    </div>
  ) : (
    cardContent
  )
}

// This will wrap both the draggable and non-draggable components
export function DraggableProductItem({
  product,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isOverlay = false,
}: {
  product: ProductDatabaseData
  isOverlay?: boolean
}) {
  return <ProductCardDragAndDrop product={product} isInCatalog={true} isDraggable={true} />
}
