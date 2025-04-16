"use client" // Needs to be client for hooks, DND, virtualization

import React, { useMemo } from "react"
import { type ProductDatabaseData } from "@/schemas/productSchema"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SkeletonLoader } from "@/components/ui/skeleton-loader"
import { ProductCardDragAndDrop } from "./product-card"

// Mobile product list component (no drag and drop, just tap interactions)
export function MobileProductList({
  title,
  products,
  isLoading,
  isError,
  isInCatalog,
  searchTerm = "",
  onSearchChange,
  onAddProduct,
  onRemoveProduct,
  showSearch = false,
  emptyMessage,
}: {
  title: string
  products: ProductDatabaseData[] | undefined
  isLoading: boolean
  isError: boolean
  isInCatalog: boolean
  searchTerm?: string
  onSearchChange?: (value: string) => void
  onAddProduct?: (productId: string) => void
  onRemoveProduct?: (productId: string) => void
  showSearch?: boolean
  emptyMessage: string
}) {
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
    <div className="flex flex-col h-full">
      <div className={`${showSearch ? "pb-2" : ""}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {filteredProducts && <Badge variant="outline">{filteredProducts?.length}</Badge>}
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
      </div>

      <div className="flex-1 flex flex-col mt-4">
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
          <ScrollArea className="flex-1">
            {filteredProducts && filteredProducts.length > 0 ? (
              <div className="space-y-1">
                {filteredProducts.map((product) => (
                  <ProductCardDragAndDrop
                    key={product.id}
                    product={product}
                    isInCatalog={isInCatalog}
                    isDraggable={false}
                    onAdd={onAddProduct}
                    onRemove={onRemoveProduct}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground h-20 flex items-center justify-center">
                {searchTerm.trim() ? "No matching products found" : emptyMessage}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
