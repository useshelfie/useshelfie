"use client" // Needs to be client for hooks, DND, virtualization

import React, { useMemo } from "react"
import { type ProductDatabaseData } from "@/schemas/productSchema"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SkeletonLoader } from "@/components/ui/skeleton-loader"
import { ProductCardDragAndDrop } from "./product-card"

// Modified droppable column components to include search
interface DroppableColumnProps {
  id: string
  title: string
  products: ProductDatabaseData[] | undefined
  isLoading: boolean
  isError: boolean
  catalogId: number | null
  searchTerm?: string
  onSearchChange?: (value: string) => void
  onAddProduct?: (productId: string) => void
  onRemoveProduct?: (productId: string) => void
  showSearch?: boolean
}

export function DroppableColumn({
  id,
  title,
  products,
  isLoading,
  isError,
  catalogId,
  searchTerm = "",
  onSearchChange,
  onAddProduct,
  onRemoveProduct,
  showSearch = false,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: {
      type: "column",
      accepts: "product",
      catalogId: catalogId,
    },
  })

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!products || !searchTerm.trim()) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [products, searchTerm])

  return (
    <Card className={`flex-1 flex flex-col border ${isOver ? "border-primary border-dashed" : ""}`} ref={setNodeRef}>
      <CardHeader className={`${showSearch ? "pb-2" : ""}`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {filteredProducts && <Badge variant="outline">{filteredProducts.length}</Badge>}
        </div>

        {/* Optional search input */}
        {showSearch && (
          <div className="mt-2 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <SkeletonLoader key={i} height={70} className="mb-2" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="text-sm text-destructive h-full flex items-center justify-center">
            Failed to load products
          </div>
        )}

        {!isLoading && !isError && (
          <ScrollArea className="flex-1 pr-3 -mr-3">
            <SortableContext items={filteredProducts?.map((p) => p.id) ?? []} strategy={verticalListSortingStrategy}>
              {filteredProducts && filteredProducts.length > 0 ? (
                <div className="space-y-1">
                  {filteredProducts.map((product) => (
                    <ProductCardDragAndDrop
                      key={product.id}
                      product={product}
                      isInCatalog={id === "catalog-products"}
                      isDraggable={true}
                      onAdd={onAddProduct}
                      onRemove={onRemoveProduct}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground h-20 flex items-center justify-center">
                  {searchTerm.trim()
                    ? "No matching products found"
                    : id === "catalog-products"
                      ? "Drag products here or use the + button"
                      : "No available products"}
                </div>
              )}
            </SortableContext>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
